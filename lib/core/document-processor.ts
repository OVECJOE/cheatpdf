import { recognize } from 'tesseract.js';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from '@langchain/core/documents';
import db from '@/lib/config/db';
import { vectorStore } from './vector-store';
import { DocumentExtractionStage } from '@prisma/client';
import PDFParser from 'pdf2json';

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

/**
 * Checks if the extracted text is meaningful (not just whitespace or very short)
 */
function isTextMeaningful(text: string): boolean {
    if (!text) return false;
    const trimmed = text.trim();
    return trimmed.length > 50 && !/^\s*$/.test(trimmed);
}

/**
 * Extract text from PDF using pdf2json
 */
function extractTextFromPDF(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(null, true);

        pdfParser.on('pdfParser_dataReady', (pdfData) => {
            try {
                // Convert PDF data to text, handling each page
                const pages = pdfData.Pages.map(page => {
                    const texts = page.Texts.map(text => 
                        decodeURIComponent(text.R.map(r => r.T).join(' '))
                    );
                    return texts.join(' ');
                });

                resolve(pages.join('\n\n'));
            } catch (error) {
                reject(new Error('Failed to parse PDF text: ' + (error as Error).message));
            }
        });

        pdfParser.on('pdfParser_dataError', (errData) => {
            reject(new Error('PDF parsing failed: ' + errData.parserError));
        });

        try {
            pdfParser.parseBuffer(buffer);
        } catch (error) {
            reject(new Error('Failed to start PDF parsing: ' + (error as Error).message));
        }
    });
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
     * Process and store a PDF document
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

            // 1. Try pdf2json first (fast, reliable for text-based PDFs)
            try {
                extractedText = await extractTextFromPDF(buffer);
                
                if (isTextMeaningful(extractedText)) {
                    // Split by pages (they're already separated by double newlines)
                    const pages = extractedText.split('\n\n')
                        .filter(page => isTextMeaningful(page));
                    
                    if (pages.length > 0) {
                        splitDocs = await this.textSplitter.splitDocuments(
                            pages.map(text => new Document({ pageContent: text }))
                        );
                    } else {
                        splitDocs = await this.textSplitter.splitDocuments([
                            new Document({ pageContent: extractedText })
                        ]);
                    }
                }
            } catch (error) {
                console.warn('PDF parse failed, falling back to OCR:', error);
                extractionStage = DocumentExtractionStage.PER_PAGE;
            }

            // 2. Fallback to OCR if needed
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

            // 3. Store preview in DB, full text in vector store
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

            // 4. Stream chunks to vector store
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

            // 5. Mark as vectorized
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
