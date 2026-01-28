"use client";

import { Task } from "@/lib/api";
import { TaskItem } from "./TaskItem";
import { Calendar, Clock, Inbox } from "lucide-react";

interface GroupedTaskListProps {
  tasks: Task[];
  userId: string;
  isLoading: boolean;
  error: string | null;
  onUpdate: (task: Task) => void;
  onDelete: (taskId: number) => void;
  onFocus?: (task: Task) => void;
}

interface TaskGroup {
  title: string;
  icon: typeof Calendar;
  color: string;
  tasks: Task[];
}

export function GroupedTaskList({ tasks, userId, isLoading, error, onUpdate, onDelete, onFocus }: GroupedTaskListProps) {
  // Loading state
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

  // Error state
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
    const pendingTasks = tasks.filter(t => t.status !== "done");

    pendingTasks.forEach((task) => {
      if (!task.due_date) {
        // No due date -> Someday
        somedayTasks.push(task);
      } else {
        const dueDate = new Date(task.due_date);
        const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

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
        tasks: todayTasks
      },
      {
        title: "Upcoming",
        icon: Calendar,
        color: "text-state-warning",
        tasks: upcomingTasks
      },
      {
        title: "Someday",
        icon: Inbox,
        color: "text-content-tertiary",
        tasks: somedayTasks
      }
    ];
  };

  const groups = groupTasks();

  return (
    <div className="space-y-6">
      {groups.map((group) => {
        const Icon = group.icon;

        if (group.tasks.length === 0) {
          return null;  // Hide empty groups
        }

        return (
          <div key={group.title} className="space-y-3">
            {/* Group Header */}
            <div className="flex items-center gap-2">
              <Icon className={`w-4 h-4 ${group.color}`} />
              <h3 className="text-sm font-semibold text-content-primary">
                {group.title}
              </h3>
              <span className="inline-flex items-center h-5 px-1.5 text-[10px] font-semibold rounded-full bg-surface-raised text-content-secondary">
                {group.tasks.length}
              </span>
            </div>

            {/* Group Tasks */}
            <div className="space-y-2">
              {group.tasks.map((task, index) => (
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
          </div>
        );
      })}

      {/* Empty state */}
      {groups.every(g => g.tasks.length === 0) && (
        <div className="bg-surface-raised rounded-xl p-8 border border-border-subtle text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-action-secondary flex items-center justify-center">
              <Inbox className="w-5 h-5 text-action-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-content-primary mb-1">All caught up!</h3>
              <p className="text-xs text-content-tertiary">No pending tasks to show</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
