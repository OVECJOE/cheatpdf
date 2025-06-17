"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  FileText,
  MessageCircle,
  Upload,
  Search,
  Loader2,
  CheckCircle,
  Calendar,
  Eye,
  AlertCircle,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Document {
  id: string;
  name: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  vectorized: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    chats: number;
    exams: number;
  };
}

export default function NewChatPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const searchParams = useSearchParams();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [chatTitle, setChatTitle] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchDocuments();
    }
  }, [session]);

  useEffect(() => {
    const documentId = searchParams.get("document");
    if (documentId) {
      setSelectedDocument(documents.find(doc => doc.id === documentId) || null);
    }
    if (selectedDocument) {
      setChatTitle(`Chat with ${selectedDocument.name}`);
    }
  }, [searchParams, documents]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch("/api/documents");
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      } else {
        toast.error("Failed to load documents");
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentSelect = (document: Document) => {
    setSelectedDocument(document);
    if (!chatTitle || chatTitle === `Chat with ${selectedDocument?.name}`) {
      setChatTitle(`Chat with ${document.name}`);
    }
  };

  const handleCreateChat = async () => {
    if (!selectedDocument || !chatTitle.trim()) {
      toast.error("Please select a document and enter a chat title");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: selectedDocument.id,
          title: chatTitle.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Chat created successfully!");
        router.push(`/dashboard/chats/${data.chat.id}`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to create chat");
      }
    } catch (error) {
      console.error("Error creating chat:", error);
      toast.error("Failed to create chat");
    } finally {
      setCreating(false);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      doc.name.toLowerCase().includes(searchTerm) ||
      doc.fileName.toLowerCase().includes(searchTerm)
    );
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-start justify-between w-full gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Create New Chat</h1>
            <p className="text-sm text-muted-foreground">
              Select a document to start a conversation
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/chats")}
            className="text-muted-foreground hover:text-foreground"
          >
            <span className="hidden xs:inline">Back to Chats</span>
            <span className="xs:hidden">Back</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Document Selection */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Documents Grid */}
          {filteredDocuments.length === 0 ? (
            <Card className="p-6 sm:p-8 text-center bg-card border-border">
              {documents.length === 0 ? (
                <>
                  <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Documents Found</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4">
                    You need to upload documents before creating chats.
                  </p>
                  <Button 
                    onClick={() => router.push("/dashboard/upload")}
                    className="gradient-brand text-white hover:opacity-90 transition-all duration-300"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </Button>
                </>
              ) : (
                <>
                  <Search className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Matching Documents</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Try a different search term or clear the search to see all documents.
                  </p>
                </>
              )}
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
              {filteredDocuments.map((document) => (
                <Card
                  key={document.id}
                  className={`p-4 cursor-pointer transition-all duration-200 ${
                    selectedDocument?.id === document.id
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border bg-card hover:shadow-md hover:border-primary/50"
                  }`}
                  onClick={() => handleDocumentSelect(document)}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className={`p-2 rounded-lg flex-shrink-0 ${
                          selectedDocument?.id === document.id
                            ? "bg-primary/20"
                            : "bg-primary/10"
                        }`}>
                          <FileText className={`w-5 h-5 ${
                            selectedDocument?.id === document.id
                              ? "text-primary"
                              : "text-primary/70"
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">
                            {document.name}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {document.fileName}
                          </p>
                        </div>
                      </div>
                      {selectedDocument?.id === document.id && (
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 text-sm">
                      <div className="flex items-center space-x-4">
                        <span className="text-muted-foreground">
                          {formatFileSize(document.fileSize)}
                        </span>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{document._count.chats}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {document.vectorized ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Ready
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-border text-muted-foreground text-xs">
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Processing
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3 mr-1" />
                      Uploaded {formatDistanceToNow(new Date(document.createdAt))} ago
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Chat Configuration Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          <Card className="p-4 sm:p-6 bg-card border-border lg:sticky lg:top-6">
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Chat Configuration</h3>
                
                {selectedDocument ? (
                  <div className="space-y-4">
                    <div className="p-3 border border-primary/20 rounded-lg bg-primary/5">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {selectedDocument.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(selectedDocument.fileSize)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Chat Title
                      </label>
                      <Input
                        value={chatTitle}
                        onChange={(e) => setChatTitle(e.target.value)}
                        placeholder="Enter chat title..."
                        className="w-full"
                      />
                    </div>

                    {!selectedDocument.vectorized && (
                      <div className="p-3 border border-amber-200 rounded-lg bg-amber-50">
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <p className="text-amber-800 font-medium">Document Processing</p>
                            <p className="text-amber-700">
                              This document is still being processed. You can create the chat, but it may take a moment before it's ready for conversation.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8">
                    <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Select a document to configure your chat
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleCreateChat}
                  disabled={!selectedDocument || !chatTitle.trim() || creating}
                  className="w-full gradient-brand hover:opacity-90 transition-all duration-300"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span className="hidden xs:inline">Creating Chat...</span>
                      <span className="xs:hidden">Creating...</span>
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Create Chat
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard/chats")}
                  className="w-full border-border text-foreground hover:bg-muted transition-all duration-300"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-4 bg-card border-border">
            <h4 className="font-semibold text-foreground mb-3">Quick Actions</h4>
            <div className="space-y-2">
              <Button
                variant="ghost"
                onClick={() => router.push("/dashboard/upload")}
                className="w-full justify-start text-muted-foreground hover:text-foreground"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload New Document
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.push("/dashboard/documents")}
                className="w-full justify-start text-muted-foreground hover:text-foreground"
              >
                <Eye className="w-4 h-4 mr-2" />
                View All Documents
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 