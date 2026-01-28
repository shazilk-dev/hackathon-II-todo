"use client";

import { Task } from "@/lib/api";
import { TaskItem } from "./TaskItem";
import { Inbox } from "lucide-react";

interface ListViewProps {
  tasks: Task[];
  userId: string;
  isLoading: boolean;
  error: string | null;
  onUpdate: (task: Task) => void;
  onDelete: (taskId: number) => void;
  onFocus?: (task: Task) => void;
}

export function ListView({ tasks, userId, isLoading, error, onUpdate, onDelete, onFocus }: ListViewProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface-raised rounded-xl p-3 border border-border-subtle animate-pulse">
            <div className="flex items-start gap-3">
              <div className="skeleton w-5 h-5 rounded" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-state-error-light rounded-xl p-3 border border-state-error/20">
        <div className="flex items-center gap-2 text-state-error">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs">{error}</p>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-surface-raised rounded-xl p-8 border border-border-subtle text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-action-secondary flex items-center justify-center">
            <Inbox className="w-5 h-5 text-action-primary" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-content-primary mb-1">No tasks found</h3>
            <p className="text-xs text-content-tertiary">Create a task to get started</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task, index) => (
        <div
          key={task.id}
          className="animate-slide-up"
          style={{ animationDelay: `${index * 30}ms` }}
        >
          <TaskItem
            task={task}
            userId={userId}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onFocus={onFocus}
          />
        </div>
      ))}
    </div>
  );
}
