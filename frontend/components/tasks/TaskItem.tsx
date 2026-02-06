"use client";

import { useState, memo, useCallback } from "react";
import {
  api,
  Task,
  UpdateTaskData,
  PriorityType,
  StatusType,
  Tag,
} from "@/lib/api";
import {
  Pencil,
  Trash2,
  Check,
  X,
  Calendar,
  Loader2,
  Focus,
  AlertTriangle,
} from "lucide-react";
import { StatusBadge, StatusSelect } from "./StatusBadge";
import { TagDisplay } from "./TagDisplay";
import { TagInput } from "./TagInput";

/* ── Priority visual mapping ─────────────────────────────── */
const priorityStyles: Record<
  string,
  { border: string; badge: string; label: string }
> = {
  critical: {
    border: "border-l-red-500",
    badge: "bg-state-error-light text-state-error",
    label: "Critical",
  },
  high: {
    border: "border-l-orange-400",
    badge: "bg-state-warning-light text-state-warning",
    label: "High",
  },
  medium: {
    border: "border-l-blue-400",
    badge: "bg-state-info-light text-state-info",
    label: "Medium",
  },
  low: {
    border: "border-l-slate-300 dark:border-l-slate-600",
    badge: "bg-surface-base text-content-tertiary",
    label: "Low",
  },
};

/* ── Delete confirmation dialog ──────────────────────────── */
function DeleteDialog({
  taskTitle,
  onConfirm,
  onCancel,
}: {
  taskTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-raised border border-border-subtle rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl animate-scale-in">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-state-error-light flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-state-error" />
          </div>
          <h3 className="text-base font-semibold text-content-primary">
            Delete task?
          </h3>
        </div>
        <p className="text-sm text-content-secondary mb-5 leading-relaxed">
          <span className="font-medium text-content-primary">
            &ldquo;{taskTitle}&rdquo;
          </span>{" "}
          will be permanently removed. This cannot be undone.
        </p>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="h-9 px-4 text-[13px] font-medium text-content-secondary bg-action-secondary hover:bg-action-secondary-hover rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="h-9 px-4 text-[13px] font-medium text-white bg-state-error hover:brightness-110 rounded-xl transition-all"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

interface TaskItemProps {
  task: Task;
  userId: string;
  /** React Query mutation: update a task */
  onUpdateTask: (variables: { taskId: number; data: UpdateTaskData }) => void;
  /** React Query mutation: toggle completion */
  onToggleComplete: (taskId: number) => void;
  /** React Query mutation: delete a task */
  onDeleteTask: (taskId: number) => void;
  /** Optional: enter focus mode */
  onFocus?: (task: Task) => void;
}

export const TaskItem = memo(function TaskItem({
  task,
  userId,
  onUpdateTask,
  onToggleComplete,
  onDeleteTask,
  onFocus,
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [dueDate, setDueDate] = useState(
    task.due_date ? new Date(task.due_date).toISOString().split("T")[0] : "",
  );
  const [priority, setPriority] = useState<PriorityType>(task.priority);
  const [status, setStatus] = useState<StatusType>(task.status);
  const [selectedTags, setSelectedTags] = useState<Tag[]>(task.tags || []);
  const [isSavingTags, setIsSavingTags] = useState(false);

  const handleToggleComplete = () => {
    onToggleComplete(task.id);
  };

  const handleSave = async () => {
    if (!title.trim()) return;

    // Update task fields via React Query
    onUpdateTask({
      taskId: task.id,
      data: {
        title,
        description: description || undefined,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        priority,
        status,
      },
    });

    // Update tags separately if changed (tags are a separate API endpoint)
    const currentTagIds = (task.tags || [])
      .map((t) => t.id)
      .sort()
      .join(",");
    const newTagIds = selectedTags
      .map((t) => t.id)
      .sort()
      .join(",");

    if (currentTagIds !== newTagIds) {
      setIsSavingTags(true);
      try {
        await api.updateTaskTags(
          userId,
          task.id,
          selectedTags.map((t) => t.id),
        );
      } catch (err) {
        console.error("Failed to update tags:", err);
      } finally {
        setIsSavingTags(false);
      }
    }

    setIsEditing(false);
  };

  const handleStatusChange = (newStatus: StatusType) => {
    onUpdateTask({
      taskId: task.id,
      data: { status: newStatus },
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTitle(task.title);
    setDescription(task.description || "");
    setDueDate(
      task.due_date ? new Date(task.due_date).toISOString().split("T")[0] : "",
    );
    setPriority(task.priority);
    setStatus(task.status);
    setSelectedTags(task.tags || []);
  };

  // Format date nicely
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Format due date
  const formatDueDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor(
      (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays < 0)
      return { text: `${Math.abs(diffDays)} days overdue`, isOverdue: true };
    if (diffDays === 0) return { text: "Due today", isOverdue: false };
    if (diffDays === 1) return { text: "Due tomorrow", isOverdue: false };
    if (diffDays < 7)
      return { text: `Due in ${diffDays} days`, isOverdue: false };
    return {
      text: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      isOverdue: false,
    };
  };

  // Get priority badge color
  const getPriorityStyle = (p: string) =>
    priorityStyles[p] || priorityStyles.low;

  const dueInfo = task.due_date ? formatDueDate(task.due_date) : null;
  const pStyle = getPriorityStyle(task.priority);

  // Delete confirmation state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = useCallback(() => {
    setShowDeleteDialog(true);
  }, []);

  const confirmDelete = useCallback(() => {
    onDeleteTask(task.id);
    setShowDeleteDialog(false);
  }, [onDeleteTask, task.id]);

  if (isEditing) {
    return (
      <div className="bg-surface-raised rounded-2xl p-4 border border-border-subtle shadow-sm animate-scale-in">
        <div className="space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full h-10 px-3.5 text-sm bg-surface-base border border-border-subtle rounded-xl focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-action-primary/10 transition-all"
            placeholder="Task title"
            autoFocus
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-surface-base border border-border-subtle rounded-xl focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-action-primary/10 resize-none transition-all"
            placeholder="Add a description (optional)"
            rows={2}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor={`priority-${task.id}`}
                className="block text-[11px] font-semibold text-content-tertiary uppercase tracking-wider mb-1.5"
              >
                Priority
              </label>
              <select
                id={`priority-${task.id}`}
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityType)}
                className="w-full h-10 px-3 text-sm bg-surface-base border border-border-subtle rounded-xl focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-action-primary/10 transition-all"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label
                htmlFor={`status-${task.id}`}
                className="block text-[11px] font-semibold text-content-tertiary uppercase tracking-wider mb-1.5"
              >
                Status
              </label>
              <select
                id={`status-${task.id}`}
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusType)}
                className="w-full h-10 px-3 text-sm bg-surface-base border border-border-subtle rounded-xl focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-action-primary/10 transition-all"
              >
                <option value="backlog">Backlog</option>
                <option value="in_progress">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label
                htmlFor={`dueDate-${task.id}`}
                className="block text-[11px] font-semibold text-content-tertiary uppercase tracking-wider mb-1.5"
              >
                Due Date
              </label>
              <input
                id={`dueDate-${task.id}`}
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-surface-base border border-border-subtle rounded-xl focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-action-primary/10 transition-all"
              />
            </div>
          </div>
          <TagInput
            userId={userId}
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
          />
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={isSavingTags || !title.trim()}
              className="flex items-center gap-1.5 h-9 px-4 text-[13px] font-medium text-content-inverse bg-action-primary hover:bg-action-primary-hover rounded-xl disabled:opacity-50 transition-colors shadow-sm"
            >
              {isSavingTags ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              Save
            </button>
            <button
              onClick={handleCancel}
              disabled={isSavingTags}
              className="flex items-center gap-1.5 h-9 px-4 text-[13px] font-medium text-content-secondary bg-action-secondary hover:bg-action-secondary-hover rounded-xl transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {showDeleteDialog && (
        <DeleteDialog
          taskTitle={task.title}
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteDialog(false)}
        />
      )}
      <div
        className={`bg-surface-raised rounded-2xl border border-border-subtle border-l-[3px] ${pStyle.border} group transition-all duration-200 hover:shadow-md hover:border-border-default hover:-translate-y-[1px] ${
          task.completed ? "opacity-60" : ""
        }`}
      >
        <div className="flex items-start gap-3 p-4">
          {/* Custom Checkbox */}
          <button
            onClick={handleToggleComplete}
            className={`
              relative flex-shrink-0 w-[22px] h-[22px] mt-0.5 rounded-lg border-2
              transition-all duration-200
              ${
                task.completed
                  ? "bg-state-success border-state-success scale-100"
                  : "border-border-default hover:border-action-primary hover:scale-110"
              }
            `}
            aria-label={
              task.completed ? "Mark as incomplete" : "Mark as complete"
            }
          >
            {task.completed && (
              <Check className="absolute inset-0 m-auto w-3.5 h-3.5 text-white animate-scale-in" />
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3
              className={`text-[15px] font-medium text-content-primary leading-snug transition-all ${
                task.completed ? "line-through text-content-tertiary" : ""
              }`}
            >
              {task.title}
            </h3>
            {task.description && (
              <p
                className={`text-[13px] mt-1 line-clamp-2 leading-relaxed ${
                  task.completed
                    ? "text-content-tertiary"
                    : "text-content-secondary"
                }`}
              >
                {task.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-content-tertiary" />
                <span className="text-[11px] text-content-tertiary">
                  {formatDate(task.created_at)}
                </span>
              </div>
              <StatusBadge status={task.status} showIcon={false} />
              <span
                className={`inline-flex items-center h-5 px-2 text-[11px] font-semibold rounded-lg ${pStyle.badge}`}
              >
                {pStyle.label}
              </span>
              {dueInfo && (
                <span
                  className={`inline-flex items-center h-5 px-2 text-[11px] font-semibold rounded-lg ${
                    dueInfo.isOverdue
                      ? "bg-state-error-light text-state-error"
                      : "bg-surface-base text-content-secondary"
                  }`}
                >
                  {dueInfo.text}
                </span>
              )}
            </div>
            {task.tags && task.tags.length > 0 && (
              <div className="mt-2.5">
                <TagDisplay tags={task.tags} readOnly className="mt-0.5" />
              </div>
            )}
          </div>

          {/* Actions — always visible on mobile, hover on desktop */}
          <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <StatusSelect
              status={task.status}
              onChange={handleStatusChange}
              className="hidden sm:block w-32 h-8 text-xs rounded-xl"
            />
            {onFocus && !task.completed && (
              <button
                onClick={() => onFocus(task)}
                className="p-2 rounded-xl text-content-tertiary hover:text-action-primary hover:bg-action-secondary transition-colors"
                aria-label="Focus on this task"
                title="Focus mode"
              >
                <Focus className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 rounded-xl text-content-tertiary hover:text-action-primary hover:bg-action-secondary transition-colors"
              aria-label="Edit task"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 rounded-xl text-content-tertiary hover:text-state-error hover:bg-state-error-light transition-colors"
              aria-label="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
});
