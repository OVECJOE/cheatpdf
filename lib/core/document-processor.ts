import '@ungap/with-resolvers';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { recognize } from 'tesseract.js';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from '@langchain/core/documents';
import db from '@/lib/config/db';
import { vectorStore } from './vector-store';
import { DocumentExtractionStage } from '@prisma/client';
import '@ungap/with-resolvers';
import 'pdfjs-dist/build/pdf.worker.mjs';

/**
 * Utility: Validate PDF file (extension, magic number, size)
 */
function validatePDF(buffer: Buffer, fileName: string, maxSizeMB = 100) {
    if (!fileName.toLowerCase().endsWith('.pdf')) throw new Error('File extension is not .pdf');
    if (buffer.subarray(0, 4).toString() !== '%PDF') throw new Error('File is not a valid PDF (bad magic number)');
    if (buffer.length > maxSizeMB * 1024 * 1024) throw new Error(`File size exceeds ${maxSizeMB}MB limit`);
}

function sanitizeFileName(fileName: string): string {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 128);
}

function isTextMeaningful(text: string): boolean {
    if (!text) return false;
    const clean = text.replace(/\s+/g, '');
    return clean.length > 100;
}

async function extractTextPerPageWithPdfjs(buffer: Buffer): Promise<{ pageTexts: string[], emptyPages: number[] }> {
    // Only use text extraction, no rendering
    const pdf = await pdfjs.getDocument({ data: buffer }).promise;
    const numPages = pdf.numPages;
    const pageTexts: string[] = [];
    const emptyPages: number[] = [];
    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const text = content.items.map((item) => ('str' in item ? item.str : '')).join(' ');
        if (isTextMeaningful(text)) {
            pageTexts.push(text);
        } else {
            pageTexts.push('');
            emptyPages.push(i);
        }
    }
    return { pageTexts, emptyPages };
}

export class DocumentProcessor {
    private textSplitter: RecursiveCharacterTextSplitter;

    constructor() {
        this.textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
            separators: ['\n\n', '\n', ' ', ''],
        });
    }

    /**
     * Process and store a PDF document (streaming, robust, universal)
     */
    public async processAndStoreDocument(
        buffer: Buffer,
        fileName: string,
        userId: string,
        contentType: string,
    ) {
        let documentId: string | null = null;
        try {
            validatePDF(buffer, fileName, 100);
            const safeFileName = sanitizeFileName(fileName);
            let extractedText = '';
            let splitDocs: Document[] = [];
            let extractionStage: DocumentExtractionStage = DocumentExtractionStage.PDF_PARSE;
            let pageTexts: string[] = [];
            let emptyPages: number[] = [];

            // 1. Try per-page text extraction with pdfjs-dist (no rendering)
            try {
                const result = await extractTextPerPageWithPdfjs(buffer);
                pageTexts = result.pageTexts;
                emptyPages = result.emptyPages;
                extractedText = pageTexts.join('\n');
                if (isTextMeaningful(extractedText)) {
                    splitDocs = await this.textSplitter.splitDocuments(
                        pageTexts.filter(Boolean).map((t) => new Document({ pageContent: t }))
                    );
                }
            } catch {
                extractionStage = DocumentExtractionStage.PER_PAGE;
            }

            // 2. Fallback: full-document OCR if no meaningful text
            if (!isTextMeaningful(extractedText)) {
                extractionStage = DocumentExtractionStage.PER_PAGE;
                const { data } = await recognize(buffer, 'eng');
                extractedText = data.text;
                if (isTextMeaningful(extractedText)) {
                    splitDocs = await this.textSplitter.splitDocuments([
                        new Document({ pageContent: extractedText })
                    ]);
                } else {
                    throw new Error('Failed to extract meaningful text from PDF (even with OCR)');
                }
            }

            // 4. Store preview in DB, full text in vector store
            const preview = extractedText.slice(0, 10000);
            const document = await db.document.create({
                data: {
                    name: safeFileName.replace(/\.[^/.]+$/, ''),
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

            // 5. Stream chunks to vector store (concurrent, efficient)
            if (!splitDocs || splitDocs.length === 0) {
                throw new Error('Failed to split document into chunks');
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
                        running.splice(0, running.findIndex(p => p === Promise.resolve()) + 1);
                    }
                }
                await Promise.all(running);
            };
            await processAll();

            // 6. Mark as vectorized
            await db.document.update({
                where: { id: document.id },
                data: { vectorized: true },
            });

            console.log(`Number of empty pages for ${safeFileName}: ${emptyPages.length}`);
            return document;
        } catch (error) {
            if (documentId) {
                await this.deleteDocument(documentId, userId);
            }
            throw new Error(
                'Failed to process and store document: ' +
                (error as Error).message,
            );
        }
    }

    public async deleteDocument(documentId: string, userId: string) {
        try {
            const document = await db.document.findFirst({
                where: { id: documentId, userId },
            });
            if (!document) {
                throw new Error('Document not found or access denied');
            }
            await vectorStore.deleteDocuments(documentId);
            await db.document.delete({ where: { id: documentId } });
            return true;
        } catch (error) {
            throw new Error(
                'Failed to delete document: ' + (error as Error).message,
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
                throw new Error('Document not found or access denied');
            }
            const docs = [new Document({ pageContent: document.content })];
            let chunks = await this.textSplitter.splitDocuments(docs);
            if (options?.searchTerm) {
                chunks = chunks.filter((chunk) =>
                    chunk.pageContent.toLowerCase().includes(
                        options.searchTerm!.toLowerCase(),
                    )
                );
            }
            if (options?.maxChunks) {
                chunks = chunks.slice(0, options.maxChunks);
            }
            return chunks.map((chunk, index) => ({
                id: index.toString(16),
                content: chunk.pageContent,
                metadata: options?.includeMetadata
                    ? chunk.metadata || {}
                    : undefined,
                wordCount: chunk.pageContent.split(' ').length,
                charCount: chunk.pageContent.length,
            }));
        } catch (error) {
            throw new Error(
                'Failed to retrieve document chunks: ' +
                (error as Error).message,
            );
        }
    }
}

export const documentProcessor = new DocumentProcessor();
