"use client";

import { useState, useMemo } from "react";
import { Task } from "@/lib/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { TaskItem } from "./TaskItem";
import { TaskForm } from "./TaskForm";
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useToggleTaskComplete,
  useDeleteTask,
} from "@/lib/hooks";
import { ListTodo, Clock, CheckCircle2, Inbox } from "lucide-react";

type StatusFilter = "all" | "pending" | "completed";

const filterConfig = {
  all: { label: "All Tasks", icon: ListTodo },
  pending: { label: "Pending", icon: Clock },
  completed: { label: "Completed", icon: CheckCircle2 },
} as const;

export function TaskList() {
  const { data: session } = useAuth();
  const [filter, setFilter] = useState<StatusFilter>("all");

  const userId = session?.user?.id;

  // React Query hooks
  const { data: allTasks = [], isLoading, error } = useTasks(userId, "all");
  const createTaskMutation = useCreateTask(userId);
  const updateTaskMutation = useUpdateTask(userId);
  const toggleCompleteMutation = useToggleTaskComplete(userId);
  const deleteTaskMutation = useDeleteTask(userId);

  // Client-side filtering (instant, no API call)
  const tasks = useMemo(() => {
    if (filter === "all") return allTasks;
    if (filter === "pending") return allTasks.filter((t) => !t.completed);
    if (filter === "completed") return allTasks.filter((t) => t.completed);
    return allTasks;
  }, [allTasks, filter]);

  // Task counts for badges
  const pendingCount = allTasks.filter((t) => !t.completed).length;
  const completedCount = allTasks.filter((t) => t.completed).length;

  if (!userId) {
    return (
      <div className="card text-center py-12">
        <p className="text-content-secondary">Please sign in to view tasks</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Add Task Form */}
      <TaskForm
        userId={userId}
        onCreateTask={createTaskMutation.mutate}
        isCreating={createTaskMutation.isPending}
      />

      {/* Stats & Filter Row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-content-tertiary">Total</span>
            <span className="inline-flex items-center h-5 px-1.5 text-[10px] font-semibold rounded-full bg-state-info-light text-state-info">
              {allTasks.length}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-content-tertiary">Pending</span>
            <span className="inline-flex items-center h-5 px-1.5 text-[10px] font-semibold rounded-full bg-state-warning-light text-state-warning">
              {pendingCount}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-content-tertiary">Done</span>
            <span className="inline-flex items-center h-5 px-1.5 text-[10px] font-semibold rounded-full bg-state-success-light text-state-success">
              {completedCount}
            </span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-0.5 bg-surface-base rounded-lg border border-border-subtle">
          {(Object.keys(filterConfig) as StatusFilter[]).map((status) => {
            const { label, icon: Icon } = filterConfig[status];
            return (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`flex items-center gap-1 h-7 px-2.5 text-xs font-medium rounded-md transition-all ${
                  filter === status
                    ? "bg-surface-raised text-content-primary shadow-sm"
                    : "text-content-tertiary hover:text-content-secondary"
                }`}
                aria-pressed={filter === status}
              >
                <Icon className="w-3 h-3" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-surface-raised rounded-xl p-3 border border-border-subtle animate-pulse"
            >
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
      ) : error ? (
        <div className="bg-state-error-light rounded-xl p-3 border border-state-error/20">
          <div className="flex items-center gap-2 text-state-error">
            <svg
              className="w-4 h-4"
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
            <p className="text-xs text-state-error">{error.message}</p>
          </div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-surface-raised rounded-xl p-8 border border-border-subtle text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-action-secondary flex items-center justify-center">
              <Inbox className="w-5 h-5 text-action-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-content-primary mb-1">
                No tasks yet
              </h3>
              <p className="text-xs text-content-tertiary">
                {filter === "all"
                  ? "Create your first task above to get started"
                  : filter === "pending"
                    ? "No pending tasks - you're all caught up!"
                    : "No completed tasks yet"}
              </p>
            </div>
          </div>
        </div>
      ) : (
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
                onUpdateTask={updateTaskMutation.mutate}
                onToggleComplete={toggleCompleteMutation.mutate}
                onDeleteTask={deleteTaskMutation.mutate}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
