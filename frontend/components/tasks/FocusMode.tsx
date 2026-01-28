"use client";

import { useEffect, useState } from "react";
import { api, DurationType, FocusSession, Task } from "@/lib/api";
import { X, Play, Pause, RotateCcw, Check } from "lucide-react";

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
    <div className="fixed inset-0 bg-surface-base z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-subtle">
        <h2 className="text-sm font-medium text-content-secondary">Focus Mode</h2>
        <button
          onClick={onExit}
          className="p-2 rounded-lg hover:bg-action-secondary transition-colors"
          aria-label="Exit focus mode"
        >
          <X className="w-5 h-5 text-content-secondary" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full p-6">
        {/* Task Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-content-primary mb-2">
            {task.title}
          </h1>
          {task.description && (
            <p className="text-sm text-content-secondary">{task.description}</p>
          )}
        </div>

        {/* Timer Display */}
        <div className="relative mb-8">
          {/* Progress ring */}
          <svg className="w-64 h-64 transform -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-border-subtle"
            />
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 120}`}
              strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
              className="text-action-primary transition-all duration-1000"
              strokeLinecap="round"
            />
          </svg>

          {/* Time display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl font-bold text-content-primary tabular-nums">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* Duration selector (only when not started) */}
        {!session && (
          <div className="flex items-center gap-2 mb-6">
            {[5, 15, 25].map((d) => (
              <button
                key={d}
                onClick={() => handleDurationChange(d as DurationType)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  duration === d
                    ? "bg-action-primary text-content-inverse"
                    : "bg-surface-raised text-content-secondary hover:bg-action-secondary"
                }`}
              >
                {d} min
              </button>
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-4 mb-8">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-6 py-3 bg-action-primary text-content-inverse rounded-lg hover:bg-action-primary-hover transition-colors"
            >
              <Play className="w-5 h-5" />
              <span className="font-medium">Start</span>
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="flex items-center gap-2 px-6 py-3 bg-action-primary text-content-inverse rounded-lg hover:bg-action-primary-hover transition-colors"
            >
              <Pause className="w-5 h-5" />
              <span className="font-medium">Pause</span>
            </button>
          )}

          {session && (
            <>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-3 bg-surface-raised text-content-secondary rounded-lg hover:bg-action-secondary transition-colors"
                aria-label="Reset timer"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              {!task.completed && (
                <button
                  onClick={handleMarkComplete}
                  className="flex items-center gap-2 px-4 py-3 bg-state-success text-white rounded-lg hover:bg-state-success-hover transition-colors"
                >
                  <Check className="w-5 h-5" />
                  <span className="font-medium">Complete Task</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* Notes area */}
        <div className="w-full max-w-lg">
          <label htmlFor="focus-notes" className="block text-sm font-medium text-content-primary mb-2">
            Session Notes
          </label>
          <textarea
            id="focus-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Jot down thoughts, progress, or blockers..."
            rows={4}
            className="w-full px-3 py-2 bg-surface-raised border border-border-subtle rounded-lg text-sm text-content-primary placeholder-content-tertiary focus:outline-none focus:border-border-focus resize-none"
          />
        </div>

        {/* End session button */}
        {session && (
          <div className="mt-6 flex gap-2">
            <button
              onClick={() => handleEndSession(false)}
              className="px-4 py-2 text-sm text-content-secondary hover:text-content-primary hover:bg-action-secondary rounded-lg transition-colors"
            >
              End Session (Interrupted)
            </button>
            {timeLeft === 0 && (
              <button
                onClick={() => handleEndSession(true)}
                className="px-4 py-2 text-sm bg-action-primary text-content-inverse rounded-lg hover:bg-action-primary-hover transition-colors"
              >
                End Session (Completed)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
