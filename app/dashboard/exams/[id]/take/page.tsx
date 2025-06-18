"use client";

import { useParams, useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExamHeader } from "@/components/app/exam/exam-header";
import { QuestionNavigation } from "@/components/app/exam/question-navigation";
import { QuestionDisplay } from "@/components/app/exam/question-display";
import { ExamProctor } from "@/components/app/exam/exam-proctor";
import { ExamTimer } from "@/components/app/exam/exam-timer";
import { useExam } from "@/lib/hooks/use-exam";
import { useExamTimer } from "@/lib/hooks/use-exam-timer";
import { useEffect } from "react";
import { toast } from "sonner";

export default function TakeExamPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;

  const {
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
    formatTime,
    getCurrentQuestion,
    canGoNext,
    canGoPrevious,
  } = useExam({
    examId,
    onError: (error) => {
      toast.error(error);
      router.push("/dashboard/exams");
    },
  });

  const startedAt = exam?.startedAt || "";
  const timeLimit = exam?.timeLimit || 0;
  const timeLeft = useExamTimer(examId, startedAt, timeLimit);

  useEffect(() => {
    if (timeLeft === 0 && exam) {
      toast.error("Time is up! Submitting your exam.");
      handleCompleteExam();
    }
  }, [timeLeft, exam]);

  const handleTimeAlert = () => {
    toast.warning("Time is running out", {
      description: `You have ${formatTime(timeRemaining)} left to complete the exam.`,
    });
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
            className="gradient-brand hover:opacity-90 transition-all duration-300"
          >
            Back to Exams
          </Button>
        </Card>
      </div>
    );
  }

  const currentQuestion = getCurrentQuestion();

  // Prepare questions for navigation component
  const navigationQuestions = exam.questions.map(q => ({
    id: q.id,
    userAnswer: q.userAnswer,
    flagged: flaggedQuestions.has(q.id),
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Proctoring Components */}
      <ExamProctor
        isActive={exam.status === "IN_PROGRESS"}
        soundEnabled={soundEnabled}
        onTabSwitch={handleTabSwitch}
        onTimeAlert={handleTimeAlert}
        onWarning={handleWarning}
      />

      <ExamTimer
        timeRemaining={timeRemaining}
        timeLimit={exam.timeLimit}
        isActive={exam.status === "IN_PROGRESS"}
        soundEnabled={soundEnabled}
        onTimeUpdate={handleTimeUpdate}
        onTimeExpired={handleTimeExpired}
      />

      {/* Exam Header */}
      <ExamHeader
        title={exam.title}
        currentQuestion={currentQuestionIndex + 1}
        totalQuestions={exam.questions.length}
        timeRemaining={timeRemaining}
        timeLimit={exam.timeLimit}
        soundEnabled={soundEnabled}
        isFullscreen={isFullscreen}
        tabSwitchCount={tabSwitchCount}
        autoSaveStatus={autoSaveStatus}
        onSoundToggle={toggleSound}
        onFullscreenToggle={toggleFullscreen}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Question Navigation Sidebar */}
          <div className="lg:col-span-1">
            <QuestionNavigation
              questions={navigationQuestions}
              currentQuestionIndex={currentQuestionIndex}
              onQuestionSelect={navigateToQuestion}
              onSubmitExam={handleCompleteExam}
              isSubmitting={submitting}
            />
          </div>

          {/* Main Question */}
          <div className="lg:col-span-3">
            {currentQuestion && (
              <QuestionDisplay
                question={currentQuestion}
                questionNumber={currentQuestionIndex + 1}
                flagged={flaggedQuestions.has(currentQuestion.id)}
                onAnswerSelect={(answer) => submitAnswer(currentQuestion.id, answer)}
                onFlagToggle={() => toggleFlag(currentQuestion.id)}
                onPrevious={() => navigateToQuestion(currentQuestionIndex - 1)}
                onNext={() => navigateToQuestion(currentQuestionIndex + 1)}
                canGoPrevious={canGoPrevious()}
                canGoNext={canGoNext()}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 