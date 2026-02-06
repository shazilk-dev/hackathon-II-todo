"use client";

import { List, Calendar, LayoutGrid, Layers } from "lucide-react";

export type ViewType = "list" | "calendar" | "kanban" | "grouped";

interface ViewSwitcherProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function ViewSwitcher({ currentView, onViewChange }: ViewSwitcherProps) {
  const views: { type: ViewType; icon: typeof List; label: string }[] = [
    { type: "list", icon: List, label: "List" },
    { type: "grouped", icon: Layers, label: "Grouped" },
    { type: "calendar", icon: Calendar, label: "Calendar" },
    { type: "kanban", icon: LayoutGrid, label: "Kanban" },
  ];

  return (
    <div className="flex items-center gap-1 bg-surface-raised border border-border-subtle rounded-2xl p-1 shadow-sm">
      {views.map(({ type, icon: Icon, label }) => (
        <button
          key={type}
          onClick={() => onViewChange(type)}
          className={`flex items-center gap-2 px-3.5 h-9 text-[13px] font-medium rounded-xl transition-all duration-200 ${
            currentView === type
              ? "bg-action-primary text-content-inverse shadow-md"
              : "text-content-secondary hover:text-content-primary hover:bg-action-secondary"
          }`}
          aria-label={`${label} view`}
          aria-current={currentView === type ? "page" : undefined}
        >
          <Icon className="w-4 h-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
