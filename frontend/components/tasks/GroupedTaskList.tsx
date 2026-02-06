"use client";

import { Task, UpdateTaskData } from "@/lib/api";
import { TaskItem } from "./TaskItem";
import { Calendar, Clock, Inbox, CheckCircle2 } from "lucide-react";

interface GroupedTaskListProps {
  tasks: Task[];
  userId: string;
  isLoading: boolean;
  error: Error | null;
  onFocus?: (task: Task) => void;
  onUpdateTask: (variables: { taskId: number; data: UpdateTaskData }) => void;
  onToggleComplete: (taskId: number) => void;
  onDeleteTask: (taskId: number) => void;
}

interface TaskGroup {
  title: string;
  icon: typeof Calendar;
  color: string;
  tasks: Task[];
}

export function GroupedTaskList({
  tasks,
  userId,
  isLoading,
  error,
  onFocus,
  onUpdateTask,
  onToggleComplete,
  onDeleteTask,
}: GroupedTaskListProps) {
  // Loading state
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
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
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

  // Group tasks by time periods
  const groupTasks = (): TaskGroup[] => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    const todayTasks: Task[] = [];
    const upcomingTasks: Task[] = [];
    const somedayTasks: Task[] = [];

    // Filter out completed tasks
    const pendingTasks = tasks.filter((t) => t.status !== "done");

    pendingTasks.forEach((task) => {
      if (!task.due_date) {
        // No due date -> Someday
        somedayTasks.push(task);
      } else {
        const dueDate = new Date(task.due_date);
        const dueDateOnly = new Date(
          dueDate.getFullYear(),
          dueDate.getMonth(),
          dueDate.getDate(),
        );

        if (dueDateOnly <= today) {
          // Due today or overdue -> Today
          todayTasks.push(task);
        } else if (dueDateOnly < weekFromNow) {
          // Due within next 7 days -> Upcoming
          upcomingTasks.push(task);
        } else {
          // Due later -> Someday
          somedayTasks.push(task);
        }
      }
    });

    return [
      {
        title: "Today",
        icon: Clock,
        color: "text-state-error",
        tasks: todayTasks,
      },
      {
        title: "Upcoming",
        icon: Calendar,
        color: "text-state-warning",
        tasks: upcomingTasks,
      },
      {
        title: "Someday",
        icon: Inbox,
        color: "text-content-tertiary",
        tasks: somedayTasks,
      },
    ];
  };

  const groups = groupTasks();

  return (
    <div className="space-y-8">
      {groups.map((group) => {
        const Icon = group.icon;

        if (group.tasks.length === 0) {
          return null; // Hide empty groups
        }

        return (
          <div key={group.title} className="space-y-3">
            {/* Group Header */}
            <div className="flex items-center gap-2.5">
              <Icon className={`w-4 h-4 ${group.color}`} />
              <h3 className="text-[15px] font-semibold text-content-primary">
                {group.title}
              </h3>
              <span className="inline-flex items-center h-5 px-2 text-[11px] font-semibold rounded-lg bg-surface-raised text-content-secondary">
                {group.tasks.length}
              </span>
            </div>

            {/* Group Tasks */}
            <div className="space-y-3">
              {group.tasks.map((task, index) => (
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
          </div>
        );
      })}

      {/* Empty state */}
      {groups.every((g) => g.tasks.length === 0) && (
        <div className="bg-surface-raised rounded-2xl py-16 px-6 border border-border-subtle text-center">
          <div className="flex flex-col items-center gap-4 max-w-xs mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-state-success-light flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-7 h-7 text-state-success" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-content-primary mb-1.5">
                All caught up!
              </h3>
              <p className="text-[13px] text-content-tertiary leading-relaxed">
                No pending tasks to show. Time to relax or plan ahead.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
