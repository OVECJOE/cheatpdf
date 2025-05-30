"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Upload, FileText, CheckCircle, AlertCircle, ArrowLeft, X } from "lucide-react";

interface UploadedFile {
  file: File;
  id: string;
  status: "uploading" | "processing" | "completed" | "error";
  progress: number;
  error?: string;
}

export default function UploadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);

  if (status === "unauthenticated") {
    router.push("/sign-in");
    return null;
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (newFiles: File[]) => {
    const pdfFiles = newFiles.filter(file => file.type === "application/pdf");
    
    if (pdfFiles.length !== newFiles.length) {
      alert("Please only upload PDF files.");
    }

    const uploadFiles: UploadedFile[] = pdfFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(7),
      status: "uploading",
      progress: 0
    }));

    setFiles(prev => [...prev, ...uploadFiles]);
    
    // Start uploading each file
    uploadFiles.forEach(uploadFile => {
      uploadSingleFile(uploadFile);
    });
  };

  const uploadSingleFile = async (uploadFile: UploadedFile) => {
    try {
      const formData = new FormData();
      formData.append("file", uploadFile.file);

      // Simulate progress
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress < 90) {
          setFiles(prev => prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, progress: Math.min(progress, 90) }
              : f
          ));
        }
      }, 500);

      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (response.ok) {
        const result = await response.json();
        
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, status: "processing", progress: 100 }
            : f
        ));

        // Simulate processing time
        setTimeout(() => {
          setFiles(prev => prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, status: "completed" }
              : f
          ));
        }, 2000);

      } else {
        const error = await response.json();
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, status: "error", error: error.message || "Upload failed" }
            : f
        ));
      }
    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: "error", error: "Network error" }
          : f
      ));
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const getStatusIcon = (status: UploadedFile["status"]) => {
    switch (status) {
      case "uploading":
      case "processing":
        return <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusText = (status: UploadedFile["status"]) => {
    switch (status) {
      case "uploading":
        return "Uploading...";
      case "processing":
        return "Processing...";
      case "completed":
        return "Ready to chat!";
      case "error":
        return "Error";
    }
  };

  const completedFiles = files.filter(f => f.status === "completed");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push("/dashboard")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">Upload Documents</h1>
            </div>
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
                dragActive 
                  ? "border-blue-600 bg-blue-50" 
                  : "border-gray-300 hover:border-gray-400"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Drop your PDF files here
              </h3>
              <p className="text-gray-600 mb-4">
                or click to browse and select files
              </p>
              
              <input
                type="file"
                multiple
                accept=".pdf"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button className="cursor-pointer">
                  Select PDF Files
                </Button>
              </label>
              
              <p className="text-sm text-gray-500 mt-4">
                Supported format: PDF • Max file size: 25MB each
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
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-gray-900 truncate">
                          {file.file.name}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                          className="ml-2"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(file.status)}
                          <span className="text-sm text-gray-600">
                            {getStatusText(file.status)}
                          </span>
                        </div>
                        
                        {file.error && (
                          <span className="text-sm text-red-600">
                            {file.error}
                          </span>
                        )}
                      </div>
                      
                      {(file.status === "uploading" || file.status === "processing") && (
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                          />
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
                    >
                      Start Chatting
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