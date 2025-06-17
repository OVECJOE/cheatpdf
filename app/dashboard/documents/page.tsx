"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  Upload,
  Search,
  MoreVertical,
  MessageCircle,
  ClipboardList,
  Trash2,
  Download,
  Eye,
  Loader2,
  FolderOpen,
  Calendar,
  HardDrive,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

export default function DocumentsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch("/api/documents");
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document? This action cannot be undone.")) {
      return;
    }

    setDeleteLoading(documentId);
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setDocuments(docs => docs.filter(doc => doc.id !== documentId));
      } else {
        alert("Failed to delete document");
      }
    } catch (error) {
      console.error("Failed to delete document:", error);
      alert("Failed to delete document");
    } finally {
      setDeleteLoading(null);
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground">
            Manage your uploaded documents and study materials
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/upload")} className="w-full sm:w-auto">
          <Upload className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-xl">
        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{documents.length}</p>
              <p className="text-sm text-muted-foreground">Total Documents</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <MessageCircle className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {documents.reduce((sum, doc) => sum + doc._count.chats, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total Chats</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <HardDrive className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {formatFileSize(documents.reduce((sum, doc) => sum + doc.fileSize, 0))}
              </p>
              <p className="text-sm text-muted-foreground">Total Storage</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Documents List */}
      {filteredDocuments.length === 0 ? (
        <Card className="p-8 border-border bg-card">
          <div className="text-center">
            <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {documents.length === 0 ? "No documents yet" : "No documents found"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {documents.length === 0 
                ? "Upload your first document to get started with CheatPDF"
                : "Try adjusting your search query"
              }
            </p>
            {documents.length === 0 && (
              <Button onClick={() => router.push("/dashboard/upload")}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredDocuments.map((document) => (
            <Card key={document.id} className="p-4 border-border bg-card hover:shadow-md transition-shadow">
              <div className="space-y-3">
                {/* Document Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-foreground truncate">
                        {document.name}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {document.fileName}
                      </p>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card border-border">
                      <DropdownMenuItem
                        onClick={() => router.push(`/dashboard/chats/new?document=${document.id}`)}
                        className="cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Start Chat
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => router.push(`/dashboard/exams/new?document=${document.id}`)}
                        className="cursor-pointer"
                      >
                        <ClipboardList className="w-4 h-4 mr-2" />
                        Create Exam
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteDocument(document.id)}
                        className="cursor-pointer text-destructive"
                        disabled={deleteLoading === document.id}
                      >
                        {deleteLoading === document.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 mr-2" />
                        )}
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Document Stats */}
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <span className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatDistanceToNow(new Date(document.createdAt), { addSuffix: true })}
                  </span>
                  <span>{formatFileSize(document.fileSize)}</span>
                </div>

                {/* Status & Badges */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant={document.vectorized ? "default" : "secondary"}>
                      {document.vectorized ? "Ready" : "Processing"}
                    </Badge>
                    {document._count.chats > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {document._count.chats} chat{document._count.chats !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex space-x-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/dashboard/chats/new?document=${document.id}`)}
                    disabled={!document.vectorized}
                    className="flex-1"
                  >
                    <MessageCircle className="w-3 h-3 mr-1" />
                    Chat
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/dashboard/exams/new?document=${document.id}`)}
                    disabled={!document.vectorized}
                    className="flex-1"
                  >
                    <ClipboardList className="w-3 h-3 mr-1" />
                    Exam
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 