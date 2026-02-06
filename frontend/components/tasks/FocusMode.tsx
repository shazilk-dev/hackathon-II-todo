"use client";

import { useEffect, useState } from "react";
import { api, DurationType, FocusSession, Task } from "@/lib/api";
import { X, Play, Pause, RotateCcw, Check, Clock } from "lucide-react";

interface FocusModeProps {
  task: Task;
  userId: string;
  onExit: () => void;
  onTaskComplete: (task: Task) => void;
}

export function FocusMode({ task, userId, onExit, onTaskComplete }: FocusModeProps) {
  const [duration, setDuration] = useState<DurationType>(25);
  const [timeLeft, setTimeLeft] = useState(duration * 60);  // in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [notes, setNotes] = useState("");
  const [session, setSession] = useState<FocusSession | null>(null);

  // Timer logic
  useEffect(() => {
    if (!isRunning || timeLeft === 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          handleTimerComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleStart = async () => {
    if (!session) {
      // Start new session
      try {
        const newSession = await api.startFocusSession(userId, {
          task_id: task.id,
          duration_minutes: duration
        });
        setSession(newSession);
        setIsRunning(true);
      } catch (error) {
        console.error("Failed to start focus session:", error);
      }
    } else {
      setIsRunning(true);
    }
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(duration * 60);
  };

  const handleTimerComplete = async () => {
    // Timer finished - end session as completed
    if (session) {
      try {
        await api.endFocusSession(userId, session.id, {
          completed: true,
          notes: notes || undefined
        });
      } catch (error) {
        console.error("Failed to end focus session:", error);
      }
    }
  };

  const handleEndSession = async (completed: boolean) => {
    if (session) {
      try {
        await api.endFocusSession(userId, session.id, {
          completed,
          notes: notes || undefined
        });
        setSession(null);
        setIsRunning(false);
        setTimeLeft(duration * 60);
      } catch (error) {
        console.error("Failed to end focus session:", error);
      }
    }
  };

  const handleMarkComplete = async () => {
    try {
      const updated = await api.changeStatus(userId, task.id, "done");
      onTaskComplete(updated);
    } catch (error) {
      console.error("Failed to mark task complete:", error);
    }
  };

  const handleDurationChange = (newDuration: DurationType) => {
    if (!isRunning && !session) {
      setDuration(newDuration);
      setTimeLeft(newDuration * 60);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-surface-base via-surface-base to-action-primary/5 z-50 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface-overlay/95 backdrop-blur-xl border-b border-border-subtle">
        <div className="flex items-center justify-between p-3 sm:p-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-action-primary/10 text-action-primary">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-content-primary">Focus Mode</h2>
              <p className="text-[10px] sm:text-xs text-content-tertiary">
                {session ? (isRunning ? "In Progress" : "Paused") : "Ready to Start"}
              </p>
            </div>
          </div>
          <button
            onClick={onExit}
            className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl hover:bg-action-secondary transition-colors"
            aria-label="Exit focus mode"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-content-secondary" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-8 lg:py-12">
        <div className="w-full max-w-2xl mx-auto space-y-6 sm:space-y-8">
          {/* Task Info Card */}
          <div className="bg-surface-raised/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-border-subtle shadow-sm">
            <div className="text-center space-y-2">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-content-primary leading-tight">
                {task.title}
              </h1>
              {task.description && (
                <p className="text-xs sm:text-sm text-content-secondary line-clamp-2 max-w-lg mx-auto">
                  {task.description}
                </p>
              )}
            </div>
          </div>

          {/* Timer Display */}
          <div className="flex items-center justify-center">
            <div className="relative">
              {/* Progress ring */}
              <svg 
                className="w-48 h-48 sm:w-56 sm:h-56 lg:w-72 lg:h-72 transform -rotate-90" 
                viewBox="0 0 256 256"
              >
                {/* Background circle */}
                <circle
                  cx="128"
                  cy="128"
                  r="112"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-border-subtle opacity-30"
                />
                {/* Progress circle */}
                <circle
                  cx="128"
                  cy="128"
                  r="112"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 112}`}
                  strokeDashoffset={`${2 * Math.PI * 112 * (1 - progress / 100)}`}
                  className={`transition-all duration-1000 ${
                    isRunning 
                      ? "text-action-primary" 
                      : timeLeft === 0 
                      ? "text-state-success" 
                      : "text-content-tertiary"
                  }`}
                  strokeLinecap="round"
                />
              </svg>

              {/* Time display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl sm:text-5xl lg:text-6xl font-bold text-content-primary tabular-nums tracking-tight">
                  {formatTime(timeLeft)}
                </span>
                <span className="text-xs sm:text-sm text-content-tertiary mt-1 sm:mt-2">
                  {duration} minute session
                </span>
              </div>
            </div>
          </div>

          {/* Duration selector (only when not started) */}
          {!session && (
            <div className="bg-surface-raised/50 rounded-xl p-3 sm:p-4 border border-border-subtle">
              <label className="block text-xs sm:text-sm font-medium text-content-secondary mb-2 sm:mb-3 text-center">
                Session Duration
              </label>
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                {[5, 15, 25].map((d) => (
                  <button
                    key={d}
                    onClick={() => handleDurationChange(d as DurationType)}
                    className={`flex-1 max-w-[100px] px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      duration === d
                        ? "bg-action-primary text-content-inverse shadow-md scale-105"
                        : "bg-surface-raised text-content-secondary hover:bg-action-secondary hover:text-content-primary border border-border-subtle"
                    }`}
                  >
                    {d} min
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            {!isRunning ? (
              <button
                onClick={handleStart}
                className="flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 bg-action-primary text-content-inverse rounded-xl hover:bg-action-primary-hover transition-all shadow-md hover:shadow-lg font-semibold text-sm sm:text-base flex-1 sm:flex-initial"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{session ? "Resume" : "Start Focus"}</span>
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 bg-action-primary text-content-inverse rounded-xl hover:bg-action-primary-hover transition-all shadow-md hover:shadow-lg font-semibold text-sm sm:text-base flex-1 sm:flex-initial"
              >
                <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Pause</span>
              </button>
            )}

            {session && (
              <>
                <button
                  onClick={handleReset}
                  className="flex items-center justify-center gap-2 px-4 sm:px-5 py-3 sm:py-3.5 bg-surface-raised text-content-secondary rounded-xl hover:bg-action-secondary hover:text-content-primary transition-all border border-border-subtle font-medium text-sm sm:text-base"
                  aria-label="Reset timer"
                  title="Reset timer"
                >
                  <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Reset</span>
                </button>

                {!task.completed && (
                  <button
                    onClick={handleMarkComplete}
                    className="flex items-center justify-center gap-2 px-4 sm:px-5 py-3 sm:py-3.5 bg-state-success text-white rounded-xl hover:bg-state-success-hover transition-all shadow-md hover:shadow-lg font-semibold text-sm sm:text-base flex-1 sm:flex-initial"
                  >
                    <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Complete Task</span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Notes area */}
          <div className="bg-surface-raised/50 rounded-xl p-3 sm:p-4 border border-border-subtle">
            <label 
              htmlFor="focus-notes" 
              className="block text-xs sm:text-sm font-medium text-content-primary mb-2 sm:mb-3"
            >
              Session Notes
              <span className="text-content-tertiary font-normal ml-2">(Optional)</span>
            </label>
            <textarea
              id="focus-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Jot down thoughts, progress, blockers, or key insights..."
              rows={4}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-surface-base border border-border-subtle rounded-lg text-xs sm:text-sm text-content-primary placeholder-content-tertiary focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-action-primary/10 resize-none transition-all"
            />
          </div>

          {/* End session button */}
          {session && (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
              <button
                onClick={() => handleEndSession(false)}
                className="flex-1 px-4 py-2.5 text-xs sm:text-sm text-content-secondary hover:text-content-primary hover:bg-action-secondary rounded-lg transition-colors border border-border-subtle font-medium"
              >
                End Session (Interrupted)
              </button>
              {timeLeft === 0 && (
                <button
                  onClick={() => handleEndSession(true)}
                  className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-state-success text-white rounded-lg hover:bg-state-success-hover transition-colors shadow-sm font-semibold"
                >
                  End Session (Completed)
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
