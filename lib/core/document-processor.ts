import {PDFLoader} from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from "@langchain/core/documents";
import { vectorStore } from "./vector-store";
import db from "../config/db";

export class DocumentProcessor {
    private textSplitter: RecursiveCharacterTextSplitter;
    private readonly BATCH_SIZE = 10; // Adjust based on your token limits
    private readonly MAX_TOKENS_PER_BATCH = 8000; // Conservative limit for Mistral

    constructor() {
        this.textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
            separators: ['\n\n', '\n', ' ', ''],
        })
    }

    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private estimateTokens(text: string): number {
        // Rough estimation: 1 token ≈ 4 characters for most models
        return Math.ceil(text.length / 4);
    }

    private createBatches(documents: Document[]): Document[][] {
        const batches: Document[][] = [];
        let currentBatch: Document[] = [];
        let currentTokenCount = 0;

        for (const doc of documents) {
            const docTokens = this.estimateTokens(doc.pageContent);
            
            // If adding this document would exceed limits, start a new batch
            if (currentBatch.length >= this.BATCH_SIZE || 
                currentTokenCount + docTokens > this.MAX_TOKENS_PER_BATCH) {
                
                if (currentBatch.length > 0) {
                    batches.push(currentBatch);
                    currentBatch = [];
                    currentTokenCount = 0;
                }
            }

            currentBatch.push(doc);
            currentTokenCount += docTokens;
        }

        // Add the last batch if it has documents
        if (currentBatch.length > 0) {
            batches.push(currentBatch);
        }

        return batches;
    }

    private async processBatchWithRetry(
        batch: Document[], 
        userId: string, 
        documentId: string, 
        maxRetries: number = 3
    ): Promise<void> {
        let attempt = 0;
        
        while (attempt < maxRetries) {
            try {
                await vectorStore.addDocuments(batch, userId, documentId);
                return; // Success, exit the retry loop
            } catch (error) {
                attempt++;
                console.warn(`Batch processing attempt ${attempt} failed:`, error);
                
                if (attempt < maxRetries) {
                    // Exponential backoff: wait 2^attempt seconds
                    const waitTime = Math.pow(2, attempt) * 1000;
                    await this.delay(waitTime);
                } else {
                    throw error; // Re-throw after all retries exhausted
                }
            }
        }
    }

    public async processAndStoreDocument(buffer: Buffer, fileName: string, userId: string, contentType: string) {
        try {
            // Create a temporary file for PDF processing
            const tempFile = new File([buffer], fileName, { type: contentType });
            const loader = new PDFLoader(tempFile);

            // Load and split the document
            const docs = await loader.load();
            const splitDocs = await this.textSplitter.splitDocuments(docs);

            // Extract text content and store document in database
            const content = docs.map(doc => doc.pageContent).join('\n');
            const document = await db.document.create({
                data: {
                    name: fileName.replace(/\.[^/.]+$/, ""), // Remove file extension
                    fileName,
                    fileSize: buffer.length,
                    contentType,
                    content,
                    userId,
                    vectorized: false
                }
            })
            
            // Process documents in batches
            const batches = this.createBatches(splitDocs);

            for (let i = 0; i < batches.length; i++) {
                const batch = batches[i];
                await this.processBatchWithRetry(batch, userId, document.id);
                if (i < batches.length - 1) {
                    await this.delay(500); // 500ms delay between batches
                }
            }

            // Update document status to vectorized
            await db.document.update({
                where: { id: document.id },
                data: { vectorized: true }
            })
            return document;
        } catch (error) {
            throw new Error("Failed to process and store document: " + (error as Error).message);
        }
    }

    public async reprocessDocument(documentId: string) {
        try {
            const document = await db.document.findUnique({ where: { id: documentId } })
            if (!document) {
                throw new Error("Document not found");
            }

            // Delete existing vectors
            await vectorStore.deleteDocuments(document.id);

            // Reprocess the content
            const docs = [new Document({ pageContent: document.content })];
            const splitDocs = await this.textSplitter.splitDocuments(docs);

            // Process documents in batches
            const batches = this.createBatches(splitDocs);
            for (let i = 0; i < batches.length; i++) {
                const batch = batches[i];
                await this.processBatchWithRetry(batch, document.userId, document.id);
                if (i < batches.length - 1) {
                    await this.delay(500);
                }
            }

            // Update document status to vectorized
            await db.document.update({
                where: { id: document.id },
                data: { vectorized: true }
            })
            return document;
        } catch (error) {
            throw new Error("Failed to reprocess document: " + (error as Error).message);
        }
    }

    public async deleteDocument(documentId: string, userId: string) {
        try {
            // Verify ownership
            const document = await db.document.findFirst({
                where: { id: documentId, userId }
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
            throw new Error("Failed to delete document: " + (error as Error).message);
        }
    }

    async getDocumentChunks(documentId: string, userId: string) {
        try {
            const document = await db.document.findFirst({
                where: { id: documentId, userId },
            });
            if (!document) {
                throw new Error("Document not found or access denied");
            }

            // Split document content for preview
            const docs = [new Document({ pageContent: document.content })];
            const chunks = await this.textSplitter.splitDocuments(docs);

            return chunks.map((chunk, index) => ({
                id: index.toString(16),
                content: chunk.pageContent,
                metadata: chunk.metadata || {},
            }))
        } catch (error) {
            throw new Error("Failed to retrieve document chunks: " + (error as Error).message);
        }
    }
}

export const documentProcessor = new DocumentProcessor();
