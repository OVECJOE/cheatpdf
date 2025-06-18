"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flag, ArrowLeft } from "lucide-react";

interface QuestionDisplayProps {
  question: {
    id: string;
    question: string;
    options: string[];
    userAnswer?: string;
  };
  questionNumber: number;
  flagged: boolean;
  onAnswerSelect: (answer: string) => void;
  onFlagToggle: () => void;
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
}

export function QuestionDisplay({
  question,
  questionNumber,
  flagged,
  onAnswerSelect,
  onFlagToggle,
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
}: QuestionDisplayProps) {
  return (
    <Card className="p-6 bg-card border-border">
      <div className="space-y-6">
        {/* Question Header */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <Badge variant="outline" className="border-primary/30 text-primary">
              Question {questionNumber}
            </Badge>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onFlagToggle}
                className={`${
                  flagged
                    ? "text-amber-600 hover:text-amber-700"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Flag className="w-4 h-4 mr-1" />
                {flagged ? "Flagged" : "Flag"}
              </Button>
              {question.userAnswer && (
                <Badge className="bg-green-100 text-green-800">
                  Answered
                </Badge>
              )}
            </div>
          </div>
          
          <h2 className="text-xl font-semibold text-foreground leading-relaxed">
            {question.question}
          </h2>
        </div>

        {/* Answer Options */}
        <div className="space-y-3">
          {question.options.map((option, index) => {
            const optionLetter = String.fromCharCode(65 + index);
            const isSelected = question.userAnswer === option;
            
            return (
              <button
                key={index}
                onClick={() => onAnswerSelect(optionLetter)}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                  isSelected
                    ? "border-primary bg-primary/5 text-foreground shadow-sm"
                    : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    isSelected 
                      ? "border-primary bg-primary text-white" 
                      : "border-muted-foreground text-muted-foreground"
                  }`}>
                    {optionLetter}
                  </div>
                  <span className="flex-1 leading-relaxed">{option}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t border-border">
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={!canGoPrevious}
            className="border-border text-foreground hover:bg-muted transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <Button
            onClick={onNext}
            disabled={!canGoNext}
            className="gradient-brand hover:opacity-90 transition-all duration-300"
          >
            Next
            <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
          </Button>
        </div>
      </div>
    </Card>
  );
} 