"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageCircle,
  Send,
  FileText,
  User,
  Bot,
  Loader2,
  MoreVertical,
  Trash2,
  Copy,
  ArrowLeft,
  Sparkles,
  Clock,
  CheckCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import MarkdownRenderer from "@/components/markdown-renderer";

interface Message {
  id: string;
  content: string;
  role: "USER" | "ASSISTANT";
  createdAt: string;
}

interface Chat {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  document: {
    id: string;
    name: string;
    fileName: string;
  };
  messages: Message[];
}

export default function ChatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.id as string;

  const [chat, setChat] = useState<Chat | null>(null);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [deleting, setDeleting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Pagination state for messages
  const [startIndex, setStartIndex] = useState(0);
  const PAGE_SIZE = 10;

  const getVisibleMessages = useCallback(() => {
    if (!chat) return [];
    const total = chat.messages.length;
    const start = Math.max(0, total - PAGE_SIZE - startIndex);
    const end = total - startIndex;
    return chat.messages.slice(start, end);
  }, [chat, startIndex]);

  // Handler to load previous messages
  const loadPreviousMessages = useCallback(() => {
    if (!chat) return;
    setStartIndex((prev) => Math.min(chat.messages.length - PAGE_SIZE, prev + PAGE_SIZE));
  }, [chat]);

  // When chat or messages change, reset to latest page
  useEffect(() => {
    if (chat) {
      setStartIndex(0);
    }
  }, [chat]);

  useEffect(() => {
    if (chatId) {
      fetchChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchChat = async () => {
    try {
      const response = await fetch(`/api/chats/${chatId}`);
      if (response.ok) {
        const data = await response.json();
        setChat(data.chat);
      } else if (response.status === 404) {
        toast.error("Chat not found");
        router.push("/dashboard/chats");
      } else {
        toast.error("Failed to load chat");
      }
    } catch (error) {
      console.error("Error fetching chat:", error);
      toast.error("Failed to load chat");
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || sending || !chat) return;

    const userMessage = message.trim();
    setMessage("");
    setSending(true);

    // Add user message optimistically
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      content: userMessage,
      role: "USER",
      createdAt: new Date().toISOString(),
    };

    setChat(prev => prev ? {
      ...prev,
      messages: [...prev.messages, tempUserMessage]
    } : null);

    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Replace temp message with real messages
        setChat(prev => prev ? {
          ...prev,
          messages: [...prev.messages, data.message]
        } : null);
      } else {
        // Remove temp message on error
        setChat(prev => prev ? {
          ...prev,
          messages: prev.messages.filter(m => m.id !== tempUserMessage.id)
        } : null);

        const errorData = await response.json();
        toast.error(errorData.error || "Failed to send message");
      }
    } catch (error) {
      // Remove temp message on error
      setChat(prev => prev ? {
        ...prev,
        messages: prev.messages.filter(m => m.id !== tempUserMessage.id)
      } : null);

      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Auto-resize textarea based on content
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Reset height to get the correct scrollHeight
    e.target.style.height = 'auto';

    // Set height based on scrollHeight, with min and max constraints
    const scrollHeight = e.target.scrollHeight;
    const minHeight = 40; // min-h-[40px]
    const maxHeight = 120; // max-h-[120px]

    if (scrollHeight > maxHeight) {
      e.target.style.height = `${maxHeight}px`;
      e.target.style.overflowY = 'auto';
    } else if (scrollHeight < minHeight) {
      e.target.style.height = `${minHeight}px`;
      e.target.style.overflowY = 'hidden';
    } else {
      e.target.style.height = `${scrollHeight}px`;
      e.target.style.overflowY = 'hidden';
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Message copied to clipboard");
  };

  const deleteChat = async () => {
    if (!chat || !confirm("Are you sure you want to delete this chat? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/chats/${chat.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Chat deleted successfully");
        router.push("/dashboard/chats");
      } else {
        toast.error("Failed to delete chat");
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast.error("Failed to delete chat");
    } finally {
      setDeleting(false);
    }
  };

  const jumpToLatest = () => {
    setStartIndex(0);
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  };

  if (!chat) {
    return (
      <div className="p-6">
        <Card className="p-8 border-border bg-card text-center">
          <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Chat Not Found</h3>
          <p className="text-muted-foreground mb-4">
            The chat you&apos;re looking for doesn&apos;t exist or has been deleted.
          </p>
          <Button onClick={() => router.push("/dashboard/chats")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Chats
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-3.5rem)] md:h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="flex-shrink-0 p-4 sm:p-6 pb-0">
        <div className="flex items-center justify-between space-y-3 sm:space-y-0 mb-4">
          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/chats")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden xs:inline">Back</span>
            </Button>
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate">{chat.title}</h1>
                <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground">
                  <FileText className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{chat.document.name}</span>
                  <span className="hidden sm:inline">•</span>
                  <Clock className="w-3 h-3 flex-shrink-0 hidden sm:inline" />
                  <span className="hidden sm:inline">{formatDistanceToNow(new Date(chat.createdAt), { addSuffix: true })}</span>
                </div>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex-shrink-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border">
              <DropdownMenuItem
                onClick={() => router.push(`/dashboard/documents/${chat.document.id}`)}
                className="cursor-pointer"
              >
                <FileText className="w-4 h-4 mr-2" />
                View Document
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={deleteChat}
                className="cursor-pointer text-destructive"
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Delete Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 min-h-0">
        <div className="space-y-4 pb-4">
          {/* Load previous button if there are more messages */}
          {chat && chat.messages.length - startIndex > PAGE_SIZE && (
            <div className="flex justify-center mb-2">
              <Button size="sm" variant="outline" onClick={loadPreviousMessages}>
                Load previous messages
              </Button>
            </div>
          )}
          {getVisibleMessages().length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Start the conversation!
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 px-4">
                Ask questions about &quot;{chat.document.name}&quot; to get started.
              </p>
              <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto px-4">
                <Badge variant="outline" className="text-xs">&quot;Summarize the main points&quot;</Badge>
                <Badge variant="outline" className="text-xs">&quot;What are the key concepts?&quot;</Badge>
                <Badge variant="outline" className="text-xs">&quot;Explain this topic in detail&quot;</Badge>
              </div>
            </div>
          ) : (
            getVisibleMessages().map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start space-x-3 ${msg.role === "USER" ? "flex-row-reverse space-x-reverse" : ""}`}
              >
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "USER" ? "bg-primary/10" : "bg-secondary/10"}`}>
                  {msg.role === "USER" ? (
                    <User className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                  ) : (
                    <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-secondary" />
                  )}
                </div>
                <div className={`flex-1 min-w-0 ${msg.role === "USER" ? "text-right" : ""}`}>
                  <div className={`inline-block sm:max-w-[85%] lg:max-w-[75%] p-3 sm:p-4 rounded-lg ${msg.role === "USER" ? "bg-primary text-primary-foreground" : "bg-card border border-border"}`}>
                    {msg.role === "USER" ? (
                      <div className="text-sm whitespace-pre-wrap break-words">{msg.content}</div>
                    ) : (
                      <div className="text-sm">
                        <MarkdownRenderer content={msg.content} />
                      </div>
                    )}
                  </div>
                  <div className={`flex items-center space-x-2 mt-2 text-xs text-muted-foreground ${msg.role === "USER" ? "justify-end" : ""}`}>
                    <span className="hidden sm:inline">{formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyMessage(msg.content)}
                      className="h-6 w-6 p-0 hover:bg-muted"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
          {sending && (
            <div className="flex items-start space-x-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-secondary" />
              </div>
              <div className="flex-1">
                <div className="inline-block bg-card border border-border p-3 sm:p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-secondary" />
                    <span className="text-sm text-muted-foreground">AI is thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
          {startIndex > 0 && (
            <div className="flex justify-center mt-2">
              <Button size="sm" variant="outline" onClick={jumpToLatest}>
                Jump to latest
              </Button>
            </div>
          )}
        </div>
      </div>
      {/* Message Input */}
      <div className="flex-shrink-0 p-4 sm:p-6 pt-0 pb-4 sm:pb-6">
        <Card className="p-3 sm:p-4 border-border bg-card">
          <div className="flex items-end space-x-2 sm:space-x-3">
            <div className="flex-1">
              <Textarea
                value={message}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyPress}
                placeholder="Ask a question about the document..."
                disabled={sending}
                className="resize-none text-sm sm:text-base min-h-[40px] max-h-[120px]"
                rows={1}
              />
            </div>
            <Button
              onClick={sendMessage}
              disabled={!message.trim() || sending}
              size="sm"
              className="flex-shrink-0"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-3 space-y-1 sm:space-y-0 text-xs text-muted-foreground">
            <span className="hidden sm:inline">Press Enter to send, Shift+Enter for new line</span>
            <span className="sm:hidden text-center">Tap Send or press Enter</span>
            <div className="flex items-center justify-center sm:justify-end space-x-2">
              <CheckCircle className="w-3 h-3 text-secondary" />
              <span>AI-powered responses</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 