import { Pinecone } from '@pinecone-database/pinecone';

if (!process.env.PINECONE_API_KEY) {
    throw new Error('Missing Pinecone API key');
}

const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
});

export const getPineconeIndex = (indexName: string) => {
    if (!process.env.PINECONE_INDEX_HOST) {
        throw new Error('Missing Pinecone index host. Please set PINECONE_INDEX_HOST in your environment variables.');
    }
    return pinecone.Index(indexName, process.env.PINECONE_INDEX_HOST);
}

export default pinecone;