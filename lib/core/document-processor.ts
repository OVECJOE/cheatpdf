import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
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
            separators: ["\n\n", "\n", " ", ""],
        });
    }

    private async delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
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
            if (
                currentBatch.length >= this.BATCH_SIZE ||
                currentTokenCount + docTokens > this.MAX_TOKENS_PER_BATCH
            ) {
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
        maxRetries: number = 3,
    ): Promise<void> {
        let attempt = 0;

        while (attempt < maxRetries) {
            try {
                await vectorStore.addDocuments(batch, userId, documentId);
                return;
            } catch (error) {
                attempt++;
                console.warn(
                    `Batch processing attempt ${attempt} failed:`,
                    error,
                );

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

    private async cleanupFailedDocument(documentId: string): Promise<void> {
        try {
            // Clean up vector store data
            await vectorStore.deleteDocuments(documentId);
        } catch (vectorError) {
            console.warn(
                `Failed to cleanup vector data for document ${documentId}:`,
                vectorError,
            );
        }

        try {
            // Clean up database record
            await db.document.delete({
                where: { id: documentId },
            });
        } catch (dbError) {
            console.warn(
                `Failed to cleanup database record for document ${documentId}:`,
                dbError,
            );
        }
    }

    public async processAndStoreDocument(
        buffer: Buffer,
        fileName: string,
        userId: string,
        contentType: string,
    ) {
        let documentId: string | null = null;

        try {
            // Create a temporary file for PDF processing
            const tempFile = new File([buffer], fileName, {
                type: contentType,
            });
            const loader = new PDFLoader(tempFile);

            // Load and split the document
            const docs = await loader.load();

            if (!docs || docs.length === 0) {
                throw new Error("Failed to extract content from PDF file");
            }

            const splitDocs = await this.textSplitter.splitDocuments(docs);

            if (!splitDocs || splitDocs.length === 0) {
                throw new Error("Failed to process document content");
            }

            // Extract text content and store document in database
            const content = docs.map((doc) => doc.pageContent).join("\n");

            if (!content.trim()) {
                throw new Error("Document appears to be empty or unreadable");
            }

            const document = await db.document.create({
                data: {
                    name: fileName.replace(/\.[^/.]+$/, ""), // Remove file extension
                    fileName,
                    fileSize: buffer.length,
                    contentType,
                    content,
                    userId,
                    vectorized: false,
                },
            });

            documentId = document.id;

            // Process documents in batches
            const batches = this.createBatches(splitDocs);

            if (batches.length === 0) {
                throw new Error(
                    "Failed to create document batches for processing",
                );
            }

            for (let i = 0; i < batches.length; i++) {
                const batch = batches[i];
                try {
                    await this.processBatchWithRetry(
                        batch,
                        userId,
                        document.id,
                    );
                    if (i < batches.length - 1) {
                        await this.delay(500); // 500ms delay between batches
                    }
                } catch (batchError) {
                    console.error(
                        `Failed to process batch ${
                            i + 1
                        }/${batches.length} for document ${document.id}:`,
                        batchError,
                    );
                    throw new Error(
                        `Document processing failed at batch ${i + 1}: ${
                            (batchError as Error).message
                        }`,
                    );
                }
            }

            // Update document status to vectorized
            await db.document.update({
                where: { id: document.id },
                data: { vectorized: true },
            });

            return document;
        } catch (error) {
            console.error("Document processing error:", error);

            // Cleanup failed document if it was created
            if (documentId) {
                await this.cleanupFailedDocument(documentId);
            }

            throw new Error(
                "Failed to process and store document: " +
                    (error as Error).message,
            );
        }
    }
}

export const documentProcessor = new DocumentProcessor();
