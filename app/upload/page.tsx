/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState, useCallback, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Upload, FileText, CheckCircle, AlertCircle, ArrowLeft, X, Loader2, Plus, Trash2 } from "lucide-react";

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

  const clearAllFiles = () => {
    // Abort all ongoing uploads
    abortControllersRef.current.forEach(controller => {
      controller.abort();
    });
    abortControllersRef.current.clear();
    setFiles([]);
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
        return "Processing...";
      case "completed":
        return "Ready";
      case "error":
        return "Failed";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const completedFiles = files.filter(f => f.status === "completed");
  const failedFiles = files.filter(f => f.status === "error");
  const uploadingFiles = files.filter(f => f.status === "uploading");
  const hasUploading = uploadingFiles.length > 0;

  // Handle authentication redirect with loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm rounded-xl px-6 py-4 shadow-lg">
          <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
          <span className="text-gray-700 font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/auth/sign-in");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-amber-200/50 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push("/dashboard")}
                disabled={hasUploading}
                className="border-amber-200 hover:bg-amber-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Upload Documents</h1>
                <p className="text-sm text-gray-600">Transform your PDFs into interactive study materials</p>
              </div>
            </div>
            {hasUploading && (
              <div className="flex items-center space-x-3 bg-blue-50 px-4 py-2 rounded-full">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  Processing {uploadingFiles.length} file{uploadingFiles.length > 1 ? "s" : ""}...
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          
          {/* Upload Area */}
          <Card className="p-8 mb-8 bg-white/70 backdrop-blur-sm border-amber-200/50 shadow-xl">
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
                isLoading
                  ? "border-gray-300 bg-gray-50/50 cursor-not-allowed"
                  : dragActive 
                    ? "border-amber-500 bg-amber-50/70 shadow-inner scale-[1.02]" 
                    : "border-amber-300 hover:border-amber-400 hover:bg-amber-50/30"
              }`}
              onDragEnter={!isLoading ? handleDrag : undefined}
              onDragLeave={!isLoading ? handleDrag : undefined}
              onDragOver={!isLoading ? handleDrag : undefined}
              onDrop={!isLoading ? handleDrop : undefined}
            >
              <div className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center ${isLoading ? 'bg-gray-100' : 'bg-amber-100'}`}>
                <Upload className={`w-8 h-8 ${isLoading ? 'text-gray-400' : 'text-amber-600'}`} />
              </div>
              
              <h3 className={`text-xl font-bold mb-3 ${isLoading ? 'text-gray-500' : 'text-gray-900'}`}>
                {dragActive ? "Drop your files here" : "Upload your study materials"}
              </h3>
              <p className={`mb-6 text-lg ${isLoading ? 'text-gray-400' : 'text-gray-600'}`}>
                Drag & drop PDF files or click to browse
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
                className={`inline-flex items-center px-8 py-3 rounded-xl font-semibold text-white transition-all duration-200 ${
                  isLoading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-105'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 mr-2" />
                    Select PDF Files
                  </>
                )}
              </label>
              
              <p className="text-sm text-gray-500 mt-6 bg-gray-50/50 rounded-lg py-2 px-4 inline-block">
                <strong>Supported:</strong> PDF files up to 10MB each
              </p>
            </div>
          </Card>

          {/* File List */}
          {files.length > 0 && (
            <Card className="p-6 bg-white/70 backdrop-blur-sm border-amber-200/50 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Upload Progress
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {files.length} file{files.length > 1 ? "s" : ""} • 
                    {completedFiles.length > 0 && <span className="text-green-600 font-medium"> {completedFiles.length} completed</span>}
                    {failedFiles.length > 0 && <span className="text-red-600 font-medium"> {failedFiles.length} failed</span>}
                    {uploadingFiles.length > 0 && <span className="text-blue-600 font-medium"> {uploadingFiles.length} processing</span>}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFiles}
                  disabled={hasUploading}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              </div>
              
              <div className="space-y-3">
                {files.map((file) => (
                  <div key={file.id} className={`flex items-center space-x-4 p-4 rounded-xl border transition-all duration-200 ${
                    file.status === "completed" ? "bg-green-50/50 border-green-200" :
                    file.status === "error" ? "bg-red-50/50 border-red-200" :
                    "bg-blue-50/50 border-blue-200"
                  }`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      file.status === "completed" ? "bg-green-100" :
                      file.status === "error" ? "bg-red-100" :
                      "bg-blue-100"
                    }`}>
                      <FileText className={`w-6 h-6 ${
                        file.status === "completed" ? "text-green-600" :
                        file.status === "error" ? "text-red-600" :
                        "text-blue-600"
                      }`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="font-semibold text-gray-900 truncate text-base">
                            {file.file.name}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatFileSize(file.file.size)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(file.status)}
                            <span className={`text-sm font-medium ${
                              file.status === "completed" ? "text-green-700" :
                              file.status === "error" ? "text-red-700" :
                              "text-blue-700"
                            }`}>
                              {getStatusText(file.status)}
                            </span>
                          </div>
                          {file.status === "error" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => retryUpload(file.id)}
                              className="border-amber-200 text-amber-700 hover:bg-amber-50"
                            >
                              Retry
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeFile(file.id)}
                            disabled={file.status === "uploading"}
                            className="border-gray-200 text-gray-500 hover:bg-gray-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {file.error && (
                        <div className="mt-2 p-2 bg-red-100/50 rounded-lg">
                          <p className="text-sm text-red-700">
                            <strong>Error:</strong> {file.error}
                          </p>
                        </div>
                      )}
                      
                      {file.status === "uploading" && (
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full animate-pulse" style={{width: '60%'}} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {completedFiles.length > 0 && (
                <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-green-900 text-lg">
                        🎉 {completedFiles.length} document{completedFiles.length > 1 ? "s" : ""} ready!
                      </h4>
                      <p className="text-green-700 mt-1">
                        Your materials have been processed and are ready for AI-powered learning.
                      </p>
                    </div>
                    <Button 
                      onClick={() => router.push("/chat")}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                      disabled={hasUploading}
                    >
                      Start Learning →
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Info Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <Card className="p-6 text-center bg-white/60 backdrop-blur-sm border-amber-200/50 hover:bg-white/80 transition-all duration-300 hover:shadow-lg hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Upload className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">Easy Upload</h3>
              <p className="text-gray-600">
                Simply drag and drop your PDF files or click to browse your device
              </p>
            </Card>

            <Card className="p-6 text-center bg-white/60 backdrop-blur-sm border-amber-200/50 hover:bg-white/80 transition-all duration-300 hover:shadow-lg hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">AI Processing</h3>
              <p className="text-gray-600">
                Advanced AI analyzes your documents and creates intelligent, searchable knowledge
              </p>
            </Card>

            <Card className="p-6 text-center bg-white/60 backdrop-blur-sm border-amber-200/50 hover:bg-white/80 transition-all duration-300 hover:shadow-lg hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">Interactive Learning</h3>
              <p className="text-gray-600">
                Ask questions, get instant answers, and engage with your study materials
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}