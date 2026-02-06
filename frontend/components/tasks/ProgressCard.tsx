"use client";

import { memo } from "react";
import { TrendingUp, Flame, Target, Calendar, Zap } from "lucide-react";
import { useStatistics } from "@/lib/hooks";

interface ProgressCardProps {
  userId: string;
}

export const ProgressCard = memo(function ProgressCard({
  userId,
}: ProgressCardProps) {
  const { data: stats, isLoading, error } = useStatistics(userId);

  if (isLoading) {
    return (
      <div className="bg-surface-raised rounded-2xl p-5 border border-border-subtle animate-pulse">
        <div className="space-y-5">
          <div className="skeleton h-5 w-1/3 rounded-lg" />
          <div className="grid grid-cols-2 gap-3">
            <div className="skeleton h-24 rounded-xl" />
            <div className="skeleton h-24 rounded-xl" />
          </div>
          <div className="skeleton h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-state-error-light rounded-2xl p-4 border border-state-error/20">
        <p className="text-sm text-state-error">
          {error?.message || "Failed to load statistics"}
        </p>
      </div>
    );
  }

  const { statistics, streak, weekly } = stats;

  // Find max count for chart scaling
  const maxCount = Math.max(...weekly.days.map((d) => d.completed_count), 1);

  // Completion rate ring percentage
  const completionPct = Math.min(statistics.completion_rate, 100);
  const circumference = 2 * Math.PI * 40; // r=40
  const strokeDashoffset =
    circumference - (completionPct / 100) * circumference;

  return (
    <div className="bg-surface-raised rounded-2xl border border-border-subtle overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-action-secondary flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-action-primary" />
          </div>
          <h3 className="text-[15px] font-semibold text-content-primary">
            Your Progress
          </h3>
        </div>
      </div>

      <div className="px-5 pb-5 space-y-5">
        {/* Completion Ring + Streak */}
        <div className="grid grid-cols-2 gap-3">
          {/* Completion Rate with ring */}
          <div className="bg-surface-base rounded-xl p-3.5 border border-border-subtle">
            <div className="flex items-center gap-1.5 mb-2">
              <Target className="w-3.5 h-3.5 text-content-tertiary" />
              <span className="text-[11px] text-content-tertiary font-semibold uppercase tracking-wider">
                Completion
              </span>
            </div>
            <div className="flex items-center gap-3">
              {/* Mini ring */}
              <svg
                width="48"
                height="48"
                viewBox="0 0 96 96"
                className="flex-shrink-0 -rotate-90"
              >
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke="var(--border-subtle)"
                  strokeWidth="8"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke="var(--action-primary)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-xl font-bold text-content-primary">
                    {statistics.completion_rate}
                  </span>
                  <span className="text-[11px] text-content-secondary">%</span>
                </div>
                <p className="text-[11px] text-content-tertiary mt-0.5">
                  {statistics.completed_tasks}/{statistics.total_tasks} tasks
                </p>
              </div>
            </div>
          </div>

          {/* Current Streak */}
          <div className="bg-surface-base rounded-xl p-3.5 border border-border-subtle">
            <div className="flex items-center gap-1.5 mb-2">
              <Flame className="w-3.5 h-3.5 text-state-warning" />
              <span className="text-[11px] text-content-tertiary font-semibold uppercase tracking-wider">
                Streak
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-content-primary">
                {streak.current_streak}
              </span>
              <span className="text-[11px] text-content-secondary">days</span>
            </div>
            <p className="text-[11px] text-content-tertiary mt-1">
              Best: {streak.longest_streak} days
            </p>
          </div>
        </div>

        {/* Weekly Chart */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-content-tertiary" />
              <span className="text-[13px] font-medium text-content-secondary">
                This Week
              </span>
            </div>
            <span className="text-[11px] text-content-tertiary font-medium">
              {weekly.total} completed
            </span>
          </div>

          {/* Bar Chart */}
          <div className="flex items-end justify-between gap-2 h-28">
            {weekly.days.map((day) => {
              const date = new Date(day.date);
              const dayName = date.toLocaleDateString("en-US", {
                weekday: "short",
              });
              const height =
                maxCount > 0
                  ? Math.max((day.completed_count / maxCount) * 100, 4)
                  : 4;
              const isToday = new Date().toDateString() === date.toDateString();

              return (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center gap-1.5 group/bar"
                >
                  {/* Bar container */}
                  <div
                    className="w-full bg-surface-base rounded-lg relative"
                    style={{ height: "100%" }}
                  >
                    <div
                      className={`w-full rounded-lg absolute bottom-0 transition-all duration-500 ease-out ${
                        isToday
                          ? "bg-action-primary"
                          : "bg-action-primary/40 group-hover/bar:bg-action-primary/70"
                      }`}
                      style={{ height: `${height}%` }}
                      title={`${day.completed_count} tasks completed`}
                    />
                  </div>

                  {/* Count */}
                  <span className="text-[11px] font-semibold text-content-secondary">
                    {day.completed_count}
                  </span>

                  {/* Day label */}
                  <span
                    className={`text-[10px] uppercase tracking-wide ${
                      isToday
                        ? "text-action-primary font-bold"
                        : "text-content-tertiary"
                    }`}
                  >
                    {dayName.charAt(0)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Additional Stats */}
        <div className="pt-3 border-t border-border-subtle grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-state-warning-light flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-state-warning" />
            </div>
            <div>
              <p className="text-[11px] text-content-tertiary">Pending</p>
              <p className="text-sm font-bold text-content-primary">
                {statistics.pending_tasks}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-state-success-light flex items-center justify-center">
              <Target className="w-3.5 h-3.5 text-state-success" />
            </div>
            <div>
              <p className="text-[11px] text-content-tertiary">All-time</p>
              <p className="text-sm font-bold text-content-primary">
                {statistics.total_completions}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
