"use client";

import { useState } from "react";
import { api, Task, PriorityType, StatusType, Tag } from "@/lib/api";
import { Pencil, Trash2, Check, X, Calendar, Loader2 } from "lucide-react";
import { StatusBadge, StatusSelect } from "./StatusBadge";
import { TagDisplay } from "./TagDisplay";
import { TagInput } from "./TagInput";

interface TaskItemProps {
  task: Task;
  userId: string;
  onUpdate: (task: Task) => void;
  onDelete: (taskId: number) => void;
}

export function TaskItem({ task, userId, onUpdate, onDelete }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [dueDate, setDueDate] = useState(
    task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : ""
  );
  const [priority, setPriority] = useState<PriorityType>(task.priority);
  const [status, setStatus] = useState<StatusType>(task.status);
  const [selectedTags, setSelectedTags] = useState<Tag[]>(task.tags || []);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleComplete = async () => {
    setIsLoading(true);
    try {
      const updated = await api.toggleComplete(userId, task.id);
      onUpdate(updated);
    } catch (err) {
      console.error("Failed to toggle completion:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return;

    setIsLoading(true);
    try {
      // Update task details
      const updated = await api.updateTask(userId, task.id, {
        title,
        description,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        priority,
        status
      });

      // Update tags if changed
      const currentTagIds = (task.tags || []).map(t => t.id).sort().join(',');
      const newTagIds = selectedTags.map(t => t.id).sort().join(',');

      if (currentTagIds !== newTagIds) {
        await api.updateTaskTags(userId, task.id, selectedTags.map(t => t.id));
        // Refresh task to get updated tags
        const refreshed = await api.getTask(userId, task.id);
        onUpdate(refreshed);
      } else {
        onUpdate(updated);
      }

      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update task:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: StatusType) => {
    setIsLoading(true);
    try {
      const updated = await api.changeStatus(userId, task.id, newStatus);
      onUpdate(updated);
    } catch (err) {
      console.error("Failed to change status:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    setIsLoading(true);
    try {
      await api.deleteTask(userId, task.id);
      onDelete(task.id);
    } catch (err) {
      console.error("Failed to delete task:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTitle(task.title);
    setDescription(task.description || "");
    setDueDate(task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : "");
    setPriority(task.priority);
    setStatus(task.status);
    setSelectedTags(task.tags || []);
  };

  // Format date nicely
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

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
    const diffDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: `${Math.abs(diffDays)} days overdue`, isOverdue: true };
    if (diffDays === 0) return { text: "Due today", isOverdue: false };
    if (diffDays === 1) return { text: "Due tomorrow", isOverdue: false };
    if (diffDays < 7) return { text: `Due in ${diffDays} days`, isOverdue: false };
    return { text: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }), isOverdue: false };
  };

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-700";
      case "high":
        return "bg-orange-100 text-orange-700";
      case "medium":
        return "bg-blue-100 text-blue-700";
      case "low":
        return "bg-slate-100 text-slate-600";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const dueInfo = task.due_date ? formatDueDate(task.due_date) : null;

  if (isEditing) {
    return (
      <div className="bg-surface-raised rounded-xl p-3 border border-border-subtle shadow-sm animate-scale-in">
        <div className="space-y-2.5">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full h-9 px-3 text-sm bg-surface-base border border-border-subtle rounded-lg focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-action-primary/10 transition-all"
            placeholder="Task title"
            autoFocus
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-surface-base border border-border-subtle rounded-lg focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-action-primary/10 resize-none transition-all"
            placeholder="Add a description (optional)"
            rows={2}
          />
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label htmlFor={`priority-${task.id}`} className="block text-[10px] font-medium text-content-tertiary mb-1">
                Priority
              </label>
              <select
                id={`priority-${task.id}`}
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityType)}
                className="w-full h-9 px-2.5 text-sm bg-surface-base border border-border-subtle rounded-lg focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-action-primary/10 transition-all"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label htmlFor={`status-${task.id}`} className="block text-[10px] font-medium text-content-tertiary mb-1">
                Status
              </label>
              <select
                id={`status-${task.id}`}
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusType)}
                className="w-full h-9 px-2.5 text-sm bg-surface-base border border-border-subtle rounded-lg focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-action-primary/10 transition-all"
              >
                <option value="backlog">Backlog</option>
                <option value="in_progress">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label htmlFor={`dueDate-${task.id}`} className="block text-[10px] font-medium text-content-tertiary mb-1">
                Due Date
              </label>
              <input
                id={`dueDate-${task.id}`}
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-9 px-2.5 text-sm bg-surface-base border border-border-subtle rounded-lg focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-action-primary/10 transition-all"
              />
            </div>
          </div>
          <TagInput
            userId={userId}
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isLoading || !title.trim()}
              className="flex items-center gap-1.5 h-7 px-3 text-xs font-medium text-content-inverse bg-action-primary hover:bg-action-primary-hover rounded-full disabled:opacity-50 transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Check className="w-3 h-3" />
              )}
              Save
            </button>
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="flex items-center gap-1.5 h-7 px-3 text-xs font-medium text-content-secondary bg-action-secondary hover:bg-action-secondary-hover rounded-full transition-colors"
            >
              <X className="w-3 h-3" />
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-surface-raised rounded-xl p-3 border border-border-subtle group transition-all duration-200 hover:shadow-md hover:border-border-default ${
        task.completed ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Custom Checkbox */}
        <button
          onClick={handleToggleComplete}
          disabled={isLoading}
          className={`
            relative flex-shrink-0 w-5 h-5 mt-0.5 rounded border-2
            transition-all duration-200
            ${task.completed
              ? "bg-state-success border-state-success"
              : "border-border-default hover:border-action-primary"
            }
            ${isLoading ? "opacity-50" : ""}
          `}
          aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
        >
          {task.completed && (
            <Check className="absolute inset-0 m-auto w-3 h-3 text-white" />
          )}
          {isLoading && !task.completed && (
            <Loader2 className="absolute inset-0 m-auto w-3 h-3 animate-spin text-action-primary" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3
            className={`text-sm font-medium text-content-primary transition-all ${
              task.completed ? "line-through text-content-tertiary" : ""
            }`}
          >
            {task.title}
          </h3>
          {task.description && (
            <p
              className={`text-xs mt-0.5 line-clamp-2 ${
                task.completed ? "text-content-tertiary" : "text-content-secondary"
              }`}
            >
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-content-tertiary" />
              <span className="text-[10px] text-content-tertiary">
                {formatDate(task.created_at)}
              </span>
            </div>
            <StatusBadge status={task.status} showIcon={false} />
            <span className={`inline-flex items-center h-4 px-1.5 text-[10px] font-medium rounded ${getPriorityColor(task.priority)}`}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </span>
            {dueInfo && (
              <span className={`inline-flex items-center h-4 px-1.5 text-[10px] font-medium rounded ${
                dueInfo.isOverdue
                  ? "bg-red-100 text-red-700"
                  : "bg-slate-100 text-slate-600"
              }`}>
                {dueInfo.text}
              </span>
            )}
          </div>
          {task.tags && task.tags.length > 0 && (
            <div className="mt-2">
              <TagDisplay tags={task.tags} readOnly className="mt-1" />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <StatusSelect
            status={task.status}
            onChange={handleStatusChange}
            disabled={isLoading}
            className="w-32 h-7 text-xs"
          />
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 rounded-lg text-content-tertiary hover:text-action-primary hover:bg-action-secondary transition-colors"
            aria-label="Edit task"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-content-tertiary hover:text-state-error hover:bg-state-error-light transition-colors disabled:opacity-50"
            aria-label="Delete task"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
