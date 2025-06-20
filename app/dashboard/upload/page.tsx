"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Loader2,
  Zap,
  Target,
  ArrowRight,
  MessageCircle,
  ClipboardList,
  Pause,
  Play,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { getStageDisplayName } from "@/lib/utils";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: "queued" | "uploading" | "processing" | "completed" | "error" | "paused";
  progress: number;
  error?: string;
  documentId?: string;
  processingStage?: string;
  uploadController?: AbortController;
}

interface DocumentResponse {
  document: {
    id: string;
    name: string;
    fileName: string;
    fileSize: number;
    contentType: string;
    vectorized: boolean;
    extractionStage: string;
    createdAt: string;
    updatedAt: string;
  };
  status?: string;
}

interface ErrorResponse {
  error: string;
}

interface SSEEvent {
  type: 'connected' | 'progress' | 'error' | 'complete' | 'heartbeat';
  documentId: string;
  stage?: string;
  progress?: number;
  message?: string;
  error?: string;
  timestamp: string;
}

const MAX_CONCURRENT_UPLOADS = 3;
const PROGRESS_UPDATE_INTERVAL = 1000;

export default function DashboardUploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);
  
  const uploadQueueRef = useRef<UploadedFile[]>([]);
  const activeUploadsRef = useRef<Set<string>>(new Set());
  const progressTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const documentIdToFileIdMap = useRef<Map<string, string>>(new Map());
  const eventSourceRef = useRef<EventSource | null>(null);

  // Add the missing addFileToQueue function
  const addFileToQueue = useCallback((file: File) => {
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error(`${file.name} is not a PDF file. Only PDF files are supported.`);
      return;
    }

    // Check file size (100MB limit)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`${file.name} is too large. Maximum file size is 100MB.`);
      return;
    }

    // Check if file already exists
    const existingFile = files.find(f => f.name === file.name && f.size === file.size);
    if (existingFile) {
      toast.error(`${file.name} is already in the queue.`);
      return;
    }

    const newFile: UploadedFile = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      status: "queued",
      progress: 0,
    };

    setFiles(prev => [...prev, newFile]);
    uploadQueueRef.current.push(newFile);
    processQueue();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  const processQueue = useCallback(() => {
    while (activeUploadsRef.current.size < MAX_CONCURRENT_UPLOADS && uploadQueueRef.current.length > 0) {
      const nextFile = uploadQueueRef.current.shift();
      if (nextFile) {
        startUpload(nextFile);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleFiles = useCallback((newFiles: File[]) => {
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    const dataTransfer = new DataTransfer();
    newFiles.forEach(file => dataTransfer.items.add(file));
    fileInput.files = dataTransfer.files;
    newFiles.forEach(addFileToQueue);
  }, [addFileToQueue]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) handleFiles(Array.from(e.dataTransfer.files));
  }, [handleFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) handleFiles(Array.from(e.target.files));
  };

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => {
      const isMatch = f.id === id;
      if (isMatch) {
        if (f.uploadController) f.uploadController.abort();
        if (f.documentId) documentIdToFileIdMap.current.delete(f.documentId);
        const progressTimer = progressTimersRef.current.get(id);
        if (progressTimer) {
          clearInterval(progressTimer);
          progressTimersRef.current.delete(id);
        }
        uploadQueueRef.current = uploadQueueRef.current.filter(qf => qf.id !== id);
        activeUploadsRef.current.delete(id);
      }
      return !isMatch;
    }));
    processQueue();
  }, [processQueue]);

  const retryUpload = useCallback((fileId: string) => {
    const fileToRetry = files.find(f => f.id === fileId);
    if (!fileToRetry) return;
    
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    const fileObjects = Array.from(fileInput?.files || []);
    const originalFile = fileObjects.find(f => f.name === fileToRetry.name && f.size === fileToRetry.size);

    removeFile(fileId);
    
    if (originalFile) {
        addFileToQueue(originalFile);
    } else {
      toast.error("Original file not found. Please select it again to retry.");
    }
  }, [files, removeFile, addFileToQueue]);

  const togglePause = useCallback((fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    if (file.status === "uploading") {
      file.uploadController?.abort();
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: "paused" } : f));
      activeUploadsRef.current.delete(fileId);
    } else if (file.status === "paused") {
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: "queued" } : f));
      uploadQueueRef.current.unshift(file);
      processQueue();
    }
  }, [files, processQueue]);

  const startUpload = useCallback(async (uploadFile: UploadedFile) => {
    activeUploadsRef.current.add(uploadFile.id);
    setIsUploading(true);

    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    const originalFile = Array.from(fileInput?.files || []).find(f => f.name === uploadFile.name && f.size === uploadFile.size);
    
    if (!originalFile) {
      const errorMsg = "Could not find the original file object. Please try removing and re-adding the file.";
      setFiles(prev => prev.map(f => f.id === uploadFile.id ? { ...f, status: "error", error: errorMsg } : f));
      toast.error(errorMsg);
      activeUploadsRef.current.delete(uploadFile.id);
      processQueue();
      return;
    }

    const controller = new AbortController();
    setFiles(prev => prev.map(f => f.id === uploadFile.id ? { ...f, status: "uploading", uploadController: controller } : f));
    
    const progressTimer = setInterval(() => {
      setFiles(prev => prev.map(f => {
        if (f.id === uploadFile.id && f.status === "uploading" && f.progress < 90) {
          return { ...f, progress: Math.min(f.progress + 5, 90) };
        }
        return f;
      }));
    }, PROGRESS_UPDATE_INTERVAL);
    progressTimersRef.current.set(uploadFile.id, progressTimer);

    try {
      const formData = new FormData();
      formData.append("file", originalFile);
      
      const response = await fetch("/api/documents", { method: "POST", body: formData, signal: controller.signal });

      clearInterval(progressTimer);
      progressTimersRef.current.delete(uploadFile.id);

      if (response.ok) {
        const result: DocumentResponse = await response.json();
        
        documentIdToFileIdMap.current.set(result.document.id, uploadFile.id);
        
        // Update to processing state with progress continuing from 90%
        setFiles(prev => prev.map(f => f.id === uploadFile.id ? { 
          ...f, 
          documentId: result.document.id, 
          status: "processing",
          progress: 90, // Continue from where upload left off
          processingStage: "Starting processing..." 
        } : f));
        
        toast.success(`${uploadFile.name} uploaded successfully!`);
      } else {
        const errorData: ErrorResponse = await response.json();
        const errorMsg = errorData.error || `Upload failed (${response.status})`;
        setFiles(prev => prev.map(f => f.id === uploadFile.id ? { ...f, status: "error", error: errorMsg } : f));
        toast.error(errorMsg);
      }
    } catch (error) {
      clearInterval(progressTimer);
      progressTimersRef.current.delete(uploadFile.id);
      if (!(error instanceof Error && error.name === 'AbortError')) {
        setFiles(prev => prev.map(f => f.id === uploadFile.id ? { ...f, status: "error", error: "Upload failed" } : f));
        toast.error(`Failed to upload ${uploadFile.name}`);
      }
    } finally {
      activeUploadsRef.current.delete(uploadFile.id);
      if (activeUploadsRef.current.size === 0) setIsUploading(false);
      processQueue();
    }
  }, [processQueue]);

  useEffect(() => {
    // Only create one SSE connection
    if (eventSourceRef.current) {
      return;
    }

    const connectSSE = () => {
      const eventSource = new EventSource('/api/documents/events');
      eventSourceRef.current = eventSource;
      
      eventSource.onopen = () => {
        console.log('SSE connection established');
        setSseConnected(true);
      };
      
      eventSource.onmessage = (event) => {
        try {
          const data: SSEEvent = JSON.parse(event.data);
          
          // Skip heartbeat and connection events
          if (data.type === 'heartbeat' || data.type === 'connected') {
            console.log('SSE event received:', data.type);
            return;
          }
          
          const fileId = documentIdToFileIdMap.current.get(data.documentId);

          if (!fileId) {
            console.log(`No file mapping found for document ${data.documentId}`);
            return;
          }

          console.log('Processing SSE event:', data.type, 'for file:', fileId);

          switch (data.type) {
            case 'progress':
              setFiles(prev => prev.map(f => f.id === fileId ? {
                ...f,
                status: "processing",
                processingStage: data.message || getStageDisplayName(data.stage || ''),
                progress: Math.max(f.progress, Math.min(90 + (data.progress || 0) * 0.1, 100)),
              } : f));
              break;
              
            case 'complete':
              setFiles(prev => {
                const updatedFiles = prev.map(f => f.id === fileId ? {
                  ...f,
                  status: "completed" as const,
                  processingStage: "Completed",
                  progress: 100,
                } : f);
                
                // Find and toast success for completed file
                const completedFile = updatedFiles.find(f => f.id === fileId);
                if (completedFile) {
                  toast.success(`"${completedFile.name}" processed successfully!`);
                }
                
                return updatedFiles;
              });
              
              documentIdToFileIdMap.current.delete(data.documentId);
              break;
              
            case 'error':
              setFiles(prev => {
                const updatedFiles = prev.map(f => f.id === fileId ? {
                  ...f,
                  status: "error" as const,
                  error: data.error || "Processing failed",
                } : f);
                
                // Find and toast error for failed file
                const errorFile = updatedFiles.find(f => f.id === fileId);
                if (errorFile) {
                  toast.error(`"${errorFile.name}" failed: ${data.error}`);
                }
                
                return updatedFiles;
              });
              
              documentIdToFileIdMap.current.delete(data.documentId);
              break;
          }
        } catch (error) {
          console.error('Error parsing SSE event:', error);
        }
      };
      
      eventSource.onerror = (err) => {
        console.error('SSE connection error:', err);
        setSseConnected(false);
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (!eventSourceRef.current) {
            console.log('Attempting to reconnect SSE...');
            connectSSE();
          }
        }, 5000);
      };
    };

    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  const getStatusIcon = useCallback((status: UploadedFile["status"]) => {
    switch (status) {
      case "queued": return <Clock className="w-4 h-4 text-muted-foreground" />;
      case "uploading": case "processing": return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case "completed": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error": return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "paused": return <Pause className="w-4 h-4 text-orange-500" />;
    }
  }, []);

  const getStatusText = useCallback((status: UploadedFile["status"], processingStage?: string) => {
    switch (status) {
      case "queued": return "Queued";
      case "uploading": return "Uploading...";
      case "processing": return processingStage || "Processing...";
      case "completed": return "Ready to chat!";
      case "error": return "Upload failed";
      case "paused": return "Paused";
    }
  }, []);

  const completedFiles = useMemo(() => files.filter(f => f.status === "completed"), [files]);
  const queuedFiles = useMemo(() => files.filter(f => f.status === "queued"), [files]);

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Upload Documents</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Upload PDF documents to start chatting with your study materials using AI
        </p>
        <div className="flex items-center space-x-2 text-xs">
          <div className={`w-2 h-2 rounded-full ${sseConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-muted-foreground">
            {sseConnected ? 'Real-time updates connected' : 'Connecting to real-time updates...'}
          </span>
        </div>
      </div>

      <Card className="p-4 sm:p-8 border-border bg-card">
        <div
          className={`border-2 border-dashed rounded-lg p-6 sm:p-12 text-center transition-all duration-200 ${
            isUploading
              ? "border-muted bg-muted/50 cursor-not-allowed"
              : dragActive 
                ? "border-primary bg-primary/10 scale-[1.02]" 
                : "border-border hover:border-primary/50 hover:bg-primary/5"
          }`}
          onDragEnter={!isUploading ? handleDrag : undefined}
          onDragLeave={!isUploading ? handleDrag : undefined}
          onDragOver={!isUploading ? handleDrag : undefined}
          onDrop={!isUploading ? handleDrop : undefined}
        >
          <div className={`transition-all duration-200 ${dragActive ? 'scale-110' : ''}`}>
            <Upload className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 ${
              isUploading ? 'text-muted-foreground' : 
              dragActive ? 'text-primary' : 'text-muted-foreground'
            }`} />
          </div>
          
          <h3 className={`text-lg sm:text-xl font-semibold mb-2 sm:mb-3 ${
            isUploading ? 'text-muted-foreground' : 'text-foreground'
          }`}>
            {dragActive ? 'Drop your files here!' : 'Drop your PDF files here'}
          </h3>
          
          <p className={`mb-4 sm:mb-6 text-sm sm:text-base ${
            isUploading ? 'text-muted-foreground/70' : 'text-muted-foreground'
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
            disabled={isUploading}
          />
          
          <label 
            htmlFor="file-upload" 
            className={`inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium cursor-pointer transition-all duration-200 text-sm sm:text-base ${
              isUploading 
                ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105'
            }`}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Select PDF Files
              </>
            )}
          </label>
          
          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 lg:space-x-6 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>PDF format only</span>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Target className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Max 100MB per file</span>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Real-time processing</span>
            </div>
          </div>
        </div>
      </Card>

      {queuedFiles.length > 0 && (
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {queuedFiles.length} file{queuedFiles.length > 1 ? 's' : ''} queued
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              Max {MAX_CONCURRENT_UPLOADS} concurrent uploads
            </span>
          </div>
        </Card>
      )}

      {files.length > 0 && (
        <Card className="p-4 border-border bg-card">
          <h2 className="text-lg font-semibold mb-3">Upload Progress</h2>
          <div className="space-y-3">
            {files.map(file => (
              <div key={file.id} className="p-3 rounded-lg bg-background border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3 w-full min-w-0">
                    <div className="flex-shrink-0">
                      {getStatusIcon(file.status)}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-medium truncate text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {getStatusText(file.status, file.processingStage)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-3 flex-shrink-0">
                    <span className="text-sm font-mono text-muted-foreground w-12 text-right">
                      {file.progress.toFixed(0)}%
                    </span>
                    {file.status === 'uploading' || file.status === 'paused' ? (
                      <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => togglePause(file.id)}>
                        {file.status === 'uploading' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                    ) : file.status === 'error' ? (
                      <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => retryUpload(file.id)}>
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    ) : null}
                    <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => removeFile(file.id)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      file.status === 'completed' ? 'bg-green-500' :
                      file.status === 'error' ? 'bg-red-500' :
                      'bg-primary'
                    }`}
                    style={{ width: `${file.progress}%` }}
                  />
                </div>
                {file.status === 'error' && file.error && (
                  <p className="text-xs text-red-500 mt-2">{file.error}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {completedFiles.length > 0 && (
        <Card className="p-4 border-border bg-card">
          <h2 className="text-lg font-semibold mb-3">Completed Documents</h2>
          <div className="space-y-3">
            {completedFiles.map(file => (
              <div key={file.id} className="p-3 rounded-lg bg-background border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground">Ready to use</p>
                    </div>
                  </div>
                  <Button 
                    variant="default"
                    size="sm"
                    onClick={() => router.push(`/dashboard/chats/new?documentId=${file.documentId}`)}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Start Chat
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between">
            <p className="text-sm text-muted-foreground mb-2 sm:mb-0">
              {completedFiles.length} document{completedFiles.length > 1 ? 's' : ''} ready.
            </p>
            <Button 
              variant="outline"
              onClick={() => router.push('/dashboard/documents')}
            >
              <ClipboardList className="w-4 h-4 mr-2" />
              Go to My Documents
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}