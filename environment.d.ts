import "next";

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            LANGSMITH_API_KEY: string;
            LANGSMITH_PROJECT_ID: string;
            LANGSMITH_API_URL?: string;
            MISTRAL_API_KEY: string;

            PINECONE_API_KEY: string;
            PINECONE_INDEX_HOST: string;
            PINECONE_INDEX_NAME: string;

            STRIPE_SECRET_KEY: string;
            STRIPE_WEBHOOK_SECRET: string;
            STRIPE_PRICE_ID: string;

            RESEND_API_KEY: string;
            EMAIL_FROM: string;
        }
    }
}
