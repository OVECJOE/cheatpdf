"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Send, Bot, User, Loader2, BookOpen } from "lucide-react";
import AppLogo from "@/components/app-logo";
import MarkdownRenderer from "@/components/markdown-renderer";

interface Message {
  id: string;
  content: string;
  role: "USER" | "ASSISTANT";
  createdAt: string;
  citations?: string[];
}

interface Chat {
  id: string;
  title: string;
  documentId: string;
  messages: Message[];
}

export default function ChatDetailPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const chatId = params.id as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [chat, setChat] = useState<Chat | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/sign-in");
      return;
    }

    if (status === "authenticated" && chatId) {
      fetchChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, router, chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages]);

  const fetchChat = async () => {
    try {
      const response = await fetch(`/api/chat?chatId=${chatId}`);

      if (!response.ok) {
        if (response.status === 404) {
          router.push("/chat");
          return;
        }
        console.error("Failed to fetch chat");
        return;
      }

      const data = await response.json();
      setChat(data.chat);
    } catch (error) {
      console.error("Error fetching chat:", error);
      router.push("/chat");
    } finally {
      setIsInitialLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!message.trim() || loading || !chat) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message.trim(),
      role: "USER",
      createdAt: new Date().toISOString(),
    };

    setChat((prev) =>
      prev
        ? {
            ...prev,
            messages: [...prev.messages, userMessage],
          }
        : null
    );

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "message",
          chatId: chat.id,
          message: userMessage.content,
        }),
      });

      if (response.ok) {
        const result = await response.json();

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: result.response.content || result.response,
          role: "ASSISTANT",
          createdAt: new Date().toISOString(),
          citations: result.response.citations || [],
        };

        setChat((prev) =>
          prev
            ? {
                ...prev,
                messages: [...prev.messages, assistantMessage],
              }
            : null
        );
      } else {
        // Handle error
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: "Sorry, I encountered an error. Please try again.",
          role: "ASSISTANT",
          createdAt: new Date().toISOString(),
        };

        setChat((prev) =>
          prev
            ? {
                ...prev,
                messages: [...prev.messages, assistantMessage],
              }
            : null
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (status === "loading" || isInitialLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Chat not found</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Chat Header */}
      <div className="bg-white border-b p-4 hidden lg:block">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 line-clamp-2 text-lg lg:text-xl">
              {chat.title}
            </h2>
            <p className="text-sm text-gray-600">
              AI-powered chat • {chat.messages.length} messages
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 pb-4">
        {chat.messages.length === 0 ? (
          <div className="text-center py-8 opacity-80">
            <AppLogo showText={false} className="mx-auto mb-3" />
            <p className="text-secondary font-mono font-medium text-sm lg:text-base">
              Ask me anything about your document. I&apos;m here to help you
              learn!
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl mx-auto">
            {chat.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex space-x-3 ${msg.role === "USER" ? "flex-row-reverse space-x-reverse" : ""}`}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
                  {msg.role === "ASSISTANT" ? (
                    <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-amber-200 rounded-lg flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <Card
                    className={`p-3 lg:p-4 ${
                      msg.role === "USER"
                        ? "bg-amber-200 ml-8 lg:ml-16"
                        : "bg-white border mr-8 lg:mr-16"
                    }`}
                  >
                    <MarkdownRenderer content={msg.content} />

                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Sources:</p>
                        <div className="space-y-1">
                          {msg.citations.map((citation, index) => (
                            <p key={index} className="text-xs text-gray-600">
                              {citation}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>

                  <p
                    className={`text-xs mt-1 px-1 ${
                      msg.role === "USER"
                        ? "text-right text-gray-500"
                        : "text-gray-500"
                    }`}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex space-x-3">
                <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <Card className="p-3 lg:p-4 bg-white border mr-8 lg:mr-16">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                    <p className="text-gray-600 text-sm">Thinking...</p>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t p-4 safe-area-inset-bottom">
        <div className="max-w-4xl mx-auto">
          <div className="flex space-x-3">
            <Input
              placeholder="Ask a question about your document..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={loading}
              className="flex-1 min-w-0"
            />
            <Button
              onClick={sendMessage}
              disabled={!message.trim() || loading}
              className="flex-shrink-0"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          <p className="text-xs text-gray-500 mt-2 hidden lg:block">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </>
  );
}
