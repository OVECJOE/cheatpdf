// Make sure to install idb-keyval: npm install idb-keyval
import { useState, useEffect } from "react";
import { get, set } from "idb-keyval";

export function useExamTimer(examId: string, startedAt: string, timeLimit: number) {
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    const endTime = new Date(startedAt).getTime() + timeLimit * 60 * 1000;
    return Math.max(0, Math.floor((endTime - Date.now()) / 1000));
  });

  useEffect(() => {
    set("currentExamId", examId);
    set("examStartedAt", startedAt);
    set("examTimeLimit", timeLimit);
  }, [examId, startedAt, timeLimit]);

  useEffect(() => {
    const interval = setInterval(() => {
      const endTime = new Date(startedAt).getTime() + timeLimit * 60 * 1000;
      setTimeLeft(Math.max(0, Math.floor((endTime - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt, timeLimit]);

  return timeLeft;
} 