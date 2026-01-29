"use client";

import { Suspense, useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TaskForm } from "@/components/tasks/TaskForm";
import { ListView } from "@/components/tasks/ListView";
import { CalendarView } from "@/components/tasks/CalendarView";
import { KanbanView } from "@/components/tasks/KanbanView";
import { GroupedTaskList } from "@/components/tasks/GroupedTaskList";
import { FocusMode } from "@/components/tasks/FocusMode";
import { ProgressCard } from "@/components/tasks/ProgressCard";
import { ViewSwitcher, ViewType } from "@/components/tasks/ViewSwitcher";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/components/providers/AuthProvider";
import { api, Task } from "@/lib/api";
import { Loader2, ListTodo, Clock, CheckCircle2 } from "lucide-react";

type StatusFilter = "all" | "pending" | "completed";

const filterConfig = {
  all: { label: "All Tasks", icon: ListTodo },
  pending: { label: "Pending", icon: Clock },
  completed: { label: "Completed", icon: CheckCircle2 },
} as const;

function DashboardContent() {
  const { session, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [focusTask, setFocusTask] = useState<Task | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const userId = session?.user?.id;

  // Get view from URL, default to list
  const currentView = (searchParams.get("view") as ViewType) || "list";

  // Fetch ALL tasks once (no filter parameter)
  const fetchTasks = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.getTasks(userId, "all");
      setAllTasks(response.tasks);
      // Mark initial load as complete after first successful fetch
      if (!initialLoadComplete) {
        setInitialLoadComplete(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tasks");
    } finally {
      setIsLoading(false);
    }
  }, [userId, initialLoadComplete]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Client-side filtering (INSTANT - no API call!)
  const tasks = useMemo(() => {
    if (filter === "all") return allTasks;
    if (filter === "pending") return allTasks.filter(t => !t.completed);
    if (filter === "completed") return allTasks.filter(t => t.completed);
    return allTasks;
  }, [allTasks, filter]);

  // Client-side redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !session) {
      router.push("/auth/sign-in");
    }
  }, [session, authLoading, router]);

  // Update URL when view changes
  const handleViewChange = (view: ViewType) => {
    router.push(`/dashboard?view=${view}`);
  };

  const handleTaskCreated = (task: Task) => {
    setAllTasks((prev) => [task, ...prev]);
  };

  const handleTaskUpdated = (updatedTask: Task) => {
    setAllTasks((prev) => prev.map((task) => (task.id === updatedTask.id ? updatedTask : task)));
  };

  const handleTaskDeleted = (taskId: number) => {
    setAllTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  const handleStatusChange = async (taskId: number, newStatus: any) => {
    if (!userId) return;
    try {
      const updated = await api.changeStatus(userId, taskId, newStatus);
      handleTaskUpdated(updated);
    } catch (err) {
      console.error("Failed to change status:", err);
    }
  };

  const handleDateClick = (date: Date) => {
    // Switch to list view to show task form where user can create task
    handleViewChange("list");
  };

  const handleTaskClick = (task: Task) => {
    // Enter focus mode for the clicked task (if not completed)
    if (!task.completed) {
      setFocusTask(task);
    }
  };

  // Task counts for badges
  const pendingCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-base">
        <div className="text-center animate-fade-in">
          <div className="w-10 h-10 rounded-xl bg-action-secondary flex items-center justify-center mx-auto mb-3">
            <Loader2 className="w-5 h-5 text-action-primary animate-spin" />
          </div>
          <p className="text-xs text-content-secondary">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated
  // (will redirect via useEffect above)
  if (!session) {
    return null;
  }

  // Show focus mode if task selected
  if (focusTask && userId) {
    return (
      <FocusMode
        task={focusTask}
        userId={userId}
        onExit={() => setFocusTask(null)}
        onTaskComplete={(updatedTask) => {
          handleTaskUpdated(updatedTask);
          setFocusTask(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-surface-base">
      <Header />

      <main className="max-w-7xl mx-auto py-5 px-3 sm:px-4">
        {/* Page Header */}
        <div className="mb-5 animate-slide-up">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-lg font-semibold text-content-primary mb-1">My Tasks</h1>
              <p className="text-sm text-content-secondary">
                Organize your day, track your progress, get things done.
              </p>
            </div>
            <ViewSwitcher currentView={currentView} onViewChange={handleViewChange} />
          </div>
        </div>

        {/* Progress Card - Mobile (at top) */}
        {userId && initialLoadComplete && (
          <div className="lg:hidden mb-4">
            <ProgressCard userId={userId} />
          </div>
        )}

        {/* Two-column layout for larger screens */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main content area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Task Form (show in all views except calendar) */}
            {currentView !== "calendar" && userId && (
              <TaskForm userId={userId} onTaskCreated={handleTaskCreated} />
            )}

            {/* Stats & Filter Row (only in list view) */}
            {currentView === "list" && (
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-content-tertiary">Total</span>
                    <span className="inline-flex items-center h-5 px-1.5 text-[10px] font-semibold rounded-full bg-state-info-light text-state-info">
                      {tasks.length}
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
            )}

            {/* Views */}
            {userId && (
              <>
                {currentView === "list" && (
                  <ListView
                    tasks={tasks}
                    userId={userId}
                    isLoading={isLoading}
                    error={error}
                    onUpdate={handleTaskUpdated}
                    onDelete={handleTaskDeleted}
                    onFocus={setFocusTask}
                  />
                )}

                {currentView === "grouped" && (
                  <GroupedTaskList
                    tasks={tasks}
                    userId={userId}
                    isLoading={isLoading}
                    error={error}
                    onUpdate={handleTaskUpdated}
                    onDelete={handleTaskDeleted}
                    onFocus={setFocusTask}
                  />
                )}

                {currentView === "calendar" && (
                  <CalendarView
                    tasks={tasks}
                    userId={userId}
                    onDateClick={handleDateClick}
                    onTaskClick={handleTaskClick}
                  />
                )}

                {currentView === "kanban" && (
                  <KanbanView
                    tasks={tasks}
                    userId={userId}
                    onStatusChange={handleStatusChange}
                    onUpdate={handleTaskUpdated}
                    onDelete={handleTaskDeleted}
                    onFocus={setFocusTask}
                  />
                )}
              </>
            )}
          </div>

          {/* Sidebar - Progress Card (only on larger screens) */}
          {userId && initialLoadComplete && (
            <div className="hidden lg:block">
              <div className="sticky top-20">
                <ProgressCard userId={userId} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-surface-base">
          <div className="text-center animate-fade-in">
            <div className="w-10 h-10 rounded-xl bg-action-secondary flex items-center justify-center mx-auto mb-3">
              <Loader2 className="w-5 h-5 text-action-primary animate-spin" />
            </div>
            <p className="text-xs text-content-secondary">Loading...</p>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
