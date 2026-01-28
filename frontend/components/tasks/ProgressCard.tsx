"use client";

import { useEffect, useState } from "react";
import { api, UserStatistics } from "@/lib/api";
import { TrendingUp, Flame, Target, Calendar } from "lucide-react";

interface ProgressCardProps {
  userId: string;
}

export function ProgressCard({ userId }: ProgressCardProps) {
  const [stats, setStats] = useState<UserStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatistics();
  }, [userId]);

  const fetchStatistics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await api.getStatistics(userId);
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load statistics");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-surface-raised rounded-xl p-6 border border-border-subtle animate-pulse">
        <div className="space-y-4">
          <div className="skeleton h-4 w-1/3 rounded" />
          <div className="skeleton h-20 w-full rounded" />
          <div className="skeleton h-32 w-full rounded" />
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-state-error-light rounded-xl p-4 border border-state-error/20">
        <p className="text-xs text-state-error">
          {error || "Failed to load statistics"}
        </p>
      </div>
    );
  }

  const { statistics, streak, weekly } = stats;

  // Find max count for chart scaling
  const maxCount = Math.max(...weekly.days.map(d => d.completed_count), 1);

  return (
    <div className="bg-surface-raised rounded-xl border border-border-subtle overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-action-primary" />
          <h3 className="text-sm font-semibold text-content-primary">Your Progress</h3>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Completion Rate */}
          <div className="bg-surface-base rounded-lg p-3 border border-border-subtle">
            <div className="flex items-center gap-1.5 mb-1">
              <Target className="w-3 h-3 text-content-tertiary" />
              <span className="text-[10px] text-content-tertiary uppercase tracking-wide">
                Completion
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-content-primary">
                {statistics.completion_rate}
              </span>
              <span className="text-xs text-content-secondary">%</span>
            </div>
            <p className="text-[10px] text-content-tertiary mt-1">
              {statistics.completed_tasks} of {statistics.total_tasks} tasks
            </p>
          </div>

          {/* Current Streak */}
          <div className="bg-surface-base rounded-lg p-3 border border-border-subtle">
            <div className="flex items-center gap-1.5 mb-1">
              <Flame className="w-3 h-3 text-state-warning" />
              <span className="text-[10px] text-content-tertiary uppercase tracking-wide">
                Streak
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-content-primary">
                {streak.current_streak}
              </span>
              <span className="text-xs text-content-secondary">days</span>
            </div>
            <p className="text-[10px] text-content-tertiary mt-1">
              Best: {streak.longest_streak} days
            </p>
          </div>
        </div>

        {/* Weekly Chart */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <Calendar className="w-3 h-3 text-content-tertiary" />
            <span className="text-xs font-medium text-content-secondary">
              This Week
            </span>
            <span className="text-xs text-content-tertiary">
              ({weekly.total} completed)
            </span>
          </div>

          {/* Bar Chart */}
          <div className="flex items-end justify-between gap-1.5 h-24">
            {weekly.days.map((day) => {
              const date = new Date(day.date);
              const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
              const height = maxCount > 0 ? (day.completed_count / maxCount) * 100 : 0;

              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  {/* Bar */}
                  <div className="w-full bg-surface-base rounded-t relative" style={{ height: '100%' }}>
                    <div
                      className="w-full bg-action-primary rounded-t absolute bottom-0 transition-all"
                      style={{ height: `${height}%` }}
                      title={`${day.completed_count} tasks completed`}
                    />
                  </div>

                  {/* Count */}
                  <span className="text-[10px] font-medium text-content-secondary">
                    {day.completed_count}
                  </span>

                  {/* Day label */}
                  <span className="text-[9px] text-content-tertiary uppercase">
                    {dayName[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Additional Stats */}
        <div className="pt-3 border-t border-border-subtle flex items-center justify-between text-xs">
          <div>
            <span className="text-content-tertiary">Pending:</span>
            <span className="ml-1 font-medium text-content-secondary">
              {statistics.pending_tasks}
            </span>
          </div>
          <div>
            <span className="text-content-tertiary">Total completions:</span>
            <span className="ml-1 font-medium text-content-secondary">
              {statistics.total_completions}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
