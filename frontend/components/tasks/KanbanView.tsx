"use client";

import { useState } from "react";
import { Task, StatusType } from "@/lib/api";
import { Inbox, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { TaskItem } from "./TaskItem";

interface KanbanViewProps {
  tasks: Task[];
  userId: string;
  onStatusChange: (taskId: number, newStatus: StatusType) => void;
  onUpdate: (task: Task) => void;
  onDelete: (taskId: number) => void;
  onFocus?: (task: Task) => void;
}

interface Column {
  status: StatusType;
  title: string;
  icon: typeof Inbox;
  color: string;
}

const columns: Column[] = [
  { status: "backlog", title: "Backlog", icon: Inbox, color: "bg-slate-100 text-slate-700" },
  { status: "in_progress", title: "In Progress", icon: Clock, color: "bg-blue-100 text-blue-700" },
  { status: "blocked", title: "Blocked", icon: AlertCircle, color: "bg-red-100 text-red-700" },
  { status: "done", title: "Done", icon: CheckCircle2, color: "bg-green-100 text-green-700" },
];

export function KanbanView({ tasks, userId, onStatusChange, onUpdate, onDelete, onFocus }: KanbanViewProps) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<StatusType | null>(null);

  // Group tasks by status
  const tasksByStatus: Record<StatusType, Task[]> = {
    backlog: [],
    in_progress: [],
    blocked: [],
    done: [],
  };

  tasks.forEach((task) => {
    tasksByStatus[task.status].push(task);
  });

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, status: StatusType) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, newStatus: StatusType) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (draggedTask && draggedTask.status !== newStatus) {
      onStatusChange(draggedTask.id, newStatus);
    }
    setDraggedTask(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((column) => {
        const Icon = column.icon;
        const columnTasks = tasksByStatus[column.status];
        const isDragOver = dragOverColumn === column.status;

        return (
          <div
            key={column.status}
            className={`flex flex-col bg-surface-raised rounded-xl border transition-all ${
              isDragOver ? "border-action-primary bg-action-primary/5" : "border-border-subtle"
            }`}
            onDragOver={(e) => handleDragOver(e, column.status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.status)}
          >
            {/* Column header */}
            <div className="p-3 border-b border-border-subtle">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-content-secondary" />
                  <h3 className="text-sm font-semibold text-content-primary">{column.title}</h3>
                </div>
                <span className={`inline-flex items-center h-5 px-1.5 text-[10px] font-medium rounded ${column.color}`}>
                  {columnTasks.length}
                </span>
              </div>
            </div>

            {/* Column tasks */}
            <div className="flex-1 p-3 space-y-2 overflow-y-auto min-h-[200px]">
              {columnTasks.length === 0 ? (
                <div className="flex items-center justify-center h-full text-xs text-content-tertiary">
                  Drop tasks here
                </div>
              ) : (
                columnTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                    className={`cursor-move transition-opacity ${
                      draggedTask?.id === task.id ? "opacity-50" : "opacity-100"
                    }`}
                  >
                    <TaskItem
                      task={task}
                      userId={userId}
                      onUpdate={onUpdate}
                      onDelete={onDelete}
                      onFocus={onFocus}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
