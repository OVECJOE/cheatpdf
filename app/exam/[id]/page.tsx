"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  X,
  AlertCircle,
  Loader2,
  Play,
  RotateCcw,
  TrendingUp,
  Brain,
  Shield,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  FileText,
} from "lucide-react";
import { ExamStatus } from "@prisma/client";

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
  status: ExamStatus;
  score?: number;
  startedAt?: string;
  completedAt?: string;
  questions: ExamQuestion[];
}

export default function ExamPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showExitWarning, setShowExitWarning] = useState(false);

  // Fetch exam data
  const fetchExam = useCallback(async () => {
    if (!examId || status !== "authenticated") return;

    try {
      const response = await fetch(`/api/exams/${examId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch exam");
      }

      const examData = await response.json();
      setExam(examData);

      // Set initial time remaining if exam is in progress
      if (examData.status === ExamStatus.IN_PROGRESS && examData.startedAt) {
        const startTime = new Date(examData.startedAt).getTime();
        const currentTime = new Date().getTime();
        const elapsed = Math.floor((currentTime - startTime) / 1000);
        const remaining = Math.max(0, examData.timeLimit * 60 - elapsed);
        setTimeRemaining(remaining);
      } else if (examData.status === ExamStatus.NOT_STARTED) {
        setTimeRemaining(examData.timeLimit * 60);
      }
    } catch (error) {
      console.error("Error fetching exam:", error);
      router.push("/exam");
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
    if (exam?.status === ExamStatus.IN_PROGRESS && timeRemaining > 0) {
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
    if (exam?.status === ExamStatus.IN_PROGRESS) {
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
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
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
      console.error("Fullscreen toggle failed:", error);
    }
  };

  const handleStartExam = async () => {
    if (!exam) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/exams/${examId}/start`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to start exam");
      }

      await fetchExam(); // Refresh exam data
    } catch (error) {
      console.error("Error starting exam:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerQuestion = async (questionId: string, answer: string) => {
    if (!exam || exam.status !== ExamStatus.IN_PROGRESS) return;

    try {
      const response = await fetch(`/api/exams/${examId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, answer }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit answer");
      }

      // Update local state
      setExam((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          questions: prev.questions.map((q) =>
            q.id === questionId ? { ...q, userAnswer: answer } : q
          ),
        };
      });
    } catch (error) {
      console.error("Error submitting answer:", error);
    }
  };

  const handleCompleteExam = async () => {
    if (!exam || submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/exams/${examId}/complete`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to complete exam");
      }

      await fetchExam(); // Refresh to get results

      // Exit fullscreen
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (error) {
      console.error("Error completing exam:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getTimeColor = (seconds: number) => {
    if (seconds < 300) return "text-red-600 bg-red-100";
    if (seconds < 600) return "text-amber-600 bg-amber-100";
    return "text-blue-600 bg-blue-100";
  };

  const navigateToQuestion = (index: number) => {
    if (!exam) return;
    setCurrentQuestionIndex(
      Math.max(0, Math.min(index, exam.questions.length - 1))
    );
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
          <span>Loading exam...</span>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Exam not found
          </h2>
          <p className="text-gray-600 mb-4">
            The exam you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button onClick={() => router.push("/exam")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Exams
          </Button>
        </div>
      </div>
    );
  }

  // Show results if exam is completed
  if (exam.status === ExamStatus.COMPLETED) {
    return (
      <div className="min-h-screen bg-amber-50">
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/exam")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Exams
            </Button>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Results Header */}
            <Card className="p-6 sm:p-8 mb-8">
              <div className="text-center">
                <div
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    (exam.score || 0) >= 80
                      ? "bg-green-100"
                      : (exam.score || 0) >= 60
                        ? "bg-amber-100"
                        : "bg-red-100"
                  }`}
                >
                  <span
                    className={`text-2xl sm:text-3xl font-bold ${
                      (exam.score || 0) >= 80
                        ? "text-green-600"
                        : (exam.score || 0) >= 60
                          ? "text-amber-600"
                          : "text-red-600"
                    }`}
                  >
                    {Math.round(exam.score || 0)}%
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  {(exam.score || 0) >= 80
                    ? "Excellent!"
                    : (exam.score || 0) >= 60
                      ? "Good Job!"
                      : "Keep Studying!"}
                </h1>

                <p className="text-gray-600 mb-6">{exam.title}</p>

                <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-8 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>{exam.document.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>Score: {Math.round(exam.score || 0)}%</span>
                  </div>
                  {tabSwitchCount > 0 && (
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span className="text-amber-600">
                        Tab switches: {tabSwitchCount}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Question Review */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Question Review
              </h2>

              {exam.questions.map((question, index) => {
                const isCorrect = question.isCorrect;
                const wasAnswered = question.userAnswer !== undefined;

                return (
                  <Card key={question.id} className="p-4 sm:p-6">
                    <div className="flex items-start space-x-4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isCorrect
                            ? "bg-green-100"
                            : wasAnswered
                              ? "bg-red-100"
                              : "bg-gray-100"
                        }`}
                      >
                        {isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : wasAnswered ? (
                          <X className="w-5 h-5 text-red-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-gray-600" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-4 text-sm sm:text-base">
                          {index + 1}. {question.question}
                        </h3>

                        <div className="space-y-2 mb-4">
                          {question.options.map((option, optionIndex) => {
                            const optionLetter = String.fromCharCode(
                              65 + optionIndex
                            );
                            const isCorrectOption =
                              optionLetter === question.correctAnswer;
                            const isUserAnswer =
                              optionLetter === question.userAnswer;

                            return (
                              <div
                                key={optionIndex}
                                className={`p-3 rounded-lg border text-sm ${
                                  isCorrectOption
                                    ? "bg-green-50 border-green-200"
                                    : isUserAnswer && !isCorrect
                                      ? "bg-red-50 border-red-200"
                                      : "bg-gray-50 border-gray-200"
                                }`}
                              >
                                <div className="flex items-start space-x-3">
                                  <span className="font-medium flex-shrink-0">
                                    {optionLetter}.
                                  </span>
                                  <span className="flex-1">{option}</span>

                                  <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
                                    {isCorrectOption && (
                                      <Badge className="bg-green-600 text-xs">
                                        Correct
                                      </Badge>
                                    )}

                                    {isUserAnswer && !isCorrect && (
                                      <Badge
                                        variant="destructive"
                                        className="text-xs"
                                      >
                                        Your Answer
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {(!isCorrect || !wasAnswered) &&
                          question.explanation && (
                            <div className="p-4 bg-blue-50 rounded-lg">
                              <div className="flex items-start space-x-2">
                                <Brain className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <h4 className="font-medium text-blue-900 mb-1">
                                    Explanation
                                  </h4>
                                  <p className="text-blue-800 text-sm">
                                    {question.explanation}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 mt-8">
              <Button
                onClick={() => router.push("/exam")}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Back to Exams
              </Button>
              <Button
                onClick={() => router.push(`/exam/${examId}/retake`)}
                className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retake Exam
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show exam start screen
  if (exam.status === "NOT_STARTED") {
    return (
      <div className="min-h-screen bg-amber-50">
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/exam")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Exams
            </Button>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-8 h-8 text-amber-600" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {exam.title}
            </h1>
            <p className="text-gray-600 mb-8">Document: {exam.document.name}</p>

            <Card className="p-6 mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-amber-600">
                    {exam.totalQuestions}
                  </div>
                  <div className="text-sm text-gray-600">Questions</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-600">
                    {exam.timeLimit}
                  </div>
                  <div className="text-sm text-gray-600">Minutes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-600">
                    {Math.round((exam.totalQuestions / exam.timeLimit) * 10) /
                      10}
                  </div>
                  <div className="text-sm text-gray-600">Questions/Min</div>
                </div>
              </div>
            </Card>

            <div className="space-y-4">
              <div className="text-left bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Exam Rules:
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>
                    • You have {exam.timeLimit} minutes to complete the exam
                  </li>
                  <li>• Once started, the timer cannot be paused</li>
                  <li>• Switching tabs or windows will be tracked</li>
                  <li>• You can navigate between questions freely</li>
                  <li>• Submit early or let the timer run out to finish</li>
                </ul>
              </div>

              <Button
                onClick={handleStartExam}
                disabled={loading}
                className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white px-8 py-3"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Start Exam
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show exam in progress
  const currentQuestion = exam.questions[currentQuestionIndex];
  const answeredCount = exam.questions.filter(
    (q) => q.userAnswer !== undefined
  ).length;
  const isLastQuestion = currentQuestionIndex === exam.questions.length - 1;
  const progress = (answeredCount / exam.totalQuestions) * 100;

  return (
    <div
      className={`min-h-screen ${isFullscreen ? "bg-white" : "bg-amber-50"}`}
    >
      {/* Timer Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
              <h1 className="text-sm sm:text-lg font-semibold text-gray-900 truncate">
                {exam.title}
              </h1>
              <Badge variant="outline" className="text-xs">
                {currentQuestionIndex + 1}/{exam.totalQuestions}
              </Badge>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Mobile controls */}
              <div className="flex items-center space-x-1 sm:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-2"
                >
                  {soundEnabled ? (
                    <Volume2 className="w-3 h-3" />
                  ) : (
                    <VolumeX className="w-3 h-3" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="p-2"
                >
                  {isFullscreen ? (
                    <Minimize className="w-3 h-3" />
                  ) : (
                    <Maximize className="w-3 h-3" />
                  )}
                </Button>
              </div>

              {/* Desktop controls */}
              <div className="hidden sm:flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  title={
                    soundEnabled
                      ? "Disable sound alerts"
                      : "Enable sound alerts"
                  }
                >
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4" />
                  ) : (
                    <VolumeX className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleFullscreen}
                  title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  {isFullscreen ? (
                    <Minimize className="w-4 h-4" />
                  ) : (
                    <Maximize className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <div
                className={`flex items-center space-x-2 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-mono ${getTimeColor(timeRemaining)}`}
              >
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{formatTime(timeRemaining)}</span>
              </div>

              <Button
                onClick={handleCompleteExam}
                disabled={submitting}
                variant={
                  answeredCount === exam.totalQuestions ? "default" : "outline"
                }
                size="sm"
                className="text-xs sm:text-sm"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>
                {answeredCount} of {exam.totalQuestions} answered
              </span>
              <span>{Math.round(progress)}% complete</span>
            </div>
          </div>

          {/* Warning indicators */}
          {tabSwitchCount > 0 && (
            <div className="mt-2 p-2 bg-amber-100 border border-amber-200 rounded-lg">
              <div className="flex items-center space-x-2 text-xs text-amber-800">
                <Shield className="w-4 h-4" />
                <span>
                  Tab switch detected ({tabSwitchCount} times) - This may affect
                  your exam validity
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto">
          {currentQuestion && (
            <Card className="p-4 sm:p-8">
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 leading-relaxed">
                    {currentQuestion.question}
                  </h2>
                </div>

                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => {
                    const optionLetter = String.fromCharCode(65 + index);
                    const isSelected =
                      currentQuestion.userAnswer === optionLetter;

                    return (
                      <button
                        key={index}
                        onClick={() =>
                          handleAnswerQuestion(currentQuestion.id, optionLetter)
                        }
                        className={`w-full p-3 sm:p-4 text-left rounded-lg border-2 transition-colors ${
                          isSelected
                            ? "border-amber-600 bg-amber-50"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div
                            className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              isSelected
                                ? "border-amber-600 bg-amber-600"
                                : "border-gray-300"
                            }`}
                          >
                            {isSelected && (
                              <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                          </div>
                          <span className="font-medium flex-shrink-0">
                            {optionLetter}.
                          </span>
                          <span className="text-sm sm:text-base leading-relaxed">
                            {option}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Navigation */}
                <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t space-y-4 sm:space-y-0">
                  <Button
                    variant="outline"
                    onClick={() => navigateToQuestion(currentQuestionIndex - 1)}
                    disabled={currentQuestionIndex === 0}
                    className="w-full sm:w-auto"
                  >
                    Previous
                  </Button>

                  <div className="text-sm text-gray-600 order-first sm:order-none">
                    Question {currentQuestionIndex + 1} of {exam.totalQuestions}
                  </div>

                  <Button
                    onClick={() => navigateToQuestion(currentQuestionIndex + 1)}
                    disabled={isLastQuestion}
                    className="w-full sm:w-auto"
                  >
                    {isLastQuestion ? "Last Question" : "Next"}
                  </Button>
                </div>

                {/* Quick Navigation */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">
                      Quick Navigation
                    </span>
                    <span className="text-xs text-gray-500">
                      Click any question to jump to it
                    </span>
                  </div>

                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                    {exam.questions.map((q, index) => {
                      const isAnswered = q.userAnswer !== undefined;
                      const isCurrent = index === currentQuestionIndex;

                      return (
                        <button
                          key={q.id}
                          onClick={() => navigateToQuestion(index)}
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                            isCurrent
                              ? "bg-amber-600 text-white"
                              : isAnswered
                                ? "bg-green-100 text-green-700 border border-green-200"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                          title={`Question ${index + 1}${isAnswered ? " (Answered)" : ""}`}
                        >
                          {index + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Floating Action Panel for Mobile */}
          <div className="fixed bottom-4 right-4 sm:hidden">
            <div className="flex flex-col space-y-2">
              {/* Submit Button */}
              <Button
                onClick={handleCompleteExam}
                disabled={submitting}
                size="sm"
                className={`shadow-lg ${
                  answeredCount === exam.totalQuestions
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
              </Button>

              {/* Progress Indicator */}
              <div className="bg-white rounded-full p-2 shadow-lg">
                <div className="text-xs font-medium text-gray-700">
                  {answeredCount}/{exam.totalQuestions}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exit Warning Modal */}
      {showExitWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Are you sure you want to leave?
              </h3>
              <p className="text-gray-600 mb-6">
                Your exam progress will be lost if you leave now. The timer will
                continue running.
              </p>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowExitWarning(false)}
                  className="flex-1"
                >
                  Stay
                </Button>
                <Button
                  onClick={() => router.push("/exam")}
                  variant="destructive"
                  className="flex-1"
                >
                  Leave Exam
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
