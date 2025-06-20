import { recognize } from 'tesseract.js';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from '@langchain/core/documents';
import db from '@/lib/config/db';
import { vectorStore } from './vector-store';
import { DocumentExtractionStage } from '@prisma/client';
import pdf from 'pdf-parse';
import { EventEmitter } from 'events';

export interface ProcessingProgress {
    stage: string;
    progress: number;
    message: string;
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
        const header = buffer.toString('utf8', 0, 1024);
        if (!header.includes('%PDF-')) throw new Error('Invalid PDF header');
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

    private async extractText(buffer: Buffer, documentId: string): Promise<{ text: string; stage: DocumentExtractionStage; }> {
        this.emitProgress(documentId, 'PDF_PARSE', 10, 'Extracting text from PDF...');
        try {
            const pdfData = await pdf(buffer);
            const extractedText = pdfData.text || '';
            if (this.isTextMeaningful(extractedText)) {
                this.emitProgress(documentId, 'PDF_PARSE', 30, 'PDF text extraction successful');
                return { text: extractedText, stage: DocumentExtractionStage.PDF_PARSE };
            }
            throw new Error('PDF parse yielded insufficient text');
        } catch {
            this.emitProgress(documentId, 'PER_PAGE', 20, 'PDF parsing failed, starting OCR...');
            const ocrResult = await recognize(buffer, 'eng', {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        const progress = Math.min(20 + (m.progress * 0.6), 80);
                        this.emitProgress(documentId, 'PER_PAGE', progress, `OCR: ${Math.round(m.progress * 100)}%`);
                    }
                }
            });
            const ocrText = ocrResult.data.text || '';
            if (!this.isTextMeaningful(ocrText)) throw new Error('OCR failed to extract meaningful text');
            this.emitProgress(documentId, 'PER_PAGE', 80, 'OCR text extraction completed');
            return { text: ocrText, stage: DocumentExtractionStage.PER_PAGE };
        }
    }

    private emitProgress(documentId: string, stage: DocumentExtractionStage, progress: number, message: string) {
        const progressData: ProcessingProgress = {
            stage,
            progress: Math.min(progress, 100),
            message,
            timestamp: new Date()
        };
        console.log(`DocumentProcessor: Emitting progress for ${documentId} - ${stage} (${progress}%): ${message}`);
        this.emit('progress', { documentId, ...progressData });
    }

    public async processAndStoreDocument(
        buffer: Buffer,
        fileName: string,
        userId: string,
        documentId: string
    ): Promise<boolean> {
        const startTime = Date.now();
        try {
            this.emitProgress(documentId, DocumentExtractionStage.VALIDATING, 0, 'Validating PDF file...');
            this.validatePDF(buffer, fileName, 100);
            this.emitProgress(documentId, DocumentExtractionStage.VALIDATING, 5, 'PDF validation passed');
            const { text: extractedText, stage: extractionStage } = await this.extractText(buffer, documentId);
            const preview = extractedText.slice(0, 10000);
            await db.document.update({
                where: { id: documentId },
                data: { content: preview, extractionStage },
            });
            this.emitProgress(documentId, DocumentExtractionStage.CHUNKING, 40, 'Splitting text into chunks...');
            const splitDocs = await this.textSplitter.splitDocuments([
                new Document({ pageContent: extractedText })
            ]);
            if (!splitDocs || splitDocs.length === 0) throw new Error('Failed to split document into chunks');
            this.emitProgress(documentId, DocumentExtractionStage.CHUNKING, 80, `Created ${splitDocs.length} chunks`);
            // Stream/process each chunk sequentially
            let processedChunks = 0;
            for (const chunk of splitDocs) {
                try {
                    await vectorStore.addDocuments([chunk], userId, documentId);
                    processedChunks++;
                    const progress = 80 + (processedChunks / splitDocs.length) * 15;
                    this.emitProgress(documentId, DocumentExtractionStage.VECTORIZING, progress, `Vectorized ${processedChunks}/${splitDocs.length} chunks`);
                } catch {
                    this.emitProgress(documentId, DocumentExtractionStage.VECTORIZING, 80, `Chunk ${processedChunks + 1} failed, skipping...`);
                }
            }
            await db.document.update({
                where: { id: documentId },
                data: {
                    vectorized: true,
                    fileData: null,
                    content: preview,
                }
            });
            const duration = Date.now() - startTime;
            this.emitProgress(documentId, extractionStage, 100, `Processing completed in ${duration}ms`);
            console.log(`DocumentProcessor: Emitting complete event for ${documentId}`);
            this.emit('complete', { documentId });
            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            await db.document.update({
                where: { id: documentId },
                data: {
                    extractionStage: DocumentExtractionStage.PDF_PARSE,
                    content: `Processing failed: ${errorMessage}`,
                    vectorized: false
                }
            });
            this.emitProgress(documentId, DocumentExtractionStage.PDF_PARSE, 0, `Processing failed: ${errorMessage}`);
            console.log(`DocumentProcessor: Emitting error event for ${documentId}: ${errorMessage}`);
            this.emit('error', { documentId, error: errorMessage });
            throw new Error(`Document processing failed: ${errorMessage}`);
        }
    }

    public async deleteDocument(documentId: string, userId: string) {
        try {
            const document = await db.document.findFirst({
                where: {
                    id: documentId,
                    userId: userId
                }
            });
            if (!document) throw new Error('Document not found');
            await vectorStore.deleteDocuments(documentId);
            await db.document.delete({ where: { id: documentId } });
        } catch (error) {
            console.error('Error deleting document:', error);
            throw new Error('Failed to delete document');
        }
    }
}

export const documentProcessor = new DocumentProcessor(); 