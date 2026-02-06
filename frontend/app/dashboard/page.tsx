"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
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
import { Task } from "@/lib/api";
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useToggleTaskComplete,
  useDeleteTask,
} from "@/lib/hooks";
import {
  Loader2,
  ListTodo,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

type StatusFilter = "all" | "pending" | "completed";

const filterConfig = {
  all: { label: "All", icon: ListTodo, color: "text-state-info" },
  pending: { label: "Pending", icon: Clock, color: "text-state-warning" },
  completed: {
    label: "Done",
    icon: CheckCircle2,
    color: "text-state-success",
  },
} as const;

/** Returns a time-of-day greeting */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function DashboardContent() {
  const { data: session, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filter, setFilter] = useState<StatusFilter>("all");
  const [focusTask, setFocusTask] = useState<Task | null>(null);

  const userId = session?.user?.id;
  const userName =
    session?.user?.name || session?.user?.email?.split("@")[0] || "";

  // Get view from URL, default to list
  const currentView = (searchParams.get("view") as ViewType) || "list";

  // React Query - Automatic caching
  const { data: allTasks = [], isLoading, error } = useTasks(userId, "all");

  // React Query mutations
  const createTaskMutation = useCreateTask(userId);
  const updateTaskMutation = useUpdateTask(userId);
  const toggleCompleteMutation = useToggleTaskComplete(userId);
  const deleteTaskMutation = useDeleteTask(userId);

  // Client-side filtering
  const tasks = useMemo(() => {
    if (filter === "all") return allTasks;
    if (filter === "pending") return allTasks.filter((t) => !t.completed);
    if (filter === "completed") return allTasks.filter((t) => t.completed);
    return allTasks;
  }, [allTasks, filter]);

  // Derive counts from full dataset
  const totalCount = allTasks.length;
  const pendingCount = allTasks.filter((t) => !t.completed).length;
  const completedCount = allTasks.filter((t) => t.completed).length;
  const overdueCount = allTasks.filter((t) => {
    if (t.completed || !t.due_date) return false;
    return new Date(t.due_date) < new Date();
  }).length;
  const todayCount = allTasks.filter((t) => {
    if (t.completed || !t.due_date) return false;
    const due = new Date(t.due_date);
    const now = new Date();
    return (
      due.getDate() === now.getDate() &&
      due.getMonth() === now.getMonth() &&
      due.getFullYear() === now.getFullYear()
    );
  }).length;

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !session) {
      router.push("/auth/sign-in");
    }
  }, [session, authLoading, router]);

  const handleViewChange = (view: ViewType) => {
    router.push(`/dashboard?view=${view}`);
  };

  const handleTaskCreated = (task: Task) => {
    // Handled by React Query optimistic update
  };

  const handleStatusChange = (taskId: number, newStatus: any) => {
    if (!userId) return;
    updateTaskMutation.mutate({ taskId, data: { status: newStatus } });
  };

  const handleDateClick = () => handleViewChange("list");

  const handleTaskClick = (task: Task) => {
    if (!task.completed) setFocusTask(task);
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-base">
        <div className="text-center animate-fade-in">
          <div className="w-12 h-12 rounded-2xl bg-action-secondary flex items-center justify-center mx-auto mb-4 shadow-md">
            <Loader2 className="w-6 h-6 text-action-primary animate-spin" />
          </div>
          <p className="text-sm text-content-secondary font-medium">
            Loading your workspace…
          </p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  // Focus mode
  if (focusTask && userId) {
    return (
      <FocusMode
        task={focusTask}
        userId={userId}
        onExit={() => setFocusTask(null)}
        onTaskComplete={() => setFocusTask(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-surface-base">
      <Header />

      <main className="max-w-6xl mx-auto pt-6 pb-12 px-4 sm:px-6 lg:px-8">
        {/* ── Welcome Section ── */}
        <div className="mb-8 animate-slide-up">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-content-primary tracking-tight">
                {getGreeting()}
                {userName ? `, ${userName}` : ""}{" "}
                <span className="inline-block animate-float">👋</span>
              </h1>
              <p className="text-sm sm:text-[15px] text-content-secondary mt-1.5 leading-relaxed">
                {totalCount === 0
                  ? "Start your productive day by adding your first task."
                  : todayCount > 0
                    ? `You have ${todayCount} task${todayCount > 1 ? "s" : ""} due today${overdueCount > 0 ? ` and ${overdueCount} overdue` : ""}.`
                    : pendingCount > 0
                      ? `${pendingCount} task${pendingCount > 1 ? "s" : ""} remaining. Keep going!`
                      : "All tasks done — you're on top of things! 🎉"}
              </p>
            </div>
            <ViewSwitcher
              currentView={currentView}
              onViewChange={handleViewChange}
            />
          </div>
        </div>

        {/* ── Quick Stats Row ── */}
        {totalCount > 0 && (
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 animate-slide-up"
            style={{ animationDelay: "60ms" }}
          >
            {[
              {
                label: "Total",
                value: totalCount,
                icon: ListTodo,
                bg: "bg-state-info-light",
                fg: "text-state-info",
              },
              {
                label: "Pending",
                value: pendingCount,
                icon: Clock,
                bg: "bg-state-warning-light",
                fg: "text-state-warning",
              },
              {
                label: "Completed",
                value: completedCount,
                icon: CheckCircle2,
                bg: "bg-state-success-light",
                fg: "text-state-success",
              },
              {
                label: "Overdue",
                value: overdueCount,
                icon: AlertTriangle,
                bg: "bg-state-error-light",
                fg: "text-state-error",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-3 px-4 py-3 bg-surface-raised rounded-2xl border border-border-subtle hover:shadow-md transition-shadow"
              >
                <div
                  className={`flex items-center justify-center w-9 h-9 rounded-xl ${stat.bg}`}
                >
                  <stat.icon className={`w-[18px] h-[18px] ${stat.fg}`} />
                </div>
                <div>
                  <p className="text-lg font-bold text-content-primary leading-none">
                    {stat.value}
                  </p>
                  <p className="text-xs text-content-tertiary mt-0.5">
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Progress Card — Mobile only ── */}
        {userId && (
          <div className="lg:hidden mb-6">
            <ProgressCard userId={userId} />
          </div>
        )}

        {/* ── Two-column Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Main content */}
          <div className="space-y-5 min-w-0">
            {/* Task Form */}
            {currentView !== "calendar" && userId && (
              <TaskForm
                userId={userId}
                onTaskCreated={handleTaskCreated}
                onCreateTask={createTaskMutation.mutate}
                isCreating={createTaskMutation.isPending}
              />
            )}

            {/* Filter Tabs (list view only) */}
            {currentView === "list" && (
              <div className="flex items-center gap-1.5 p-1 bg-surface-raised rounded-2xl border border-border-subtle shadow-sm">
                {(Object.keys(filterConfig) as StatusFilter[]).map((status) => {
                  const { label, icon: Icon, color } = filterConfig[status];
                  const isActive = filter === status;
                  const count =
                    status === "all"
                      ? totalCount
                      : status === "pending"
                        ? pendingCount
                        : completedCount;

                  return (
                    <button
                      key={status}
                      onClick={() => setFilter(status)}
                      className={`relative flex items-center justify-center gap-2 flex-1 h-10 sm:h-11 text-[13px] sm:text-sm font-medium rounded-xl transition-all duration-200 ${
                        isActive
                          ? "bg-surface-base text-content-primary shadow-md"
                          : "text-content-tertiary hover:text-content-secondary"
                      }`}
                      aria-pressed={isActive}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? color : ""}`} />
                      <span>{label}</span>
                      <span
                        className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-semibold rounded-full transition-colors ${
                          isActive
                            ? `${color} bg-surface-raised`
                            : "text-content-tertiary bg-surface-base"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
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
                    onFocus={setFocusTask}
                    onUpdateTask={updateTaskMutation.mutate}
                    onToggleComplete={toggleCompleteMutation.mutate}
                    onDeleteTask={deleteTaskMutation.mutate}
                  />
                )}
                {currentView === "grouped" && (
                  <GroupedTaskList
                    tasks={tasks}
                    userId={userId}
                    isLoading={isLoading}
                    error={error}
                    onFocus={setFocusTask}
                    onUpdateTask={updateTaskMutation.mutate}
                    onToggleComplete={toggleCompleteMutation.mutate}
                    onDeleteTask={deleteTaskMutation.mutate}
                  />
                )}
                {currentView === "calendar" && (
                  <CalendarView
                    tasks={allTasks}
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
                    onFocus={setFocusTask}
                    onUpdateTask={updateTaskMutation.mutate}
                    onToggleComplete={toggleCompleteMutation.mutate}
                    onDeleteTask={deleteTaskMutation.mutate}
                  />
                )}
              </>
            )}
          </div>

          {/* Sidebar — Desktop */}
          {userId && (
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <ProgressCard userId={userId} />
              </div>
            </aside>
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
            <div className="w-12 h-12 rounded-2xl bg-action-secondary flex items-center justify-center mx-auto mb-4 shadow-md">
              <Loader2 className="w-6 h-6 text-action-primary animate-spin" />
            </div>
            <p className="text-sm text-content-secondary font-medium">
              Loading…
            </p>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
