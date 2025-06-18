"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  AlertCircle,
  Shield,
} from "lucide-react";

interface ExamHeaderProps {
  title: string;
  currentQuestion: number;
  totalQuestions: number;
  timeRemaining: number;
  timeLimit: number;
  soundEnabled: boolean;
  isFullscreen: boolean;
  tabSwitchCount: number;
  autoSaveStatus: "saved" | "saving" | "error";
  onSoundToggle: () => void;
  onFullscreenToggle: () => void;
}

export function ExamHeader({
  title,
  currentQuestion,
  totalQuestions,
  timeRemaining,
  timeLimit,
  soundEnabled,
  isFullscreen,
  tabSwitchCount,
  autoSaveStatus,
  onSoundToggle,
  onFullscreenToggle,
}: ExamHeaderProps) {
  const [timeColor, setTimeColor] = useState("text-foreground");

  // Update time color based on remaining time
  useEffect(() => {
    if (timeRemaining <= 60) {
      setTimeColor("text-red-600");
    } else if (timeRemaining <= 300) {
      setTimeColor("text-brand-amber");
    } else {
      setTimeColor("text-foreground");
    }
  }, [timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercentage = (currentQuestion / totalQuestions) * 100;

  return (
    <div className="bg-card border-b border-border p-4 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-lg font-semibold text-foreground truncate max-w-md">
                {title}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>Question {currentQuestion} of {totalQuestions}</span>
                <span>•</span>
                <span>{Math.round((timeLimit * 60 - timeRemaining) / 60)} min elapsed</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Auto-save Status */}
            <div className="flex items-center space-x-2">
              {autoSaveStatus === "saving" && (
                <>
                  <div className="w-3 h-3 animate-spin rounded-full border-2 border-brand-amber border-t-transparent" />
                  <span className="text-xs text-brand-amber">Saving...</span>
                </>
              )}
              {autoSaveStatus === "saved" && (
                <>
                  <div className="w-3 h-3 rounded-full bg-green-600" />
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
              <Clock className={`w-4 h-4 ${timeColor}`} />
              <span className={`font-mono text-lg font-bold ${timeColor}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onSoundToggle}
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
                onClick={onFullscreenToggle}
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

        {/* Proctoring Warnings */}
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
  );
} 