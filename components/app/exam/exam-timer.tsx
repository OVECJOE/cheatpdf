"use client";

import { useEffect, useRef } from "react";

interface ExamTimerProps {
  timeRemaining: number;
  timeLimit: number;
  isActive: boolean;
  soundEnabled: boolean;
  onTimeUpdate: (time: number) => void;
  onTimeExpired: () => void;
}

export function ExamTimer({
  timeRemaining,
  timeLimit,
  isActive,
  soundEnabled,
  onTimeUpdate,
  onTimeExpired,
}: ExamTimerProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastAlertTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isActive || timeRemaining <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Validate that timeRemaining doesn't exceed timeLimit
    const maxTime = timeLimit * 60; // Convert minutes to seconds
    const validTimeRemaining = Math.min(timeRemaining, maxTime);

    intervalRef.current = setInterval(() => {
      const newTime = validTimeRemaining - 1;
      onTimeUpdate(newTime);

      // Play time alerts at critical points
      if (soundEnabled) {
        const now = Date.now();
        if (
          (newTime === 300 || newTime === 60 || newTime === 30) &&
          now - lastAlertTimeRef.current > 1000 // Prevent multiple alerts
        ) {
          if (typeof window !== 'undefined' && (window as any).playTimeAlert) {
            (window as any).playTimeAlert();
          }
          lastAlertTimeRef.current = now;
        }
      }

      if (newTime <= 0) {
        onTimeExpired();
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, timeRemaining, timeLimit, soundEnabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return null; // This component doesn't render anything
} 