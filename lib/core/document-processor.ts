import { recognize } from 'tesseract.js';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from '@langchain/core/documents';
import db from '@/lib/config/db';
import { vectorStore } from './vector-store';
import { DocumentExtractionStage } from '@prisma/client';
import pdf from 'pdf-parse';

/**
 * Utility: Validate PDF file (extension, magic number, size)
 */
function validatePDF(buffer: Buffer, fileName: string, maxSizeMB = 100) {
    if (!fileName.toLowerCase().endsWith('.pdf')) throw new Error('File extension is not .pdf');
    if (buffer.subarray(0, 4).toString() !== '%PDF') throw new Error('File is not a valid PDF (bad magic number)');
    if (buffer.length > maxSizeMB * 1024 * 1024) throw new Error(`File size exceeds ${maxSizeMB}MB limit`);
}

/**
 * Checks if the extracted text is meaningful (not just whitespace or very short)
 */
function isTextMeaningful(text: string): boolean {
    if (!text) return false;
    const trimmed = text.trim();
    return trimmed.length > 50 && !/^\s*$/.test(trimmed);
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

    private async processBatch(chunks: Document[], userId: string, documentId: string) {
        // Process chunks concurrently but with limited concurrency
        const promises = chunks.map(chunk => 
            vectorStore.addDocuments([chunk], userId, documentId)
        );
        await Promise.all(promises);
    }

    public async processAndStoreDocument(
        buffer: Buffer,
        fileName: string,
        userId: string,
        documentId: string,
    ) {
        try {
            validatePDF(buffer, fileName, 100);
            
            // Update status
            await db.document.update({
                where: { id: documentId },
                data: { extractionStage: DocumentExtractionStage.PDF_PARSE }
            });

            // Quick text extraction first
            let extractedText = '';
            let extractionStage: DocumentExtractionStage = DocumentExtractionStage.PDF_PARSE;

            try {
                const data = await pdf(buffer);
                extractedText = data.text;
                
                if (!isTextMeaningful(extractedText)) {
                    throw new Error('PDF parse yielded no meaningful text');
                }
            } catch (error) {
                console.warn('PDF parse failed, will use OCR:', error);
                extractionStage = DocumentExtractionStage.PER_PAGE;
                
                // OCR is slower, so we do it in the next step
                const { data } = await recognize(buffer, 'eng');
                extractedText = data.text;
                
                if (!isTextMeaningful(extractedText)) {
                    throw new Error('OCR failed to extract meaningful text');
                }
            }

            // Store preview immediately
            const preview = extractedText.slice(0, 10000);
            await db.document.update({
                where: { id: documentId },
                data: {
                    content: preview,
                    extractionStage,
                },
            });

            // Split text into manageable chunks
            const splitDocs = await this.textSplitter.splitDocuments([
                new Document({ pageContent: extractedText })
            ]);

            if (!splitDocs || splitDocs.length === 0) {
                throw new Error('Failed to split document into chunks');
            }

            // Process vector embeddings in smaller batches to avoid timeout
            const batchSize = 3; // Process 3 chunks at a time
            const batches = [];
            for (let i = 0; i < splitDocs.length; i += batchSize) {
                batches.push(splitDocs.slice(i, i + batchSize));
            }

            let processedCount = 0;
            for (const batch of batches) {
                try {
                    // Process batch with timeout protection
                    await Promise.race([
                        this.processBatch(batch, userId, documentId),
                        new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Batch timeout')), 8000)
                        )
                    ]);

                    processedCount += batch.length;
                    
                    // Update progress
                    await db.document.update({
                        where: { id: documentId },
                        data: { 
                            content: `${preview}\n\n[Processing: ${processedCount}/${splitDocs.length} chunks completed]`
                        }
                    });

                } catch (error) {
                    console.error(`Batch processing error (batch ${batches.indexOf(batch) + 1}):`, error);
                    
                    // Continue with next batch instead of failing completely
                    if (error instanceof Error && error.message.includes('timeout')) {
                        console.warn('Batch timed out, continuing with next batch');
                        continue;
                    }
                    throw error;
                }
            }

            // Final update
            await db.document.update({
                where: { id: documentId },
                data: { 
                    vectorized: true,
                    content: preview // Remove processing status
                }
            });

            return true;

        } catch (error) {
            // Update document status to failed
            await db.document.update({
                where: { id: documentId },
                data: {
                    extractionStage: DocumentExtractionStage.FAILED,
                    content: `Processing failed: ${(error as Error).message}`,
                },
            });
            
            throw new Error(
                'Failed to process document in chunks: ' + (error as Error).message,
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
