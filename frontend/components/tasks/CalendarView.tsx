"use client";

import { useState } from "react";
import { Task } from "@/lib/api";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarViewProps {
  tasks: Task[];
  userId: string;
  onDateClick: (date: Date) => void;
  onTaskClick: (task: Task) => void;
}

export function CalendarView({ tasks, userId, onDateClick, onTaskClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // Get tasks by date
  const tasksByDate = new Map<string, Task[]>();
  tasks.forEach((task) => {
    if (task.due_date) {
      const dateKey = new Date(task.due_date).toISOString().split('T')[0];
      if (!tasksByDate.has(dateKey)) {
        tasksByDate.set(dateKey, []);
      }
      tasksByDate.get(dateKey)!.push(task);
    }
  });

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Generate calendar days
  const calendarDays = [];

  // Empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push({ day: null, dateStr: null });
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateStr = date.toISOString().split('T')[0];
    calendarDays.push({ day, dateStr, date });
  }

  return (
    <div className="bg-surface-raised rounded-xl border border-border-subtle p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-content-primary">
          {monthNames[month]} {year}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={previousMonth}
            className="p-1.5 rounded-lg text-content-secondary hover:text-content-primary hover:bg-action-secondary transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 text-xs font-medium text-content-secondary hover:text-content-primary hover:bg-action-secondary rounded-lg transition-colors"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg text-content-secondary hover:text-content-primary hover:bg-action-secondary transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {dayNames.map((name) => (
          <div key={name} className="text-center text-[10px] font-medium text-content-tertiary uppercase">
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((item, index) => {
          if (!item.day) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const { day, dateStr, date } = item;
          const dayTasks = tasksByDate.get(dateStr!) || [];
          const isToday = dateStr === todayStr;
          const isPast = dateStr! < todayStr;
          const hasOverdue = isPast && dayTasks.some(t => !t.completed);

          return (
            <button
              key={dateStr}
              onClick={() => onDateClick(date!)}
              className={`aspect-square p-1 rounded-lg border transition-all hover:border-border-focus relative ${
                isToday
                  ? "border-action-primary bg-action-primary/5"
                  : hasOverdue
                  ? "border-state-error/30 bg-state-error/5"
                  : "border-border-subtle hover:bg-action-secondary"
              }`}
            >
              <div className="text-xs font-medium text-content-primary">{day}</div>
              {dayTasks.length > 0 && (
                <div className="flex flex-wrap gap-0.5 mt-1">
                  {dayTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTaskClick(task);
                      }}
                      className={`w-1.5 h-1.5 rounded-full ${
                        task.completed
                          ? "bg-state-success"
                          : isPast
                          ? "bg-state-error"
                          : task.priority === "critical"
                          ? "bg-red-500"
                          : task.priority === "high"
                          ? "bg-orange-500"
                          : "bg-blue-500"
                      }`}
                      title={task.title}
                    />
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-[8px] text-content-tertiary">+{dayTasks.length - 3}</div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-[10px] text-content-tertiary">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-state-error" />
          <span>Overdue</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span>Upcoming</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-state-success" />
          <span>Completed</span>
        </div>
      </div>
    </div>
  );
}
