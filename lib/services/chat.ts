import { MessageRole, SubscriptionStatus, UserType } from "@prisma/client";
import { createChatChain, createSourcingStrategyChain } from "../core/mistral";
import { vectorStore } from "../core/vector-store";
import db from "@/lib/config/db";

export class ChatService {
    public async create(userId: string, documentId: string, title: string) {
        try {
            // Verify document ownership
            const document = await db.document.findFirst({
                where: { id: documentId, userId },
            });
            if (!document) {
                throw new Error("Document not found or access denied");
            }

            return db.chat.create({
                data: {
                    title,
                    userId,
                    documentId,
                },
            });
        } catch (error) {
            console.error("Error creating chat:", error);
            throw new Error("Failed to create chat");
        }
    }

    public async sendMessage(chatId: string, content: string, userId: string) {
        try {
            // Verify chat ownership
            const chat = await db.chat.findFirst({
                where: { id: chatId, userId },
                include: {
                    document: true,
                    user: true,
                    messages: {
                        orderBy: { createdAt: "desc" },
                        take: 20,
                    },
                },
            });

            if (!chat) {
                throw new Error("Chat not found or access denied");
            }

            // Save user message
            await db.message.create({
                data: {
                    chatId,
                    role: MessageRole.USER,
                    content,
                },
            });

            // Get relevant context from the vector store
            const relevantDocs = await vectorStore.similaritySearch(
                content,
                userId,
                20,
                chat.documentId,
            );
            const context = relevantDocs.map((doc) => doc.pageContent).join(
                "\n\n",
            );

            // Format chat history
            const chatHistory = chat.messages.reverse().map((msg) =>
                `${msg.role}: ${msg.content}`
            ).join("\n");

            // Generate response
            const chatChain = createChatChain(chat.user);
            const response = await chatChain.invoke({
                chatHistory,
                context,
                question: content,
            }, { maxConcurrency: 5, runId: chatId });

            // Save assistant response
            await db.message.create({
                data: {
                    chatId,
                    role: MessageRole.ASSISTANT,
                    content: response,
                },
            });

            return response;
        } catch (error) {
            console.error("Error sending message:", error);
            throw new Error("Failed to send message");
        }
    }

    public async getChatHistory(chatId: string, userId: string) {
        try {
            const chat = await db.chat.findFirst({
                where: { id: chatId, userId },
                include: {
                    messages: {
                        orderBy: { createdAt: "asc" },
                    },
                    document: {
                        select: { id: true, name: true },
                    },
                },
            });

            if (!chat) {
                throw new Error("Chat not found or access denied");
            }

            return chat;
        } catch (error) {
            console.error("Error fetching chat history:", error);
            throw new Error("Failed to fetch chat history");
        }
    }

    public async getUserChats(userId: string) {
        try {
            return db.chat.findMany({
                where: { userId },
                include: {
                    document: {
                        select: { id: true, name: true },
                    },
                    messages: {
                        orderBy: { createdAt: "desc" },
                        take: 1, // Last message for preview
                    },
                },
                orderBy: { createdAt: "desc" },
            });
        } catch (error) {
            console.error("Error fetching user chats:", error);
            throw new Error("Failed to fetch user chats");
        }
    }

    public async deleteChat(chatId: string, userId: string) {
        try {
            const chat = await db.chat.findFirst({
                where: { id: chatId, userId },
            });

            if (!chat) {
                throw new Error("Chat not found or access denied");
            }

            await db.chat.delete({
                where: { id: chatId },
            });

            return true;
        } catch (error) {
            console.error("Error deleting chat:", error);
            throw new Error("Failed to delete chat");
        }
    }

    public async createSourcingStrategy(
        userId: string,
        documentId: string,
        requirements: string,
    ) {
        try {
            // Verify user is a talent sourcer with active subscription
            const user = await db.user.findUnique({
                where: { id: userId },
                include: { documents: { where: { id: documentId } } },
            });

            if (!user) {
                throw new Error("User not found");
            }

            if (user.userType !== UserType.TALENT_SOURCER) {
                throw new Error("Only talent sourcers can use this feature");
            }

            if (user.subscriptionStatus !== SubscriptionStatus.ACTIVE) {
                throw new Error(
                    "Sourcing mode requires an active subscription",
                );
            }

            if (user.documents.length === 0) {
                throw new Error("No documents found for sourcing strategy");
            }

            const document = user.documents[0];

            // Generate sourcing strategy
            const sourcingChain = createSourcingStrategyChain(user.language);
            const strategy = await sourcingChain.invoke({
                talentProfiles: document.content,
                requirements,
            });

            // Create a special chat for sourcing strategy
            const chat = await db.chat.create({
                data: {
                    title: `Sourcing Strategy for ${document.name}`,
                    userId,
                    documentId: document.id,
                },
            });

            // Save the strategy as assistant message
            await db.message.create({
                data: {
                    chatId: chat.id,
                    role: MessageRole.ASSISTANT,
                    content: strategy,
                },
            });

            return { chat, strategy };
        } catch (error) {
            console.error("Error creating sourcing strategy:", error);
            throw new Error("Failed to create sourcing strategy");
        }
    }
}

export const chatService = new ChatService();
