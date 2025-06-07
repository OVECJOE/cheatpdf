import {PDFLoader} from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from "@langchain/core/documents";
import { vectorStore } from "./vector-store";
import db from "../config/db";

export class DocumentProcessor {
    private textSplitter: RecursiveCharacterTextSplitter;

    constructor() {
        this.textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
            separators: ['\n\n', '\n', ' ', ''],
        })
    }

    public async processAndStoreDocument(buffer: Buffer, fileName: string, userId: string, contentType: string) {
        try {
            // Create a temporary file for PDF processing
            console.log(buffer, fileName, userId, contentType);
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
            
            // Store in vector database
            await vectorStore.addDocuments(splitDocs, userId, document.id);

            // Update document status to vectorized
            await db.document.update({
                where: { id: document.id },
                data: { vectorized: true }
            })

            return document;
        } catch (error) {
            console.error("Error processing document:", error);
            throw new Error("Failed to process and store document");
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

            // Store in vector database
            await vectorStore.addDocuments(splitDocs, document.userId, document.id);

            // Update document status to vectorized
            await db.document.update({
                where: { id: document.id },
                data: { vectorized: true }
            })

            return document;
        } catch (error) {
            console.error("Error reprocessing document:", error);
            throw new Error("Failed to reprocess document");
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
            console.error("Error deleting document:", error);
            throw new Error("Failed to delete document");
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
            console.error("Error retrieving document chunks:", error);
            throw new Error("Failed to retrieve document chunks");
        }
    }
}

export const documentProcessor = new DocumentProcessor();