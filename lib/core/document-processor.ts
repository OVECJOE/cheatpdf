import fs from "fs";
import path from "path";
import crypto from "crypto";
import { DocumentExtractionStage } from "@prisma/client";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "@langchain/core/documents";
import { recognize } from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { vectorStore } from "./vector-store";
import db from "../config/db";

// Configure worker for Node.js environment
pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/legacy/build/pdf.worker.mjs';

/**
 * Utility functions for the document processor.
 */

/**
 * Validates a PDF file.
 * @param buffer - The PDF buffer.
 * @param fileName - The name of the file.
 * @param maxSizeMB - The maximum size of the file in MB.
 */
function validatePDF(buffer: Buffer, fileName: string, maxSizeMB = 100) {
    if (!fileName.toLowerCase().endsWith('.pdf')) throw new Error("File extension is not .pdf");
    if (buffer.subarray(0, 4).toString() !== '%PDF') throw new Error("File is not a valid PDF (bad magic number)");
    if (buffer.length > maxSizeMB * 1024 * 1024) throw new Error(`File size exceeds ${maxSizeMB}MB limit`);
}

/**
 * Sanitizes a file name.
 * @param fileName - The file name to sanitize.
 * @returns The sanitized file name.
 */
function sanitizeFileName(fileName: string): string {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 128);
}

/**
 * Checks if the text is meaningful.
 * @param text - The text to check.
 * @returns True if the text is meaningful, false otherwise.
 */
function isTextMeaningful(text: string): boolean {
    if (!text) return false;
    const clean = text.replace(/\s+/g, '');
    return clean.length > 100;
}

/**
 * Saves a buffer to a temporary file.
 * @param buffer - The buffer to save.
 * @param fileName - The name of the file.
 * @returns The path to the temporary file.
 */
function saveBufferToTempFile(buffer: Buffer, fileName: string): string {
    const tempDir = path.join('/tmp', 'cheatpdf');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const tempPath = path.join(tempDir, crypto.randomBytes(8).toString('hex') + '-' + sanitizeFileName(fileName));
    fs.writeFileSync(tempPath, buffer);
    return tempPath;
}

/**
 * Removes a temporary file.
 * @param filePath - The path to the temporary file.
 */
function removeTempFile(filePath: string) {
    try { fs.unlinkSync(filePath); } catch { }
}

/**
 * Extracts text from each page of a PDF.
 * If the text is not meaningful, it renders the page to an image and uses OCR to extract the text.
 * @param buffer - The PDF buffer.
 * @returns An array of strings, each representing the text of a page.
 */
async function extractTextPerPage(buffer: Buffer): Promise<string[]> {
    const loadingTask = pdfjsLib.getDocument({ data: buffer });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    const pageTexts: string[] = [];
    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const text = content.items.map((item) => {
            return ('str' in item) ? item.str : '';
        }).join(' ');
        if (isTextMeaningful(text)) {
            pageTexts.push(text);
        } else {
            const operatorList = await page.getOperatorList();
            const rawContent = operatorList && operatorList.fnArray && operatorList.argsArray ? Buffer.from(JSON.stringify({ fnArray: operatorList.fnArray, argsArray: operatorList.argsArray })) : null;
            let ocrText = '';
            if (rawContent && rawContent.length > 0) {
                const { data } = await recognize(rawContent, 'eng');
                ocrText = data.text;
            } else {
                const { data } = await recognize(buffer, 'eng');
                ocrText = data.text;
            }
            pageTexts.push(ocrText);
        }
    }
    return pageTexts;
}

/**
 * DocumentProcessor is a class that processes and stores documents.
 */
export class DocumentProcessor {
    private textSplitter: RecursiveCharacterTextSplitter;

    constructor() {
        this.textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
            separators: ["\n\n", "\n", " ", ""],
        });
    }

    public async processAndStoreDocument(
        buffer: Buffer,
        fileName: string,
        userId: string,
        contentType: string,
    ) {
        let documentId: string | null = null;
        let tempPath: string | null = null;
        try {
            // 1. Validate file
            validatePDF(buffer, fileName, 100);
            const safeFileName = sanitizeFileName(fileName);
            tempPath = saveBufferToTempFile(buffer, safeFileName);
            let extractedText = '';
            let splitDocs: Document[] = [];
            let extractionStage: DocumentExtractionStage = DocumentExtractionStage.PDF_PARSE;

            // 2. Fast text extraction (pdf-parse)
            try {
                const { default: pdfParse } = await import("pdf-parse");
                const pdfData = await pdfParse(buffer, {
                    version: 'v2.0.550',
                });
                extractedText = pdfData.text || '';
                if (isTextMeaningful(extractedText)) {
                    splitDocs = await this.textSplitter.splitDocuments([
                        new Document({ pageContent: extractedText })
                    ]);
                }
            } catch {
                extractionStage = DocumentExtractionStage.PDF_LOADER;
            }

            // 3. Fallback: PDFLoader
            if (!isTextMeaningful(extractedText)) {
                try {
                    const loader = new PDFLoader(tempPath);
                    const docs = await loader.load();
                    extractedText = docs.map(d => d.pageContent).join('\n');
                    if (isTextMeaningful(extractedText)) {
                        splitDocs = await this.textSplitter.splitDocuments(docs);
                    }
                } catch {
                    extractionStage = DocumentExtractionStage.PER_PAGE;
                }
            }

            // 4. Per-page analysis and OCR fallback
            if (!isTextMeaningful(extractedText)) {
                const pageTexts = await extractTextPerPage(buffer);
                extractedText = pageTexts.join('\n');
                if (isTextMeaningful(extractedText)) {
                    splitDocs = await this.textSplitter.splitDocuments(
                        pageTexts.map(t => new Document({ pageContent: t }))
                    );
                } else {
                    throw new Error('Failed to extract meaningful text from PDF (even with OCR)');
                }
            }

            // 5. Store preview in DB, full text in vector store
            const preview = extractedText.slice(0, 10000);
            const document = await db.document.create({
                data: {
                    name: safeFileName.replace(/\.[^/.]+$/, ""),
                    fileName: safeFileName,
                    fileSize: buffer.length,
                    contentType,
                    content: preview,
                    userId,
                    vectorized: false,
                    extractionStage,
                },
            });
            documentId = document.id;

            // 6. Stream chunks to vector store (concurrent, efficient)
            if (!splitDocs || splitDocs.length === 0) {
                throw new Error("Failed to split document into chunks");
            }
            const concurrency = 5;
            async function processChunk(chunk: Document) {
                await vectorStore.addDocuments([chunk], userId, document.id);
            }
            const processAll = async () => {
                const running: Promise<void>[] = [];
                for (const chunk of splitDocs) {
                    running.push(processChunk(chunk));
                    if (running.length >= concurrency) {
                        await Promise.race(running);
                        // Remove resolved promises
                        running.splice(0, running.findIndex(p => p === Promise.resolve()) + 1);
                    }
                }
                await Promise.all(running);
            };
            await processAll();

            // 7. Mark as vectorized
            await db.document.update({
                where: { id: document.id },
                data: { vectorized: true },
            });

            return document;
        } catch (error) {
            if (documentId) {
                await this.deleteDocument(documentId, userId);
            }
            throw new Error(
                "Failed to process and store document: " +
                (error as Error).message,
            );
        } finally {
            if (tempPath) removeTempFile(tempPath);
        }
    }

    public async deleteDocument(documentId: string, userId: string) {
        try {
            // Verify ownership
            const document = await db.document.findFirst({
                where: { id: documentId, userId },
            });
            if (!document) {
                throw new Error("Document not found or access denied");
            }

            // Delete from vector store
            await vectorStore.deleteDocuments(documentId);

            // Delete from database (cascades to related records)
            await db.document.delete({ where: { id: documentId } });

            return true;
        } catch (error) {
            throw new Error(
                "Failed to delete document: " + (error as Error).message,
            );
        }
    }

    public async getDocumentChunks(
        documentId: string,
        userId: string,
        options?: {
            includeMetadata?: boolean;
            maxChunks?: number;
            searchTerm?: string;
        },
    ) {
        try {
            const document = await db.document.findFirst({
                where: { id: documentId, userId },
            });

            if (!document) {
                throw new Error("Document not found or access denied");
            }

            const docs = [new Document({ pageContent: document.content })];
            let chunks = await this.textSplitter.splitDocuments(docs);

            // Filter by search term if provided
            if (options?.searchTerm) {
                chunks = chunks.filter((chunk) =>
                    chunk.pageContent.toLowerCase().includes(
                        options.searchTerm!.toLowerCase(),
                    )
                );
            }

            // Limit results if specified
            if (options?.maxChunks) {
                chunks = chunks.slice(0, options.maxChunks);
            }

            return chunks.map((chunk, index) => ({
                id: index.toString(16),
                content: chunk.pageContent,
                metadata: options?.includeMetadata
                    ? chunk.metadata || {}
                    : undefined,
                wordCount: chunk.pageContent.split(" ").length,
                charCount: chunk.pageContent.length,
            }));
        } catch (error) {
            throw new Error(
                "Failed to retrieve document chunks: " +
                (error as Error).message,
            );
        }
    }
}

export const documentProcessor = new DocumentProcessor();
