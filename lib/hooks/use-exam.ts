"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
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

interface UseExamProps {
  examId: string;
  onError?: (error: string) => void;
}

export function useExam({ examId, onError }: UseExamProps) {
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [autoSaveStatus, setAutoSaveStatus] = useState<"saved" | "saving" | "error">("saved");
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch exam data
  const fetchExam = useCallback(async () => {
    try {
      const response = await fetch(`/api/exams/${examId}?action=taking`);
      if (response.ok) {
        const data = await response.json();
        setExam(data.exam);

        // Set initial time remaining if exam is in progress
        if (data.exam.status === "IN_PROGRESS" && data.exam.startedAt) {
          const startTime = new Date(data.exam.startedAt).getTime();
          const currentTime = new Date().getTime();
          const elapsed = Math.floor((currentTime - startTime) / 1000);
          const remaining = Math.max(0, data.exam.timeLimit * 60 - elapsed);
          setTimeRemaining(remaining);
        } else if (data.exam.status === "COMPLETED") {
          router.push(`/dashboard/exams/${examId}/overview`);
          return;
        } else if (data.exam.status === "NOT_STARTED") {
          router.push(`/dashboard/exams/${examId}/overview`);
          return;
        }
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || "Failed to load exam";
        toast.error(errorMessage);
        onError?.(errorMessage);
        router.push("/dashboard/exams");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load exam";
      toast.error(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [examId, router, onError]);

  useEffect(() => {
    fetchExam();
  }, []);

  // Handle time updates
  const handleTimeUpdate = useCallback((newTime: number) => {
    setTimeRemaining(newTime);
  }, []);

  // Handle time expiration
  const handleTimeExpired = useCallback(async () => {
    setTimeRemaining(0);
    await handleCompleteExam();
  }, []);

  // Handle tab switching
  const handleTabSwitch = useCallback(() => {
    setTabSwitchCount(prev => prev + 1);
  }, []);

  // Handle warnings
  const handleWarning = useCallback(() => {
    toast.warning("Proctoring violation detected", {
      description: "You have been detected cheating. Please stop and wait for the exam to end.",
    });
  }, []);


  // Toggle sound
  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => !prev);
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  }, []);

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Submit answer
  const submitAnswer = useCallback(async (questionId: string, answer: string) => {
    if (!exam) return;

    setAutoSaveStatus("saving");    
    // Optimistically update the answer in local state
    setExam(prevExam => {
      if (!prevExam) return prevExam;
      return {
        ...prevExam,
        questions: prevExam.questions.map(q => 
          q.id === questionId 
            ? { ...q, userAnswer: answer }
            : q
        )
      };
    });
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
        const result = await response.json();
        // Update the exam state with the new answer and isCorrect from server
        setExam(prevExam => {
          if (!prevExam) return prevExam;
          return {
            ...prevExam,
            questions: prevExam.questions.map(q => 
              q.id === questionId 
                ? { ...q, userAnswer: answer, isCorrect: result.result.isCorrect }
                : q
            )
          };
        });
        setAutoSaveStatus("saved");
        
        // Auto-save feedback
        autoSaveTimeoutRef.current = setTimeout(() => {
          setAutoSaveStatus("saved");
        }, 2000);
      } else {
        const errorData = await response.json();
        setAutoSaveStatus("error");
        // Revert optimistic update on error
        setExam(prevExam => {
          if (!prevExam) return prevExam;
          return {
            ...prevExam,
            questions: prevExam.questions.map(q => 
              q.id === questionId 
                ? { ...q, userAnswer: undefined }
                : q
            )
          };
        });
        toast.error(errorData.error || "Failed to save answer");
      }
    } catch (error) {
      console.error("Error answering question:", error);
      setAutoSaveStatus("error");
      // Revert optimistic update on error
      setExam(prevExam => {
        if (!prevExam) return prevExam;
        return {
          ...prevExam,
          questions: prevExam.questions.map(q => 
            q.id === questionId 
              ? { ...q, userAnswer: undefined }
              : q
          )
        };
      });
      toast.error("Failed to save answer");
    }
  }, [examId, exam]);

  // Toggle flag
  const toggleFlag = useCallback((questionId: string) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  }, []);

  // Navigate to question
  const navigateToQuestion = useCallback((index: number) => {
    if (index >= 0 && index < (exam?.questions.length || 0)) {
      setCurrentQuestionIndex(index);
    }
  }, [exam]);

  // Complete exam
  const handleCompleteExam = useCallback(async () => {
    console.log(exam);
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
        router.push(`/dashboard/exams/${examId}/overview`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to submit exam");
      }
    } catch (error) {
      console.error("Error completing exam:", error);
      toast.error("Failed to submit exam");
    } finally {
      setSubmitting(false);
    }
  }, [examId]);

  // Utility functions
  const getAnsweredCount = useCallback(() => {
    if (!exam) return 0;
    return exam.questions.filter(q => q.userAnswer).length;
  }, [exam]);

  const getQuestionStatus = useCallback((question: ExamQuestion) => {
    if (question.userAnswer) return "answered";
    if (flaggedQuestions.has(question.id)) return "flagged";
    return "unanswered";
  }, [flaggedQuestions]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const getTimeColor = useCallback((seconds: number) => {
    if (seconds <= 60) return "text-red-600";
    if (seconds <= 300) return "text-brand-amber";
    return "text-foreground";
  }, []);

  const getProgressPercentage = useCallback(() => {
    if (!exam || exam.questions.length === 0) return 0;
    return ((currentQuestionIndex + 1) / exam.questions.length) * 100;
  }, [exam, currentQuestionIndex]);

  const getCurrentQuestion = useCallback(() => {
    if (!exam || exam.questions.length === 0) return null;
    return exam.questions[currentQuestionIndex];
  }, [exam, currentQuestionIndex]);

  const canGoNext = useCallback(() => {
    return currentQuestionIndex < (exam?.questions.length || 0) - 1;
  }, [currentQuestionIndex, exam]);

  const canGoPrevious = useCallback(() => {
    return currentQuestionIndex > 0;
  }, [currentQuestionIndex]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  return {
    exam,
    loading,
    submitting,
    timeRemaining,
    currentQuestionIndex,
    flaggedQuestions,
    autoSaveStatus,
    tabSwitchCount,
    soundEnabled,
    isFullscreen,
    fetchExam,
    handleTimeUpdate,
    handleTimeExpired,
    handleTabSwitch,
    handleWarning,
    toggleSound,
    toggleFullscreen,
    submitAnswer,
    toggleFlag,
    navigateToQuestion,
    handleCompleteExam,
    getAnsweredCount,
    getQuestionStatus,
    formatTime,
    getTimeColor,
    getProgressPercentage,
    getCurrentQuestion,
    canGoNext,
    canGoPrevious,
  };
} 