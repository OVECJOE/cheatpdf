"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Loader2,
  Sparkles,
  Zap,
  Target,
  ArrowRight,
  MessageCircle,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";

interface UploadedFile {
  file: File;
  id: string;
  status: "uploading" | "completed" | "error";
  progress: number;
  error?: string;
  documentId?: string;
}

interface DocumentResponse {
  document: {
    id: string;
    name: string;
    fileName: string;
    fileSize: number;
    contentType: string;
    vectorized: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

interface ErrorResponse {
  error: string;
}

export default function DashboardUploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const controllers = abortControllersRef.current;
      controllers.forEach(controller => {
        controller.abort();
      });
      controllers.clear();
    };
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleFiles = useCallback((newFiles: File[]) => {
    const uploadFiles: UploadedFile[] = newFiles.map(file => ({
      file,
      id: crypto.randomUUID(),
      status: "uploading",
      progress: 0
    }));

    setFiles(prev => [...prev, ...uploadFiles]);
    uploadFiles.forEach(uploadFile => {
      uploadSingleFile(uploadFile);
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, [handleFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
    e.target.value = '';
  };

  const uploadSingleFile = async (uploadFile: UploadedFile) => {
    const abortController = new AbortController();
    abortControllersRef.current.set(uploadFile.id, abortController);
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile.file);
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/documents");
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setFiles(prev => prev.map(f =>
            f.id === uploadFile.id ? { ...f, progress: percent } : f
          ));
        }
      };
      xhr.onload = () => {
        abortControllersRef.current.delete(uploadFile.id);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result: DocumentResponse = JSON.parse(xhr.responseText);
            setFiles(prev => prev.map(f =>
              f.id === uploadFile.id
                ? {
                  ...f,
                  status: "completed",
                  progress: 100,
                  documentId: result.document.id
                }
                : f
            ));
            toast.success(`${uploadFile.file.name} uploaded successfully!`);
          } catch {
            setFiles(prev => prev.map(f =>
              f.id === uploadFile.id
                ? {
                  ...f,
                  status: "error",
                  progress: 0,
                  error: "Upload succeeded but response was invalid"
                }
                : f
            ));
            toast.error(`Upload succeeded but response was invalid for ${uploadFile.file.name}`);
          }
        } else {
          let errorMsg = `Upload failed (${xhr.status})`;
          try {
            const errorData: ErrorResponse = JSON.parse(xhr.responseText);
            errorMsg = errorData.error || errorMsg;
          } catch {}
          setFiles(prev => prev.map(f =>
            f.id === uploadFile.id
              ? {
                ...f,
                status: "error",
                progress: 0,
                error: errorMsg
              }
              : f
          ));
          toast.error(errorMsg);
        }
        setIsLoading(false);
      };
      xhr.onerror = () => {
        abortControllersRef.current.delete(uploadFile.id);
        setFiles(prev => prev.map(f =>
          f.id === uploadFile.id
            ? {
              ...f,
              status: "error",
              progress: 0,
              error: "Network error occurred"
            }
            : f
        ));
        toast.error(`Failed to upload ${uploadFile.file.name}`);
        setIsLoading(false);
      };
      xhr.onabort = () => {
        abortControllersRef.current.delete(uploadFile.id);
        setIsLoading(false);
      };
      xhr.send(formData);
    } catch {
      abortControllersRef.current.delete(uploadFile.id);
      setFiles(prev => prev.map(f =>
        f.id === uploadFile.id
          ? {
            ...f,
            status: "error",
            progress: 0,
            error: "Upload failed"
          }
          : f
      ));
      toast.error(`Failed to upload ${uploadFile.file.name}`);
      setIsLoading(false);
    }
  };

  const removeFile = (id: string) => {
    const abortController = abortControllersRef.current.get(id);
    if (abortController) {
      abortController.abort();
      abortControllersRef.current.delete(id);
    }

    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const retryUpload = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    setFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, status: "uploading", progress: 0, error: undefined }
        : f
    ));

    uploadSingleFile(file);
  };

  const getStatusIcon = (status: UploadedFile["status"]) => {
    switch (status) {
      case "uploading":
        return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-secondary" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-destructive" />;
    }
  };

  const getStatusText = (status: UploadedFile["status"]) => {
    switch (status) {
      case "uploading":
        return "Uploading and processing...";
      case "completed":
        return "Ready to chat!";
      case "error":
        return "Upload failed";
    }
  };

  const completedFiles = files.filter(f => f.status === "completed");
  const hasUploading = files.some(f => f.status === "uploading");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Upload Documents</h1>
        <p className="text-muted-foreground">
          Upload PDF documents to start chatting with your study materials using AI
        </p>
      </div>

      {/* Upload Area */}
      <Card className="p-8 border-border bg-card">
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200 ${
            isLoading
              ? "border-muted bg-muted/50 cursor-not-allowed"
              : dragActive 
                ? "border-primary bg-primary/10 scale-[1.02]" 
                : "border-border hover:border-primary/50 hover:bg-primary/5"
          }`}
          onDragEnter={!isLoading ? handleDrag : undefined}
          onDragLeave={!isLoading ? handleDrag : undefined}
          onDragOver={!isLoading ? handleDrag : undefined}
          onDrop={!isLoading ? handleDrop : undefined}
        >
          <div className={`transition-all duration-200 ${dragActive ? 'scale-110' : ''}`}>
            <Upload className={`w-16 h-16 mx-auto mb-6 ${
              isLoading ? 'text-muted-foreground' : 
              dragActive ? 'text-primary' : 'text-muted-foreground'
            }`} />
          </div>
          
          <h3 className={`text-xl font-semibold mb-3 ${
            isLoading ? 'text-muted-foreground' : 'text-foreground'
          }`}>
            {dragActive ? 'Drop your files here!' : 'Drop your PDF files here'}
          </h3>
          
          <p className={`mb-6 ${
            isLoading ? 'text-muted-foreground/70' : 'text-muted-foreground'
          }`}>
            or click to browse and select files
          </p>
          
          <input
            type="file"
            multiple
            accept=".pdf"
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
            disabled={isLoading}
          />
          
          <label 
            htmlFor="file-upload" 
            className={`inline-flex items-center px-6 py-3 rounded-lg font-medium cursor-pointer transition-all duration-200 ${
              isLoading 
                ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 mr-2" />
                Select PDF Files
              </>
            )}
          </label>
          
          <div className="mt-6 flex items-center justify-center space-x-6 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>PDF format only</span>
            </div>
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span>Max 10MB per file</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>AI-powered processing</span>
            </div>
          </div>
        </div>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card className="p-6 border-border bg-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">
              Uploaded Files ({files.length})
            </h3>
            {hasUploading && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing files...</span>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            {files.map((file) => (
              <div key={file.id} className="flex items-center space-x-4 p-4 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {file.file.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {(file.file.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      className="ml-2 text-muted-foreground hover:text-destructive"
                      disabled={file.status === "uploading"}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(file.status)}
                      <span className="text-sm text-muted-foreground">
                        {getStatusText(file.status)}
                      </span>
                    </div>
                    
                    {file.status === "error" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => retryUpload(file.id)}
                        className="text-xs"
                      >
                        Retry
                      </Button>
                    )}

                    {file.status === "completed" && (
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => router.push(`/dashboard/chats/new?document=${file.documentId}`)}
                          className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Chat
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/dashboard/exams/new?document=${file.documentId}`)}
                          className="text-xs"
                        >
                          <ClipboardList className="w-3 h-3 mr-1" />
                          Exam
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {file.error && (
                    <p className="text-sm text-destructive mt-2">
                      {file.error}
                    </p>
                  )}
                  
                  {file.status === "uploading" && (
                    <div className="w-full bg-muted rounded-full h-2 mt-3">
                      <div
                        className="bg-primary h-2 rounded-full w-full"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {completedFiles.length > 0 && (
            <div className="mt-6 p-4 bg-secondary/10 border border-secondary/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-secondary flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    {completedFiles.length} file{completedFiles.length > 1 ? "s" : ""} ready!
                  </h4>
                  <p className="text-sm text-secondary/80 mt-1">
                    Your documents have been processed and are ready for AI chat.
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => router.push("/dashboard/chats/new")}
                    className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Start New Chat
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => router.push("/dashboard/documents")}
                    disabled={hasUploading}
                  >
                    View All Documents
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Info Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-6 text-center border-border bg-card hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Upload className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">Easy Upload</h3>
          <p className="text-sm text-muted-foreground">
            Simply drag and drop your PDF files or click to browse. Multiple files supported.
          </p>
        </Card>

        <Card className="p-6 text-center border-border bg-card hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-secondary" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">AI Processing</h3>
          <p className="text-sm text-muted-foreground">
            Our AI analyzes your documents and creates searchable knowledge for instant answers.
          </p>
        </Card>

        <Card className="p-6 text-center border-border bg-card hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-6 h-6 text-accent" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">Start Learning</h3>
          <p className="text-sm text-muted-foreground">
            Chat with your documents, ask questions, and get instant, accurate answers.
          </p>
        </Card>
      </div>
    </div>
  );
} 