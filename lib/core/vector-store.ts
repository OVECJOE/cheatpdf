import { PineconeStore } from "@langchain/pinecone";
import { MistralAIEmbeddings } from "@langchain/mistralai";
import { Document } from "@langchain/core/documents";
import { getPineconeIndex } from "../config/pinecone";

const embeddings = new MistralAIEmbeddings({
    apiKey: process.env.MISTRAL_API_KEY,
    model: "mistral-embed",
});

export class VectorStoreManager {
    private static instance: VectorStoreManager;
    private vectorStore: PineconeStore;

    private constructor() {
        this.vectorStore = new PineconeStore(embeddings, {
            pineconeIndex: getPineconeIndex(process.env.PINECONE_INDEX_NAME),
            maxConcurrency: 5,
        });
    }

    public static load(): VectorStoreManager {
        if (!VectorStoreManager.instance) {
            VectorStoreManager.instance = new VectorStoreManager();
        }
        return VectorStoreManager.instance;
    }

    public async addDocuments(
        documents: Document[],
        userId: string,
        documentId: string,
    ) {
        const docsWithMetadata = documents.map((doc) => ({
            ...doc,
            metadata: {
                ...doc.metadata,
                userId,
                documentId,
            },
        }));

        await this.vectorStore.addDocuments(docsWithMetadata);
    }

    public async similaritySearch(
        query: string,
        userId: string,
        k: number = 4,
        documentId?: string,
    ) {
        const filter: Record<string, string> = { userId };
        if (documentId) {
            filter.documentId = documentId;
        }

        return this.vectorStore.similaritySearch(query, k, filter);
    }

    public async deleteDocuments(documentId: string) {
        await this.vectorStore.delete({ filter: { documentId } });
    }
}

export const vectorStore = VectorStoreManager.load();
