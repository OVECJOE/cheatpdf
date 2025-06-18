"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  ArrowLeft,
  MessageCircle,
  ClipboardList,
  Trash2,
  Download,
  Eye,
  Loader2,
  Calendar,
  HardDrive,
  MoreVertical,
  Clock,
  Activity,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface DocumentDetail {
  id: string;
  name: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  vectorized: boolean;
  createdAt: string;
  updatedAt: string;
  content: string;
  _count: {
    chats: number;
    exams: number;
  };
  chats: Array<{
    id: string;
    title: string;
    createdAt: string;
  }>;
  exams: Array<{
    id: string;
    title: string;
    createdAt: string;
    status: string;
  }>;
}

export default function DocumentDetailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const documentId = params.id as string;
  
  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (documentId) {
      fetchDocument();
    }
  }, [documentId]);

  const fetchDocument = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}`);
      if (response.ok) {
        const data = await response.json();
        setDocument(data.document);
      } else if (response.status === 404) {
        router.push("/dashboard/documents");
      }
    } catch (error) {
      console.error("Failed to fetch document:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (!confirm("Are you sure you want to delete this document? This action cannot be undone.")) {
      return;
    }

    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/dashboard/documents");
      } else {
        alert("Failed to delete document");
      }
    } catch (error) {
      console.error("Failed to delete document:", error);
      alert("Failed to delete document");
    } finally {
      setDeleteLoading(false);
    }
  };

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

  if (!document) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-foreground mb-2">Document not found</h2>
          <p className="text-muted-foreground mb-4">
            The document you're looking for doesn't exist or has been deleted.
          </p>
          <Button onClick={() => router.push("/dashboard/documents")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Documents
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/documents")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{document.name}</h1>
            <p className="text-muted-foreground">
              Document details and activity overview
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            onClick={() => router.push(`/dashboard/chats/new?document=${document.id}`)}
            disabled={!document.vectorized}
            className="w-full sm:w-auto"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Start Chat
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border">
              <DropdownMenuItem
                onClick={() => router.push(`/dashboard/exams/new?document=${document.id}`)}
                className="cursor-pointer"
                disabled={!document.vectorized}
              >
                <ClipboardList className="w-4 h-4 mr-2" />
                Create Exam
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDeleteDocument}
                className="cursor-pointer text-destructive"
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Delete Document
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Document Info Card */}
      <Card className="p-6 border-border bg-card">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-semibold text-foreground">{document.name}</h2>
              <Badge variant={document.vectorized ? "default" : "secondary"}>
                {document.vectorized ? "Ready" : "Processing"}
              </Badge>
            </div>
            <p className="text-muted-foreground">{document.fileName}</p>
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <span className="flex items-center">
                <HardDrive className="w-4 h-4 mr-1" />
                {formatFileSize(document.fileSize)}
              </span>
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {format(new Date(document.createdAt), "MMM d, yyyy")}
              </span>
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {formatDistanceToNow(new Date(document.updatedAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <MessageCircle className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{document._count.chats}</p>
              <p className="text-sm text-muted-foreground">Total Chats</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <ClipboardList className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{document._count.exams}</p>
              <p className="text-sm text-muted-foreground">Total Exams</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Chats */}
        <Card className="p-6 border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center">
              <MessageCircle className="w-5 h-5 mr-2" />
              Recent Chats
            </h3>
            {document._count.chats > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/dashboard/chats/new?document=${document.id}`)}
                disabled={!document.vectorized}
              >
                New Chat
              </Button>
            )}
          </div>
          
          {document.chats.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">No chats yet</p>
              <Button
                size="sm"
                onClick={() => router.push(`/dashboard/chats/new?document=${document.id}`)}
                disabled={!document.vectorized}
              >
                Start First Chat
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {document.chats.map((chat) => (
                <div
                  key={chat.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/dashboard/chats/${chat.id}`)}
                >
                  <div>
                    <p className="font-medium text-foreground truncate">{chat.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(chat.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <Eye className="w-4 h-4 text-muted-foreground" />
                </div>
              ))}
              {document._count.chats > 5 && (
                <div className="text-center pt-2">
                  <p className="text-sm text-muted-foreground">
                    +{document._count.chats - 5} more chats
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Recent Exams */}
        <Card className="p-6 border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center">
              <ClipboardList className="w-5 h-5 mr-2" />
              Recent Exams
            </h3>
            {document._count.exams > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/dashboard/exams/new?document=${document.id}`)}
                disabled={!document.vectorized}
              >
                New Exam
              </Button>
            )}
          </div>
          
          {document.exams.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">No exams yet</p>
              <Button
                size="sm"
                onClick={() => router.push(`/dashboard/exams/new?document=${document.id}`)}
                disabled={!document.vectorized}
              >
                Create First Exam
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {document.exams.map((exam) => (
                <div
                  key={exam.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/dashboard/exams/${exam.id}`)}
                >
                  <div>
                    <p className="font-medium text-foreground truncate">{exam.title}</p>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {exam.status}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(exam.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <Eye className="w-4 h-4 text-muted-foreground" />
                </div>
              ))}
              {document._count.exams > 5 && (
                <div className="text-center pt-2">
                  <p className="text-sm text-muted-foreground">
                    +{document._count.exams - 5} more exams
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
} 