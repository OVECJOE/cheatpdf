"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  ArrowLeft,
  MessageCircle,
  ClipboardList,
  Trash2,
  Eye,
  Loader2,
  Calendar,
  HardDrive,
  MoreVertical,
  Clock,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import DocumentDetailPageLoading from "./loading";

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  const fetchDocument = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}`);
      if (response.ok) {
        const data = await response.json();
        setDocument(data.document);
      } else if (response.status === 404) {
        setDocument(null);
        toast.error("Document not found");
      } else {
        setDocument(null);
        toast.error("Failed to load document");
      }
    } catch (error) {
      console.error("Failed to fetch document:", error);
      setDocument(null);
      toast.error("Failed to load document");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (!document) return;

    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Document deleted successfully");
        router.push("/dashboard/documents");
      } else {
        toast.error("Failed to delete document");
      }
    } catch (error) {
      console.error("Failed to delete document:", error);
      toast.error("Failed to delete document");
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
    return <DocumentDetailPageLoading />;
  }

  if (!document) {
    return (
      <div className="p-6">
        <Card className="p-8 border-border bg-card text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Document Not Found</h3>
          <p className="text-muted-foreground mb-4">
            The document you&apos;re looking for doesn&apos;t exist or has been deleted.
          </p>
          <Button onClick={() => router.push("/dashboard/documents")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Documents
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={deleteLoading}>
                  {deleteLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <MoreVertical className="w-5 h-5" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/dashboard/chats/new?document=${document.id}`)} disabled={!document.vectorized}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  <span>Start Chat</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/dashboard/exams/new?document=${document.id}`)} disabled={!document.vectorized}>
                  <ClipboardList className="w-4 h-4 mr-2" />
                  <span>Create Exam</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-500 focus:text-red-500">
                      <Trash2 className="w-4 h-4 mr-2" />
                      <span>Delete Document</span>
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this document and all associated chats and exams.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteDocument} className="bg-red-500 hover:bg-red-600">
                        Yes, delete document
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Document Header */}
          <div className="mb-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-primary/10 rounded-xl flex-shrink-0">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground break-words leading-tight">
                    {document.name}
                  </h1>
                  <Badge variant={document.vectorized ? "default" : "secondary"} className="self-start sm:self-auto text-xs px-2 py-1">
                    {document.vectorized ? "Ready" : "Processing"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate mb-3" title={document.fileName}>
                  {document.fileName}
                </p>
                
                {/* Quick Stats */}
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <HardDrive className="w-4 h-4" />
                    {formatFileSize(document.fileSize)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(document.createdAt), "MMM d, yyyy")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatDistanceToNow(new Date(document.updatedAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => router.push(`/dashboard/chats/new?document=${document.id}`)}
                disabled={!document.vectorized}
                className="w-full sm:w-auto"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Start Chat
              </Button>
              <Button
                onClick={() => router.push(`/dashboard/exams/new?document=${document.id}`)}
                disabled={!document.vectorized}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <ClipboardList className="w-4 h-4 mr-2" />
                Create Exam
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <Card className="p-4 border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <MessageCircle className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{document._count.chats}</p>
                  <p className="text-sm text-muted-foreground">Total Chats</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <ClipboardList className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{document._count.exams}</p>
                  <p className="text-sm text-muted-foreground">Total Exams</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Content Section */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Recent Chats */}
            <Card className="p-6 border-border">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-secondary" />
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
                  <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="w-6 h-6 text-secondary" />
                  </div>
                  <p className="text-muted-foreground mb-3">No chats yet</p>
                  <Button
                    onClick={() => router.push(`/dashboard/chats/new?document=${document.id}`)}
                    disabled={!document.vectorized}
                    size="sm"
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
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{chat.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(chat.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <Eye className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-2" />
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
            <Card className="p-6 border-border">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-accent" />
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
                  <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ClipboardList className="w-6 h-6 text-accent" />
                  </div>
                  <p className="text-muted-foreground mb-3">No exams yet</p>
                  <Button
                    onClick={() => router.push(`/dashboard/exams/new?document=${document.id}`)}
                    disabled={!document.vectorized}
                    size="sm"
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
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{exam.title}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 mt-1">
                          <Badge variant="outline" className="text-xs self-start sm:self-auto">
                            {exam.status}
                          </Badge>
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(exam.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <Eye className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-2" />
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
      </div>
    </div>
  );
} 