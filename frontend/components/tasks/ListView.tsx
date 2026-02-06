"use client";

import { Task, UpdateTaskData } from "@/lib/api";
import { TaskItem } from "./TaskItem";
import { Inbox, Sparkles } from "lucide-react";

interface ListViewProps {
  tasks: Task[];
  userId: string;
  isLoading: boolean;
  error: Error | null;
  onFocus?: (task: Task) => void;
  onUpdateTask: (variables: { taskId: number; data: UpdateTaskData }) => void;
  onToggleComplete: (taskId: number) => void;
  onDeleteTask: (taskId: number) => void;
}

export function ListView({
  tasks,
  userId,
  isLoading,
  error,
  onFocus,
  onUpdateTask,
  onToggleComplete,
  onDeleteTask,
}: ListViewProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-surface-raised rounded-2xl p-4 border border-border-subtle animate-pulse"
          >
            <div className="flex items-start gap-3">
              <div className="skeleton w-[22px] h-[22px] rounded-lg" />
              <div className="flex-1 space-y-2.5">
                <div className="skeleton h-4 w-3/4 rounded-lg" />
                <div className="skeleton h-3 w-1/2 rounded-lg" />
                <div className="flex gap-2">
                  <div className="skeleton h-5 w-16 rounded-lg" />
                  <div className="skeleton h-5 w-14 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-state-error-light rounded-2xl p-4 border border-state-error/20">
        <div className="flex items-center gap-2.5 text-state-error">
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-state-error">{error.message}</p>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-surface-raised rounded-2xl py-16 px-6 border border-border-subtle text-center">
        <div className="flex flex-col items-center gap-4 max-w-xs mx-auto">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-action-secondary flex items-center justify-center shadow-sm">
              <Inbox className="w-7 h-7 text-action-primary" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-state-success-light flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-state-success" />
            </div>
          </div>
          <div>
            <h3 className="text-base font-semibold text-content-primary mb-1.5">
              No tasks yet
            </h3>
            <p className="text-[13px] text-content-tertiary leading-relaxed">
              Add your first task above and start organizing your day.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task, index) => (
        <div
          key={task.id}
          className="animate-slide-up"
          style={{ animationDelay: `${index * 30}ms` }}
        >
          <TaskItem
            task={task}
            userId={userId}
            onFocus={onFocus}
            onUpdateTask={onUpdateTask}
            onToggleComplete={onToggleComplete}
            onDeleteTask={onDeleteTask}
          />
        </div>
      ))}
    </div>
  );
}
