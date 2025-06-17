"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  X,
  AlertCircle,
  Loader2,
  Play,
  TrendingUp,
  Brain,
  Shield,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  FileText,
  MoreVertical,
  Trash2,
  Eye,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface ExamQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  userAnswer?: string;
  isCorrect?: boolean;
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

export default function ExamDetailPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);

  // Redirect to overview subpage by default
  useEffect(() => {
    if (examId) {
      router.replace(`/dashboard/exams/${examId}/overview`);
    }
  }, [examId, router]);

  // Fetch exam data
  const fetchExam = useCallback(async () => {
    if (!examId || status !== "authenticated") return;

    try {
      const response = await fetch(`/api/exams/${examId}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Exam not found");
          router.push("/dashboard/exams");
          return;
        }
        throw new Error("Failed to fetch exam");
      }

      const examData = await response.json();
      setExam(examData);

      // Set initial time remaining if exam is in progress
      if (examData.status === "IN_PROGRESS" && examData.startedAt) {
        const startTime = new Date(examData.startedAt).getTime();
        const currentTime = new Date().getTime();
        const elapsed = Math.floor((currentTime - startTime) / 1000);
        const remaining = Math.max(0, examData.timeLimit * 60 - elapsed);
        setTimeRemaining(remaining);
      } else if (examData.status === "NOT_STARTED") {
        setTimeRemaining(examData.timeLimit * 60);
      }
    } catch (error) {
      console.error("Error fetching exam:", error);
      toast.error("Failed to load exam");
    } finally {
      setLoading(false);
    }
  }, [examId, status, router]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/sign-in");
      return;
    }

    fetchExam();
  }, [status, fetchExam, router]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleStartExam = async () => {
    if (!exam) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/exams/${examId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });

      if (response.ok) {
        const updatedExam = await response.json();
        setExam(updatedExam);
        setTimeRemaining(updatedExam.timeLimit * 60);
        toast.success("Exam started successfully");
      } else {
        toast.error("Failed to start exam");
      }
    } catch (error) {
      console.error("Error starting exam:", error);
      toast.error("Failed to start exam");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswerQuestion = async (questionId: string, answer: string) => {
    if (!exam) return;

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
      } else {
        toast.error("Failed to save answer");
      }
    } catch (error) {
      console.error("Error answering question:", error);
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
        const updatedExam = await response.json();
        setExam(updatedExam);
        toast.success("Exam completed successfully");
      } else {
        toast.error("Failed to complete exam");
      }
    } catch (error) {
      console.error("Error completing exam:", error);
      toast.error("Failed to complete exam");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExam = async () => {
    if (!exam || !confirm("Are you sure you want to delete this exam? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/exams/${examId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Exam deleted successfully");
        router.push("/dashboard/exams");
      } else {
        toast.error("Failed to delete exam");
      }
    } catch (error) {
      console.error("Error deleting exam:", error);
      toast.error("Failed to delete exam");
    } finally {
      setDeleting(false);
    }
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

  const getStatusBadge = (status: Exam["status"]) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Clock className="w-3 h-3 mr-1" />
            In Progress
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-border text-muted-foreground">
            Not Started
          </Badge>
        );
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return "text-muted-foreground";
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-brand-amber";
    return "text-red-600";
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

  // Pre-exam screen
  if (exam.status === "NOT_STARTED") {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard/exams")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Exams
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{exam.title}</h1>
              <p className="text-muted-foreground">
                Created {formatDistanceToNow(new Date(exam.createdAt))} ago
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border">
              <DropdownMenuItem
                onClick={handleDeleteExam}
                disabled={deleting}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deleting ? "Deleting..." : "Delete Exam"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Card className="p-8 bg-card border-border transition-all duration-300 hover:shadow-lg">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Brain className="w-8 h-8 text-primary" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Ready to Start?</h2>
              <p className="text-muted-foreground">
                Based on: {exam.document.name}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
                <FileText className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">{exam.totalQuestions}</div>
                <div className="text-sm text-muted-foreground">Questions</div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
                <Clock className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">{exam.timeLimit}</div>
                <div className="text-sm text-muted-foreground">Minutes</div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
                <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">Secure</div>
                <div className="text-sm text-muted-foreground">Proctored</div>
              </div>
            </div>

            <div className="bg-muted/50 border border-border rounded-lg p-6 text-left">
              <h3 className="font-semibold text-foreground mb-3">Exam Instructions</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Once started, you cannot pause the exam</li>
                <li>• Avoid switching tabs or leaving the page</li>
                <li>• Answer all questions to the best of your ability</li>
                <li>• Click submit when you're finished</li>
                <li>• Your progress is automatically saved</li>
              </ul>
            </div>

            <Button
              onClick={handleStartExam}
              disabled={submitting}
              className="w-full h-14 text-lg gradient-brand text-white hover:opacity-90 transition-all duration-300"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Starting Exam...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Start Exam
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Exam completed screen
  if (exam.status === "COMPLETED") {
    const correctAnswers = exam.questions.filter(q => q.isCorrect).length;
    const score = exam.score || 0;
    const isPassing = score >= 70;

    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard/exams")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Exams
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{exam.title}</h1>
              <div className="flex items-center space-x-4">
                {getStatusBadge(exam.status)}
                <p className="text-muted-foreground">
                  Completed {formatDistanceToNow(new Date(exam.completedAt!))} ago
                </p>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border">
              <DropdownMenuItem
                onClick={handleDeleteExam}
                disabled={deleting}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deleting ? "Deleting..." : "Delete Exam"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Card className="p-8 bg-card border-border transition-all duration-300 hover:shadow-lg">
          <div className="text-center space-y-6">
            <div className={`w-16 h-16 ${isPassing ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center mx-auto`}>
              {isPassing ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : (
                <X className="w-8 h-8 text-red-600" />
              )}
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {isPassing ? "Congratulations!" : "Exam Complete"}
              </h2>
              <p className="text-muted-foreground">
                {exam.document.name}
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
                <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
                  {score}%
                </div>
                <div className="text-sm text-muted-foreground">Final Score</div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-foreground">
                  {correctAnswers}/{exam.questions.length}
                </div>
                <div className="text-sm text-muted-foreground">Correct</div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-foreground">{exam.timeLimit}</div>
                <div className="text-sm text-muted-foreground">Minutes Allowed</div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-foreground">{tabSwitchCount}</div>
                <div className="text-sm text-muted-foreground">Tab Switches</div>
              </div>
            </div>

            {/* Detailed Results */}
            <div className="bg-muted/50 border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-4">Question Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-2">
                {exam.questions.map((question, index) => (
                  <div
                    key={question.id}
                    className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium ${
                      question.isCorrect
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {index + 1}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => router.push("/dashboard/exams")}
                className="flex-1 gradient-brand text-white hover:opacity-90 transition-all duration-300"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Take Another Exam
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex(0)}
                className="flex-1 border-border text-foreground hover:bg-muted transition-all duration-300"
              >
                <Eye className="w-4 h-4 mr-2" />
                Review Answers
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Active exam interface - simplified for dashboard context
  return (
    <div className="p-6 space-y-6">
      {/* Exam Header */}
      <div className="bg-card border border-border rounded-lg p-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold text-foreground truncate">
              {exam.title}
            </h1>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {currentQuestionIndex + 1} of {exam.questions.length}
            </Badge>
          </div>

          <div className="flex items-center space-x-4">
            {/* Timer */}
            <div className={`flex items-center space-x-2 ${getTimeColor(timeRemaining)}`}>
              <Clock className="w-4 h-4" />
              <span className="font-mono text-lg font-bold">
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

        {/* Tab Switch Warning */}
        {tabSwitchCount > 0 && (
          <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-2">
            <div className="flex items-center space-x-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>
                Warning: {tabSwitchCount} tab switch{tabSwitchCount !== 1 ? "es" : ""} detected
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Question Content */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Question Navigation Sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-4 bg-card border-border sticky top-24">
            <h3 className="font-semibold text-foreground mb-4">Questions</h3>
            <div className="grid grid-cols-5 lg:grid-cols-1 gap-2">
              {exam.questions.map((question, index) => (
                <button
                  key={question.id}
                  onClick={() => navigateToQuestion(index)}
                  className={`p-2 rounded text-sm font-medium transition-all duration-200 ${
                    index === currentQuestionIndex
                      ? "bg-primary text-white"
                      : question.userAnswer
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-border">
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
                    {currentQuestion.userAnswer && (
                      <Badge className="bg-green-100 text-green-800">
                        Answered
                      </Badge>
                    )}
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
  );
} 