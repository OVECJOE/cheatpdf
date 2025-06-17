"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Shield,
  Flag,
} from "lucide-react";
import { toast } from "sonner";

interface ExamQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  userAnswer?: string;
  isCorrect?: boolean;
  flagged?: boolean;
}

interface Exam {
  id: string;
  title: string;
  documentId: string;
  document: { id: string; name: string };
  timeLimit: number;
  totalQuestions: number;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  score?: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  questions: ExamQuestion[];
}

export default function TakeExamPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const examId = params.id as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [autoSaveStatus, setAutoSaveStatus] = useState<"saved" | "saving" | "error">("saved");

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (session?.user && examId) {
      fetchExam();
    }
  }, [session, examId]);

  // Timer effect
  useEffect(() => {
    if (exam?.status === "IN_PROGRESS" && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1;

          // Sound alerts for critical time points
          if (
            soundEnabled &&
            (newTime === 300 || newTime === 60 || newTime === 30)
          ) {
            playTimeAlert();
          }

          if (newTime <= 0) {
            handleCompleteExam();
            return 0;
          }
          return newTime;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [exam, timeRemaining, soundEnabled]);

  // Prevent tab switching during exam
  useEffect(() => {
    if (exam?.status === "IN_PROGRESS") {
      const handleVisibilityChange = () => {
        if (document.hidden) {
          setTabSwitchCount((prev) => prev + 1);
          if (soundEnabled) {
            playWarningSound();
          }
        }
      };

      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = "";
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("beforeunload", handleBeforeUnload);

      return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        window.removeEventListener("beforeunload", handleBeforeUnload);
      };
    }
  }, [exam, soundEnabled]);

  // Fullscreen management
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const fetchExam = async () => {
    try {
      const response = await fetch(`/api/exams/${examId}`);
      if (response.ok) {
        const data = await response.json();
        setExam(data);

        // Set initial time remaining if exam is in progress
        if (data.status === "IN_PROGRESS" && data.startedAt) {
          const startTime = new Date(data.startedAt).getTime();
          const currentTime = new Date().getTime();
          const elapsed = Math.floor((currentTime - startTime) / 1000);
          const remaining = Math.max(0, data.timeLimit * 60 - elapsed);
          setTimeRemaining(remaining);
        } else if (data.status === "COMPLETED") {
          // Redirect to results if exam is completed
          router.push(`/dashboard/exams/${examId}/results`);
          return;
        } else if (data.status === "NOT_STARTED") {
          // Redirect to overview if exam hasn't started
          router.push(`/dashboard/exams/${examId}/overview`);
          return;
        }
      } else {
        toast.error("Failed to load exam");
        router.push("/dashboard/exams");
      }
    } catch (error) {
      console.error("Error fetching exam:", error);
      toast.error("Failed to load exam");
    } finally {
      setLoading(false);
    }
  };

  const playTimeAlert = () => {
    const audio = new Audio(
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+D0u2YUBTGE2vC9dywF"
    );
    audio.play().catch(() => {});
  };

  const playWarningSound = () => {
    const audio = new Audio(
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+D0u2YUBTGEFlMxr2JUcays"
    );
    audio.play().catch(() => {});
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  };

  const handleAnswerQuestion = async (questionId: string, answer: string) => {
    if (!exam) return;

    setAutoSaveStatus("saving");
    
    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    try {
      const response = await fetch(`/api/exams/${examId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "answer",
          questionId,
          answer,
        }),
      });

      if (response.ok) {
        const updatedExam = await response.json();
        setExam(updatedExam);
        setAutoSaveStatus("saved");
        
        // Auto-save feedback
        autoSaveTimeoutRef.current = setTimeout(() => {
          setAutoSaveStatus("saved");
        }, 2000);
      } else {
        setAutoSaveStatus("error");
        toast.error("Failed to save answer");
      }
    } catch (error) {
      console.error("Error answering question:", error);
      setAutoSaveStatus("error");
      toast.error("Failed to save answer");
    }
  };

  const handleCompleteExam = async () => {
    if (!exam) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/exams/${examId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete" }),
      });

      if (response.ok) {
        toast.success("Exam submitted successfully!");
        router.push(`/dashboard/exams/${examId}/results`);
      } else {
        toast.error("Failed to submit exam");
      }
    } catch (error) {
      console.error("Error completing exam:", error);
      toast.error("Failed to submit exam");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFlag = (questionId: string) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimeColor = (seconds: number) => {
    if (seconds <= 60) return "text-red-600";
    if (seconds <= 300) return "text-brand-amber";
    return "text-foreground";
  };

  const navigateToQuestion = (index: number) => {
    if (index >= 0 && index < (exam?.questions.length || 0)) {
      setCurrentQuestionIndex(index);
    }
  };

  const getQuestionStatus = (question: ExamQuestion) => {
    if (question.userAnswer) return "answered";
    if (flaggedQuestions.has(question.id)) return "flagged";
    return "unanswered";
  };

  const getAnsweredCount = () => {
    if (!exam) return 0;
    return exam.questions.filter(q => q.userAnswer).length;
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

  if (!exam) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center bg-card border-border">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Exam Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The exam you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button 
            onClick={() => router.push("/dashboard/exams")} 
            className="gradient-brand text-white hover:opacity-90 transition-all duration-300"
          >
            Back to Exams
          </Button>
        </Card>
      </div>
    );
  }

  const currentQuestion = exam.questions[currentQuestionIndex];
  const progressPercentage = exam.questions.length > 0 
    ? ((currentQuestionIndex + 1) / exam.questions.length) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Exam Header - Sticky */}
      <div className="bg-card border-b border-border p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/dashboard/exams/${examId}/overview`)}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Overview
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-foreground">{exam.title}</h1>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>Question {currentQuestionIndex + 1} of {exam.questions.length}</span>
                  <span>•</span>
                  <span>{getAnsweredCount()} answered</span>
                  <span>•</span>
                  <span>{flaggedQuestions.size} flagged</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Auto-save Status */}
              <div className="flex items-center space-x-2">
                {autoSaveStatus === "saving" && (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-brand-amber" />
                    <span className="text-xs text-brand-amber">Saving...</span>
                  </>
                )}
                {autoSaveStatus === "saved" && (
                  <>
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span className="text-xs text-green-600">Saved</span>
                  </>
                )}
                {autoSaveStatus === "error" && (
                  <>
                    <AlertCircle className="w-3 h-3 text-red-600" />
                    <span className="text-xs text-red-600">Error</span>
                  </>
                )}
              </div>

              {/* Timer */}
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg border ${
                timeRemaining <= 60 ? "bg-red-50 border-red-200" :
                timeRemaining <= 300 ? "bg-amber-50 border-amber-200" :
                "bg-card border-border"
              }`}>
                <Clock className={`w-4 h-4 ${getTimeColor(timeRemaining)}`} />
                <span className={`font-mono text-lg font-bold ${getTimeColor(timeRemaining)}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4" />
                  ) : (
                    <VolumeX className="w-4 h-4" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {isFullscreen ? (
                    <Minimize className="w-4 h-4" />
                  ) : (
                    <Maximize className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <Progress value={progressPercentage} className="w-full h-2" />
          </div>

          {/* Warnings */}
          {tabSwitchCount > 0 && (
            <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-2">
              <div className="flex items-center space-x-2 text-red-700 text-sm">
                <Shield className="w-4 h-4" />
                <span>
                  Warning: {tabSwitchCount} tab switch{tabSwitchCount !== 1 ? "es" : ""} detected
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Question Navigation Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-4 bg-card border-border sticky top-24">
              <h3 className="font-semibold text-foreground mb-4">Questions</h3>
              <div className="grid grid-cols-5 lg:grid-cols-1 gap-2 mb-6">
                {exam.questions.map((question, index) => {
                  const status = getQuestionStatus(question);
                  return (
                    <button
                      key={question.id}
                      onClick={() => navigateToQuestion(index)}
                      className={`p-2 rounded text-sm font-medium transition-all duration-200 relative ${
                        index === currentQuestionIndex
                          ? "bg-primary text-white"
                          : status === "answered"
                          ? "bg-green-100 text-green-800 border border-green-200"
                          : status === "flagged"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {index + 1}
                      {flaggedQuestions.has(question.id) && (
                        <Flag className="w-2 h-2 absolute -top-1 -right-1 text-amber-600" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-3">
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Answered:</span>
                    <span className="font-medium">{getAnsweredCount()}/{exam.questions.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Flagged:</span>
                    <span className="font-medium">{flaggedQuestions.size}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Remaining:</span>
                    <span className="font-medium">{exam.questions.length - getAnsweredCount()}</span>
                  </div>
                </div>

                <Button
                  onClick={handleCompleteExam}
                  disabled={submitting}
                  className="w-full gradient-brand text-white hover:opacity-90 transition-all duration-300"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Submit Exam
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>

          {/* Main Question */}
          <div className="lg:col-span-3">
            <Card className="p-6 bg-card border-border">
              {currentQuestion && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="outline" className="border-primary/30 text-primary">
                        Question {currentQuestionIndex + 1}
                      </Badge>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFlag(currentQuestion.id)}
                          className={`${
                            flaggedQuestions.has(currentQuestion.id)
                              ? "text-amber-600 hover:text-amber-700"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Flag className="w-4 h-4 mr-1" />
                          {flaggedQuestions.has(currentQuestion.id) ? "Flagged" : "Flag"}
                        </Button>
                        {currentQuestion.userAnswer && (
                          <Badge className="bg-green-100 text-green-800">
                            Answered
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <h2 className="text-xl font-semibold text-foreground leading-relaxed">
                      {currentQuestion.question}
                    </h2>
                  </div>

                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => {
                      const optionLetter = String.fromCharCode(65 + index);
                      const isSelected = currentQuestion.userAnswer === optionLetter;
                      
                      return (
                        <button
                          key={index}
                          onClick={() => handleAnswerQuestion(currentQuestion.id, optionLetter)}
                          className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                            isSelected
                              ? "border-primary bg-primary/5 text-foreground"
                              : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-primary/5"
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-bold ${
                              isSelected 
                                ? "border-primary bg-primary text-white" 
                                : "border-muted-foreground text-muted-foreground"
                            }`}>
                              {optionLetter}
                            </div>
                            <span className="flex-1">{option}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-6">
                    <Button
                      variant="outline"
                      onClick={() => navigateToQuestion(currentQuestionIndex - 1)}
                      disabled={currentQuestionIndex === 0}
                      className="border-border text-foreground hover:bg-muted transition-all duration-300"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Previous
                    </Button>

                    <Button
                      onClick={() => navigateToQuestion(currentQuestionIndex + 1)}
                      disabled={currentQuestionIndex === exam.questions.length - 1}
                      className="gradient-brand text-white hover:opacity-90 transition-all duration-300"
                    >
                      Next
                      <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 