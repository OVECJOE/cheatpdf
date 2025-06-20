import { recognize } from 'tesseract.js';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from '@langchain/core/documents';
import db from '@/lib/config/db';
import { vectorStore } from './vector-store';
import { DocumentExtractionStage } from '@prisma/client';
import pdf from 'pdf-parse';
import { EventEmitter } from 'events';

export interface ProcessingProgress {
    documentId: string;
    userId: string;
    stage: DocumentExtractionStage;
    progress: number;
    message: string;
    timestamp: Date;
}

export interface ProcessingComplete {
    documentId: string;
    userId: string;
    timestamp: Date;
}

export interface ProcessingError {
    documentId: string;
    userId: string;
    error: string;
    timestamp: Date;
}

export class DocumentProcessor extends EventEmitter {
    private textSplitter: RecursiveCharacterTextSplitter;

    constructor() {
        super();
        this.textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
            separators: ['\n\n', '\n', ' ', ''],
        });
    }

    private validatePDF(buffer: Buffer, fileName: string, maxSizeMB = 100) {
        if (!fileName.toLowerCase().endsWith('.pdf')) throw new Error('File extension is not supported');
        if (buffer.length === 0) throw new Error('File is empty');
        if (buffer.subarray(0, 4).toString() !== '%PDF') throw new Error('File is not a valid PDF (bad magic number)');
        if (buffer.length > maxSizeMB * 1024 * 1024) throw new Error(`File size exceeds ${maxSizeMB}MB limit`);
        // const header = buffer.toString('utf8', 0, 1024);
        // if (!header.includes('%PDF-')) throw new Error('Invalid PDF header');
    }

    private isTextMeaningful(text: string): boolean {
        if (!text || typeof text !== 'string') return false;
        const trimmed = text.trim();
        if (trimmed.length < 50) return false;
        if (/^\s*$/.test(trimmed)) return false;
        const words = trimmed.split(/\s+/).filter(word => word.length > 0);
        if (words.length < 10) return false;
        const alphaChars = trimmed.replace(/[^a-zA-Z]/g, '').length;
        const totalChars = trimmed.length;
        const alphaRatio = alphaChars / totalChars;
        return alphaRatio > 0.1;
    }

    private async extractText(buffer: Buffer, documentId: string, userId: string): Promise<{ text: string; stage: DocumentExtractionStage; }> {
        this.emitProgress(documentId, userId, DocumentExtractionStage.PDF_PARSE, 10, 'Extracting text from PDF...');
        try {
            const pdfData = await pdf(buffer);
            const extractedText = pdfData.text || '';
            if (this.isTextMeaningful(extractedText)) {
                this.emitProgress(documentId, userId, DocumentExtractionStage.PDF_PARSE, 30, 'PDF text extraction successful');
                return { text: extractedText, stage: DocumentExtractionStage.PDF_PARSE };
            }
            throw new Error('PDF parse yielded insufficient text');
        } catch {
            this.emitProgress(documentId, userId, DocumentExtractionStage.PER_PAGE, 20, 'PDF parsing failed, starting OCR...');
            
            try {
                const ocrResult = await recognize(buffer, 'eng', {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            const progress = Math.min(20 + (m.progress * 0.6), 80);
                            this.emitProgress(documentId, userId, DocumentExtractionStage.PER_PAGE, progress, `OCR: ${Math.round(m.progress * 100)}%`);
                        }
                    }
                });
                
                const ocrText = ocrResult.data.text || '';
                if (!this.isTextMeaningful(ocrText)) throw new Error('OCR failed to extract meaningful text');
                
                this.emitProgress(documentId, userId, DocumentExtractionStage.PER_PAGE, 80, 'OCR text extraction completed');
                return { text: ocrText, stage: DocumentExtractionStage.PER_PAGE };
            } catch (ocrError) {
                const errorMessage = ocrError instanceof Error ? ocrError.message : 'OCR processing failed';
                throw new Error(`Text extraction failed: ${errorMessage}`);
            }
        }
    }

    private emitProgress(documentId: string, userId: string, stage: DocumentExtractionStage, progress: number, message: string) {
        const progressData: ProcessingProgress = {
            documentId,
            userId,
            stage,
            progress: Math.min(Math.max(progress, 0), 100), // Clamp between 0-100
            message,
            timestamp: new Date()
        };
        
        console.log(`DocumentProcessor: Emitting progress for ${documentId} - ${stage} (${progress}%): ${message}`);
        this.emit('progress', progressData);
    }

    private emitComplete(documentId: string, userId: string) {
        const completeData: ProcessingComplete = {
            documentId,
            userId,
            timestamp: new Date()
        };
        
        console.log(`DocumentProcessor: Emitting complete event for ${documentId}`);
        this.emit('complete', completeData);
    }

    private emitError(documentId: string, userId: string, error: string) {
        const errorData: ProcessingError = {
            documentId,
            userId,
            error,
            timestamp: new Date()
        };
        
        console.log(`DocumentProcessor: Emitting error event for ${documentId}: ${error}`);
        this.emit('error', errorData);
    }

    public async processAndStoreDocument(
        buffer: Buffer,
        fileName: string,
        userId: string,
        documentId: string
    ): Promise<boolean> {
        const startTime = Date.now();
        
        try {
            // Validation stage
            this.emitProgress(documentId, userId, DocumentExtractionStage.VALIDATING, 0, 'Validating PDF file...');
            this.validatePDF(buffer, fileName, 100);
            this.emitProgress(documentId, userId, DocumentExtractionStage.VALIDATING, 5, 'PDF validation passed');
            
            // Text extraction stage
            const { text: extractedText, stage: extractionStage } = await this.extractText(buffer, documentId, userId);
            
            // Update document with extracted content preview
            const preview = extractedText.slice(0, 10000);
            await db.document.update({
                where: { id: documentId },
                data: { 
                    content: preview, 
                    extractionStage 
                },
            });
            
            // Chunking stage
            this.emitProgress(documentId, userId, DocumentExtractionStage.CHUNKING, 40, 'Splitting text into chunks...');
            const splitDocs = await this.textSplitter.splitDocuments([
                new Document({ 
                    pageContent: extractedText,
                    metadata: { 
                        documentId, 
                        userId,
                        fileName,
                        timestamp: new Date().toISOString()
                    }
                })
            ]);
            
            if (!splitDocs || splitDocs.length === 0) {
                throw new Error('Failed to split document into chunks');
            }
            
            this.emitProgress(documentId, userId, DocumentExtractionStage.CHUNKING, 60, `Created ${splitDocs.length} chunks`);
            
            // Vectorization stage - process chunks in batches for better performance
            this.emitProgress(documentId, userId, DocumentExtractionStage.VECTORIZING, 65, 'Starting vectorization...');
            
            const batchSize = 10; // Process chunks in batches
            let processedChunks = 0;
            const totalChunks = splitDocs.length;
            
            for (let i = 0; i < totalChunks; i += batchSize) {
                const batch = splitDocs.slice(i, Math.min(i + batchSize, totalChunks));
                
                try {
                    await vectorStore.addDocuments(batch, userId, documentId);
                    processedChunks += batch.length;
                    
                    const progress = 65 + (processedChunks / totalChunks) * 30; // 65-95% for vectorization
                    this.emitProgress(
                        documentId, 
                        userId, 
                        DocumentExtractionStage.VECTORIZING, 
                        progress, 
                        `Vectorized ${processedChunks}/${totalChunks} chunks`
                    );
                } catch (batchError) {
                    console.warn(`Batch vectorization failed for chunks ${i}-${Math.min(i + batchSize, totalChunks)}, skipping...`, batchError);
                    processedChunks += batch.length; // Continue with next batch
                }
            }
            
            // Final update - mark as completed
            await db.document.update({
                where: { id: documentId },
                data: {
                    vectorized: true,
                    fileData: null, // Clean up base64 data to save space
                    content: preview,
                }
            });
            
            const duration = Date.now() - startTime;
            this.emitProgress(
                documentId, 
                userId, 
                extractionStage, 
                100, 
                `Processing completed successfully in ${Math.round(duration / 1000)}s`
            );
            
            // Emit completion event
            this.emitComplete(documentId, userId);
            
            return true;
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown processing error';
            
            try {
                // Update document with error state
                await db.document.update({
                    where: { id: documentId },
                    data: {
                        extractionStage: DocumentExtractionStage.VALIDATING,
                        content: `Processing failed: ${errorMessage}`,
                        vectorized: false
                    }
                });
            } catch (dbError) {
                console.error('Failed to update document with error state:', dbError);
            }
            
            // Emit error event
            this.emitError(documentId, userId, errorMessage);
            
            throw new Error(`Document processing failed: ${errorMessage}`);
        }
    }

    public async deleteDocument(documentId: string, userId: string): Promise<void> {
        try {
            // Verify document ownership
            const document = await db.document.findFirst({
                where: {
                    id: documentId,
                    userId: userId
                }
            });
            
            if (!document) {
                throw new Error('Document not found or access denied');
            }
            
            // Delete from vector store first
            await vectorStore.deleteDocuments(documentId);
            
            // Delete from database
            await db.document.delete({ 
                where: { id: documentId } 
            });
            
            console.log(`Successfully deleted document ${documentId} for user ${userId}`);
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown deletion error';
            console.error('Error deleting document:', error);
            throw new Error(`Failed to delete document: ${errorMessage}`);
        }
    }
}

export const documentProcessor = new DocumentProcessor();