/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState, useCallback, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Upload, FileText, CheckCircle, AlertCircle, ArrowLeft, X, Loader2 } from "lucide-react";

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

export default function UploadPage() {
  const { status } = useSession();
  const router = useRouter();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Abort any ongoing uploads
      abortControllersRef.current.forEach(controller => {
        controller.abort();
      });

      abortControllersRef.current.clear();
      setFiles([]);
      setDragActive(false);
      setIsLoading(false);
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

  const validateFile = (file: File): string | null => {
    // Check file type
    if (file.type !== "application/pdf") {
      return "Only PDF files are supported";
    }

    // Check file size (10MB limit to match API)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return "File size must be less than 10MB";
    }

    // Check file name length
    if (file.name.length > 255) {
      return "File name is too long";
    }

    return null;
  };

  const handleFiles = useCallback((newFiles: File[]) => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    newFiles.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    // Show validation errors
    if (errors.length > 0) {
      alert(`Upload errors:\n${errors.join('\n')}`);
    }

    if (validFiles.length === 0) {
      return;
    }

    const uploadFiles: UploadedFile[] = validFiles.map(file => ({
      file,
      id: crypto.randomUUID(),
      status: "uploading",
      progress: 0
    }));

    setFiles(prev => [...prev, ...uploadFiles]);
    
    // Start uploading each file
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
    // Clear input so same file can be selected again
    e.target.value = '';
  };

  const uploadSingleFile = async (uploadFile: UploadedFile) => {
    // Create abort controller for this upload
    const abortController = new AbortController();
    abortControllersRef.current.set(uploadFile.id, abortController);

    try {
      setIsLoading(true);
      
      const formData = new FormData();
      formData.append("file", uploadFile.file);

      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
        signal: abortController.signal,
      });

      // Remove abort controller since request completed
      abortControllersRef.current.delete(uploadFile.id);

      if (response.ok) {
        const result: DocumentResponse = await response.json();
        
        // Update file status to completed with document ID
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
      } else {
        const errorData: ErrorResponse = await response.json();
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { 
                ...f, 
                status: "error", 
                progress: 0,
                error: errorData.error || `Upload failed (${response.status})` 
              }
            : f
        ));
      }
    } catch (error) {
      // Don't show error if request was aborted
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      abortControllersRef.current.delete(uploadFile.id);
      
      let errorMessage = "Network error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { 
              ...f, 
              status: "error", 
              progress: 0,
              error: errorMessage 
            }
          : f
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const removeFile = (id: string) => {
    // Abort upload if it's in progress
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

    // Reset file status and retry upload
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
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
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

  // Handle authentication redirect with loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/auth/sign-in");
    return null;
  }

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col-reverse lg:flex-row items-center lg:items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push("/dashboard")}
                disabled={hasUploading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">Upload Documents</h1>
            </div>
            {hasUploading && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading files...</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Upload Your Study Materials
            </h2>
            <p className="text-gray-600">
              Upload PDF documents to start chatting with your study materials using AI
            </p>
          </div>

          {/* Upload Area */}
          <Card className="p-8 mb-8">
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                isLoading
                  ? "border-gray-300 bg-gray-50 cursor-not-allowed"
                  : dragActive 
                    ? "border-amber-600 bg-amber-50" 
                    : "border-gray-300 hover:border-gray-400"
              }`}
              onDragEnter={!isLoading ? handleDrag : undefined}
              onDragLeave={!isLoading ? handleDrag : undefined}
              onDragOver={!isLoading ? handleDrag : undefined}
              onDrop={!isLoading ? handleDrop : undefined}
            >
              <Upload className={`w-12 h-12 mx-auto mb-4 ${isLoading ? 'text-gray-300' : 'text-gray-400'}`} />
              <h3 className={`text-lg font-semibold mb-2 ${isLoading ? 'text-gray-500' : 'text-gray-900'}`}>
                Drop your PDF files here
              </h3>
              <p className={`mb-4 ${isLoading ? 'text-gray-400' : 'text-gray-600'}`}>
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
              <label htmlFor="file-upload" className="inline-flex items-center bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded cursor-pointer transition-colors">
                {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Select PDF Files"
                )}
              </label>
              
              <p className="text-sm text-gray-500 mt-4">
                Supported format: PDF • Max file size: 10MB each
              </p>
            </div>
          </Card>

          {/* File List */}
          {files.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Uploaded Files ({files.length})
              </h3>
              
              <div className="space-y-4">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-amber-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {file.file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(file.file.size / 1024 / 1024).toFixed(1)} MB
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                          className="ml-2"
                          disabled={file.status === "uploading"}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(file.status)}
                          <span className="text-sm text-gray-600">
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
                      </div>
                      
                      {file.error && (
                        <p className="text-sm text-red-600 mt-1">
                          {file.error}
                        </p>
                      )}
                      
                      {file.status === "uploading" && (
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div className="bg-amber-600 h-2 rounded-full animate-pulse" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {completedFiles.length > 0 && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-green-900">
                        {completedFiles.length} file{completedFiles.length > 1 ? "s" : ""} ready!
                      </h4>
                      <p className="text-sm text-green-700">
                        Your documents have been processed and are ready for AI chat.
                      </p>
                    </div>
                    <Button 
                      onClick={() => router.push("/chat")}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={hasUploading}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Start Learning
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Info Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Easy Upload</h3>
              <p className="text-sm text-gray-600">
                Simply drag and drop your PDF files or click to browse
              </p>
            </Card>

            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">AI Processing</h3>
              <p className="text-sm text-gray-600">
                Our AI analyzes your documents and creates searchable knowledge
              </p>
            </Card>

            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Start Learning</h3>
              <p className="text-sm text-gray-600">
                Chat with your documents, ask questions, and get instant answers
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}