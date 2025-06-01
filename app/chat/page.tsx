"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Send, ArrowLeft, FileText, Bot, User, Loader2, 
  MessageCircle, BookOpen, Brain, Sparkles 
} from "lucide-react";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: string;
  citations?: string[];
}

interface Document {
  id: string;
  filename: string;
  status: string;
}

interface Chat {
  id: string;
  title: string;
  documentId: string;
  messages: Message[];
}

export default function ChatPage() {
  const { status } = useSession();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<string>("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/sign-in");
      return;
    }

    if (status === "authenticated") {
      fetchData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, router]);

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages]);

  const fetchData = async () => {
    try {
      const [docsRes, chatsRes] = await Promise.all([
        fetch("/api/documents"),
        fetch("/api/chat")
      ]);

      const [docsData, chatsData] = await Promise.all([
        docsRes.json(),
        chatsRes.json()
      ]);

      const processedDocs = docsData.filter((doc: Document) => doc.status === "processed");
      setDocuments(processedDocs);
      setChats(chatsData);

      // Auto-select first document if available
      if (processedDocs.length > 0 && !selectedDocument) {
        setSelectedDocument(processedDocs[0].id);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const startNewChat = async () => {
    if (!selectedDocument) return;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: selectedDocument,
          title: `Chat with ${documents.find(d => d.id === selectedDocument)?.filename}`
        }),
      });

      if (response.ok) {
        const newChat = await response.json();
        setChats(prev => [newChat, ...prev]);
        setActiveChat(newChat);
      }
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || loading || !activeChat) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message.trim(),
      role: "user",
      timestamp: new Date().toISOString()
    };

    setActiveChat(prev => prev ? {
      ...prev,
      messages: [...prev.messages, userMessage]
    } : null);

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: activeChat.id,
          message: userMessage.content,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: result.response,
          role: "assistant",
          timestamp: new Date().toISOString(),
          citations: result.citations || []
        };

        setActiveChat(prev => prev ? {
          ...prev,
          messages: [...prev.messages, assistantMessage]
        } : null);

        // Update chats list
        setChats(prev => prev.map(chat => 
          chat.id === activeChat.id 
            ? { ...chat, messages: [...chat.messages, userMessage, assistantMessage] }
            : chat
        ));
      } else {
        // Handle error
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: "Sorry, I encountered an error. Please try again.",
          role: "assistant",
          timestamp: new Date().toISOString()
        };

        setActiveChat(prev => prev ? {
          ...prev,
          messages: [...prev.messages, assistantMessage]
        } : null);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </header>

        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Documents Available</h2>
            <p className="text-gray-600 mb-6">
              You need to upload and process some PDF documents before you can start chatting.
            </p>
            <Button onClick={() => router.push("/upload")}>
              Upload Documents
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push("/dashboard")}
            className="w-full mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Select Document
              </label>
              <Select value={selectedDocument} onValueChange={setSelectedDocument}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a document" />
                </SelectTrigger>
                <SelectContent>
                  {documents.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      {doc.filename}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={startNewChat} 
              disabled={!selectedDocument}
              className="w-full"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Chats</h3>
          {chats.length === 0 ? (
            <p className="text-sm text-gray-500">No chats yet</p>
          ) : (
            <div className="space-y-2">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setActiveChat(chat)}
                  className={`w-full p-3 text-left rounded-lg transition-colors ${
                    activeChat?.id === chat.id 
                      ? "bg-blue-50 border border-blue-200" 
                      : "hover:bg-gray-50"
                  }`}
                >
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {chat.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {chat.messages.length} messages
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {!activeChat ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Ready to Chat with Your PDFs?
              </h2>
              <p className="text-gray-600 mb-6">
                Select a document and start a new chat to begin asking questions about your study materials.
              </p>
              <div className="grid grid-cols-1 gap-3 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Ask questions about your documents</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Get instant, accurate answers</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Learn faster with AI assistance</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">{activeChat.title}</h2>
                  <p className="text-sm text-gray-600">
                    AI-powered chat • {activeChat.messages.length} messages
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeChat.messages.length === 0 ? (
                <div className="text-center py-8">
                  <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    Ask me anything about your document. I&apos;m here to help you learn!
                  </p>
                </div>
              ) : (
                activeChat.messages.map((msg) => (
                  <div key={msg.id} className={`flex space-x-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    
                    <div className={`max-w-2xl ${msg.role === "user" ? "order-first" : ""}`}>
                      <Card className={`p-4 ${
                        msg.role === "user" 
                          ? "bg-blue-600 text-white" 
                          : "bg-white border"
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        
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
                      
                      <p className={`text-xs mt-1 ${
                        msg.role === "user" ? "text-right text-gray-500" : "text-gray-500"
                      }`}>
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    
                    {msg.role === "user" && (
                      <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                ))
              )}
              
              {loading && (
                <div className="flex space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <Card className="p-4 bg-white border">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <p className="text-gray-600">Thinking...</p>
                    </div>
                  </Card>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t p-4">
              <div className="flex space-x-3">
                <Input
                  placeholder="Ask a question about your document..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                  className="flex-1"
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={!message.trim() || loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 mt-2">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}