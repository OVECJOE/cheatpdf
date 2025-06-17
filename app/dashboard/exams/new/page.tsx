"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  FileText,
  ClipboardList,
  Upload,
  Search,
  Loader2,
  CheckCircle,
  Calendar,
  AlertCircle,
  Clock,
  Target,
  Settings,
  Brain,
  Zap,
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

interface ExamConfig {
  title: string;
  timeLimit: number;
  numQuestions: number;
  difficulty: "easy" | "medium" | "hard" | "mixed";
  questionTypes: string[];
}

export default function NewExamPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const searchParams = useSearchParams();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [creating, setCreating] = useState(false);
  const [currentStep, setCurrentStep] = useState<"document" | "configuration">("document");
  const [examConfig, setExamConfig] = useState<ExamConfig>({
    title: "",
    timeLimit: 30,
    numQuestions: 10,
    difficulty: "medium",
    questionTypes: ["multiple-choice"],
  });

  useEffect(() => {
    if (session?.user) fetchDocuments();
  }, [session]);

  useEffect(() => {
    const documentId = searchParams.get("document");
    if (documentId) {
      setSelectedDocument(documents.find(doc => doc.id === documentId) || null);
      setCurrentStep("configuration");
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
    if (!examConfig.title || examConfig.title === `Exam on ${selectedDocument?.name}`) {
      setExamConfig(prev => ({
        ...prev,
        title: `Exam on ${document.name}`
      }));
    }
  };

  const handleNextStep = () => {
    if (currentStep === "document" && selectedDocument) {
      setCurrentStep("configuration");
    }
  };

  const handleCreateExam = async () => {
    if (!selectedDocument || !examConfig.title.trim()) {
      toast.error("Please select a document and enter an exam title");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          documentId: selectedDocument.id,
          title: examConfig.title.trim(),
          timeLimit: examConfig.timeLimit,
          numQuestions: examConfig.numQuestions,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Exam created successfully!");
        router.push(`/dashboard/exams/${data.exam.id}`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to create exam");
      }
    } catch (error) {
      console.error("Error creating exam:", error);
      toast.error("Failed to create exam");
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "text-green-600 bg-green-100 border-green-200";
      case "medium": return "text-brand-amber bg-amber-100 border-amber-200";
      case "hard": return "text-red-600 bg-red-100 border-red-200";
      case "mixed": return "text-purple-600 bg-purple-100 border-purple-200";
      default: return "text-muted-foreground bg-muted border-border";
    }
  };

  const getEstimatedDuration = () => {
    const baseTime = examConfig.numQuestions * 2; // 2 minutes per question
    const difficultyMultiplier = {
      easy: 0.8,
      medium: 1.0,
      hard: 1.3,
      mixed: 1.1
    }[examConfig.difficulty];
    
    return Math.round(baseTime * difficultyMultiplier);
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
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center justify-between w-full gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Create New Exam</h1>
              <p className="text-sm text-muted-foreground">
                {currentStep === "document" 
                  ? "Select a document to create your exam" 
                  : "Configure your exam settings"
                }
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() => {
                if (currentStep === "configuration") {
                  setCurrentStep("document");
                } else {
                  router.push("/dashboard/exams");
                }
              }}
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <span className="hidden sm:inline">
                {currentStep === "configuration" ? "Back to Document Selection" : "Back to Exams"}
              </span>
              <span className="sm:hidden">Back</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center space-x-2 sm:space-x-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep === "document" ? "bg-primary text-white" : "bg-primary/20 text-primary"
          }`}>
            1
          </div>
          <div className={`w-12 sm:w-16 h-1 ${currentStep === "configuration" ? "bg-primary" : "bg-muted"}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep === "configuration" ? "bg-primary text-white" : "bg-muted text-muted-foreground"
          }`}>
            2
          </div>
        </div>
      </div>

      {currentStep === "document" ? (
        <>
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
                        You need to upload documents before creating exams.
                      </p>
                      <Button 
                        onClick={() => router.push("/dashboard/upload")}
                        className="gradient-brand hover:opacity-90 transition-all duration-300"
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
                              <ClipboardList className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">{document._count.exams}</span>
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

            {/* Document Selection Sidebar */}
            <div className="space-y-4 sm:space-y-6">
              <Card className="p-4 sm:p-6 bg-card border-border lg:sticky lg:top-6">
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Selected Document</h3>
                    
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

                        {!selectedDocument.vectorized && (
                          <div className="p-3 border border-amber-200 rounded-lg bg-amber-50">
                            <div className="flex items-start space-x-2">
                              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                              <div className="text-sm">
                                <p className="text-amber-800 font-medium">Document Processing</p>
                                <p className="text-amber-700">
                                  This document is still being processed. You can create the exam, but it may take a moment before questions are generated.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <div className="flex items-center text-sm">
                            <ClipboardList className="w-4 h-4 text-muted-foreground mr-2 flex-shrink-0" />
                            <span className="text-muted-foreground">
                              Previously used in {selectedDocument._count.exams} exam{selectedDocument._count.exams !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 sm:py-8">
                        <Brain className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">
                          Select a document to create your exam
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Button
                      onClick={handleNextStep}
                      disabled={!selectedDocument}
                      className="w-full gradient-brand hover:opacity-90 transition-all duration-300"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Configure Exam
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => router.push("/dashboard/exams")}
                      className="w-full border-border text-foreground hover:bg-muted transition-all duration-300"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Configuration Form */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <Card className="p-4 sm:p-6 bg-card border-border">
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Exam Configuration</h3>
                    
                    <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Exam Title
                          </label>
                          <Input
                            value={examConfig.title}
                            onChange={(e) => setExamConfig(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Enter exam title..."
                            className="w-full"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Number of Questions
                          </label>
                          <Select
                            value={examConfig.numQuestions.toString()}
                            onValueChange={(value) => setExamConfig(prev => ({ ...prev, numQuestions: parseInt(value) }))}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border">
                              <SelectItem value="5">5 Questions</SelectItem>
                              <SelectItem value="10">10 Questions</SelectItem>
                              <SelectItem value="15">15 Questions</SelectItem>
                              <SelectItem value="20">20 Questions</SelectItem>
                              <SelectItem value="25">25 Questions</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Time Limit (minutes)
                          </label>
                          <Select
                            value={examConfig.timeLimit.toString()}
                            onValueChange={(value) => setExamConfig(prev => ({ ...prev, timeLimit: parseInt(value) }))}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border">
                              <SelectItem value="15">15 minutes</SelectItem>
                              <SelectItem value="30">30 minutes</SelectItem>
                              <SelectItem value="45">45 minutes</SelectItem>
                              <SelectItem value="60">1 hour</SelectItem>
                              <SelectItem value="90">1.5 hours</SelectItem>
                              <SelectItem value="120">2 hours</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Difficulty Level
                          </label>
                          <Select
                            value={examConfig.difficulty}
                            onValueChange={(value: "easy" | "medium" | "hard" | "mixed") => 
                              setExamConfig(prev => ({ ...prev, difficulty: value }))
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border">
                              <SelectItem value="easy">Easy</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="hard">Hard</SelectItem>
                              <SelectItem value="mixed">Mixed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="p-4 border border-border rounded-lg bg-muted/50">
                          <h4 className="font-medium text-foreground mb-2">Question Types</h4>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="multiple-choice"
                                checked={examConfig.questionTypes.includes("multiple-choice")}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setExamConfig(prev => ({
                                      ...prev,
                                      questionTypes: [...prev.questionTypes, "multiple-choice"]
                                    }));
                                  } else {
                                    setExamConfig(prev => ({
                                      ...prev,
                                      questionTypes: prev.questionTypes.filter(t => t !== "multiple-choice")
                                    }));
                                  }
                                }}
                                className="rounded border-border"
                              />
                              <label htmlFor="multiple-choice" className="text-sm text-foreground">
                                Multiple Choice
                              </label>
                            </div>
                            <div className="flex items-center space-x-2 opacity-50">
                              <input
                                type="checkbox"
                                id="true-false"
                                disabled
                                className="rounded border-border"
                              />
                              <label htmlFor="true-false" className="text-sm text-muted-foreground">
                                True/False (Coming Soon)
                              </label>
                            </div>
                            <div className="flex items-center space-x-2 opacity-50">
                              <input
                                type="checkbox"
                                id="short-answer"
                                disabled
                                className="rounded border-border"
                              />
                              <label htmlFor="short-answer" className="text-sm text-muted-foreground">
                                Short Answer (Coming Soon)
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Configuration Summary */}
            <div className="space-y-4 sm:space-y-6">
              <Card className="p-4 sm:p-6 bg-card border-border lg:sticky lg:top-6">
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Exam Summary</h3>
                    
                    <div className="space-y-4">
                      {/* Selected Document */}
                      <div className="p-3 border border-primary/20 rounded-lg bg-primary/5">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {selectedDocument?.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Source Document
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Exam Stats */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 border border-border rounded-lg bg-background">
                          <div className="flex items-center space-x-2">
                            <Target className="w-4 h-4 text-primary flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground">{examConfig.numQuestions}</p>
                              <p className="text-xs text-muted-foreground">Questions</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-3 border border-border rounded-lg bg-background">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground">{examConfig.timeLimit}m</p>
                              <p className="text-xs text-muted-foreground">Time Limit</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Difficulty:</span>
                          <Badge className={getDifficultyColor(examConfig.difficulty)}>
                            {examConfig.difficulty.charAt(0).toUpperCase() + examConfig.difficulty.slice(1)}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Estimated Duration:</span>
                          <span className="text-sm font-medium text-foreground">
                            ~{getEstimatedDuration()} minutes
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button
                      onClick={handleCreateExam}
                      disabled={!examConfig.title.trim() || creating}
                      className="w-full gradient-brand hover:opacity-90 transition-all duration-300"
                    >
                      {creating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          <span className="hidden xs:inline">Creating Exam...</span>
                          <span className="xs:hidden">Creating...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Create Exam
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep("document")}
                      className="w-full border-border text-foreground hover:bg-muted transition-all duration-300"
                    >
                      Back to Document
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 