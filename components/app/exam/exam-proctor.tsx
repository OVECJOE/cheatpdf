"use client";

import { useEffect } from "react";

interface ExamProctorProps {
  isActive: boolean;
  soundEnabled: boolean;
  onTabSwitch: () => void;
  onTimeAlert: () => void;
  onWarning: () => void;
}

export function ExamProctor({
  isActive,
  soundEnabled,
  onTabSwitch,
  onTimeAlert,
  onWarning,
}: ExamProctorProps) {
  // Prevent tab switching and page leaving
  useEffect(() => {
    if (!isActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        onTabSwitch();
        if (soundEnabled) {
          playWarningSound();
        }
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.stopImmediatePropagation();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent common shortcuts that could be used for cheating
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'c' || e.key === 'v' || e.key === 'a' || e.key === 'f' || e.key === 'p')
      ) {
        e.preventDefault();
        onWarning();
      }
      
      // Prevent F11 (fullscreen toggle)
      if (e.key === 'F11') {
        e.preventDefault();
        onWarning();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      onWarning();
    };

    const handleSelectStart = (e: Event) => {
      e.preventDefault();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("selectstart", handleSelectStart);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("selectstart", handleSelectStart);
    };
  }, [isActive, soundEnabled]);

  // Fullscreen management
  useEffect(() => {
    if (!isActive) return;

    const handleFullscreenChange = () => {
      // Monitor fullscreen state changes
      if (!document.fullscreenElement) {
        onWarning();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [isActive]);

  const playWarningSound = () => {
    if (!soundEnabled) return;
    
    try {
      const audio = new Audio(
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+D0u2YUBTGEFlMxr2JUcays"
      );
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (error) {
      console.warn("Could not play warning sound:", error);
    }
  };

  const playTimeAlert = () => {
    if (!soundEnabled) return;
    
    try {
      const audio = new Audio(
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+D0u2YUBTGE2vC9dywF"
      );
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (error) {
      console.warn("Could not play time alert:", error);
    }
  };

  // Expose time alert function to parent
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).playTimeAlert = () => {
        playTimeAlert();
        onTimeAlert(); // Call the prop function as well
      };
    }
  }, [soundEnabled]);

  return null; // This component doesn't render anything
} 