import { MessageRole } from "@prisma/client";
import { createChatChain } from "../core/mistral";
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
            }, { runId: chatId });

            // Save assistant response
            const message = await db.message.create({
                data: {
                    chatId,
                    role: MessageRole.ASSISTANT,
                    content: response,
                },
            });

            return message;
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


}

export const chatService = new ChatService();
