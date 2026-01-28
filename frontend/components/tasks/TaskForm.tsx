"use client";

import { useState, FormEvent } from "react";
import { api, Task, PriorityType, StatusType, Tag } from "@/lib/api";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import { TagInput } from "./TagInput";

interface TaskFormProps {
  userId: string;
  onTaskCreated: (task: Task) => void;
}

export function TaskForm({ userId, onTaskCreated }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<PriorityType>("medium");
  const [status, setStatus] = useState<StatusType>("backlog");
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const task = await api.createTask(userId, {
        title: title.trim(),
        description: description.trim() || undefined,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        priority: priority,
        status: status
      });

      // Add tags if any selected
      if (selectedTags.length > 0) {
        await api.updateTaskTags(userId, task.id, selectedTags.map(t => t.id));
        // Refresh task to get tags
        const updatedTask = await api.getTask(userId, task.id);
        onTaskCreated(updatedTask);
      } else {
        onTaskCreated(task);
      }

      setTitle("");
      setDescription("");
      setDueDate("");
      setPriority("medium");
      setStatus("backlog");
      setSelectedTags([]);
      setIsExpanded(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setIsLoading(false);
    }
  };

  const characterCount = title.length;
  const maxCharacters = 200;

  return (
    <form onSubmit={handleSubmit} className="bg-surface-raised rounded-xl p-3 border border-border-subtle shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="text-sm font-semibold text-content-primary">
          Create Task
        </h2>
        <span className={`text-[10px] ${
          characterCount > maxCharacters * 0.9
            ? "text-state-warning"
            : "text-content-tertiary"
        }`}>
          {characterCount}/{maxCharacters}
        </span>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-2.5 p-2 rounded-lg bg-state-error-light border border-state-error/20 flex items-center gap-2 animate-slide-down">
          <AlertCircle className="w-3.5 h-3.5 text-state-error flex-shrink-0" />
          <p className="text-xs text-state-error">{error}</p>
        </div>
      )}

      {/* Title Input */}
      <div className="relative">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setIsExpanded(true)}
          placeholder="What do you need to do?"
          className="w-full h-9 px-3 pr-9 text-sm bg-surface-base border border-border-subtle rounded-lg focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-action-primary/10 transition-all placeholder:text-content-tertiary"
          required
          maxLength={maxCharacters}
          aria-label="Task title"
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
          <Plus className="w-4 h-4 text-content-tertiary" />
        </div>
      </div>

      {/* Expanded Form */}
      <div className={`overflow-hidden transition-all duration-300 ${
        isExpanded ? "max-h-[400px] opacity-100 mt-2.5" : "max-h-0 opacity-0"
      }`}>
        <div className="space-y-2.5">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description (optional)"
            className="w-full px-3 py-2 text-sm bg-surface-base border border-border-subtle rounded-lg focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-action-primary/10 resize-none transition-all placeholder:text-content-tertiary"
            rows={2}
            aria-label="Task description"
          />
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label htmlFor="priority" className="block text-[10px] font-medium text-content-tertiary mb-1">
                Priority
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityType)}
                className="w-full h-9 px-2.5 text-sm bg-surface-base border border-border-subtle rounded-lg focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-action-primary/10 transition-all"
                aria-label="Task priority"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-[10px] font-medium text-content-tertiary mb-1">
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusType)}
                className="w-full h-9 px-2.5 text-sm bg-surface-base border border-border-subtle rounded-lg focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-action-primary/10 transition-all"
                aria-label="Task status"
              >
                <option value="backlog">Backlog</option>
                <option value="in_progress">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label htmlFor="dueDate" className="block text-[10px] font-medium text-content-tertiary mb-1">
                Due Date
              </label>
              <input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-9 px-2.5 text-sm bg-surface-base border border-border-subtle rounded-lg focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-action-primary/10 transition-all"
                aria-label="Task due date"
              />
            </div>
          </div>
          <TagInput
            userId={userId}
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className={`flex items-center justify-between transition-all duration-300 ${
        isExpanded ? "mt-2.5" : "mt-2.5"
      }`}>
        {isExpanded && (
          <button
            type="button"
            onClick={() => {
              setIsExpanded(false);
              setDescription("");
            }}
            className="text-xs text-content-tertiary hover:text-content-secondary transition-colors"
          >
            Collapse
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading || !title.trim()}
          className={`flex items-center justify-center gap-1.5 h-8 px-4 text-xs font-medium text-content-inverse bg-action-primary hover:bg-action-primary-hover rounded-full disabled:opacity-50 transition-all ${isExpanded ? "" : "w-full"}`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              Add Task
            </>
          )}
        </button>
      </div>
    </form>
  );
}
