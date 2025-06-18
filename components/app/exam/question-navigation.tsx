"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Flag } from "lucide-react";

interface QuestionNavigationProps {
  questions: Array<{
    id: string;
    userAnswer?: string;
    flagged?: boolean;
  }>;
  currentQuestionIndex: number;
  onQuestionSelect: (index: number) => void;
  onSubmitExam: () => void;
  isSubmitting: boolean;
}

export function QuestionNavigation({
  questions,
  currentQuestionIndex,
  onQuestionSelect,
  onSubmitExam,
  isSubmitting,
}: QuestionNavigationProps) {
  const answeredCount = questions.filter(q => q.userAnswer).length;
  const flaggedCount = questions.filter(q => q.flagged).length;

  const getQuestionStatus = (question: { userAnswer?: string; flagged?: boolean }) => {
    if (question.userAnswer) return "answered";
    if (question.flagged) return "flagged";
    return "unanswered";
  };

  return (
    <Card className="p-4 bg-card border-border sticky top-24">
      <h3 className="font-semibold text-foreground mb-4">Questions</h3>
      
      {/* Question Grid */}
      <div className="grid grid-cols-5 lg:grid-cols-2 gap-2 mb-6">
        {questions.map((question, index) => {
          const status = getQuestionStatus(question);
          const isCurrent = index === currentQuestionIndex;
          
          return (
            <button
              key={question.id}
              onClick={() => onQuestionSelect(index)}
              className={`p-2 rounded text-sm font-medium transition-all duration-200 relative ${
                isCurrent
                  ? "bg-primary text-white shadow-md"
                  : status === "answered"
                  ? "bg-green-100 text-green-800 border border-green-200 hover:bg-green-200"
                  : status === "flagged"
                  ? "bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 border border-transparent"
              }`}
            >
              {index + 1}
              {question.flagged && (
                <Flag className="w-2 h-2 absolute -top-1 -right-1 text-amber-600" />
              )}
              {question.userAnswer && !isCurrent && (
                <CheckCircle className="w-2 h-2 absolute -bottom-1 -right-1 text-green-600" />
              )}
            </button>
          );
        })}
      </div>

      {/* Progress Summary */}
      <div className="space-y-3 mb-6">
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center justify-between">
            <span>Answered:</span>
            <span className="font-medium">{answeredCount}/{questions.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Flagged:</span>
            <span className="font-medium">{flaggedCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Remaining:</span>
            <span className="font-medium">{questions.length - answeredCount}</span>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        onClick={onSubmitExam}
        disabled={isSubmitting}
        className="w-full gradient-brand hover:opacity-90 transition-all duration-300"
      >
        {isSubmitting ? (
          <>
            <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Submitting...
          </>
        ) : (
          <>
            <CheckCircle className="w-4 h-4 mr-2" />
            Submit Exam
          </>
        )}
      </Button>
    </Card>
  );
} 