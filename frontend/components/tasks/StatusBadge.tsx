"use client";

import { memo } from "react";
import { StatusType } from "@/lib/api";
import { Inbox, Clock, AlertCircle, CheckCircle2 } from "lucide-react";

interface StatusConfig {
  label: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}

const statusConfigs: Record<StatusType, StatusConfig> = {
  backlog: {
    label: "Backlog",
    color: "bg-slate-100 text-slate-700",
    icon: Inbox,
  },
  in_progress: {
    label: "In Progress",
    color: "bg-blue-100 text-blue-700",
    icon: Clock,
  },
  blocked: {
    label: "Blocked",
    color: "bg-red-100 text-red-700",
    icon: AlertCircle,
  },
  done: {
    label: "Done",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle2,
  },
};

interface StatusBadgeProps {
  status: StatusType;
  showIcon?: boolean;
  className?: string;
}

export const StatusBadge = memo(function StatusBadge({ status, showIcon = true, className = "" }: StatusBadgeProps) {
  const config = statusConfigs[status];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 h-4 px-1.5 text-[10px] font-medium rounded ${config.color} ${className}`}
    >
      {showIcon && <Icon className="w-3 h-3" />}
      {config.label}
    </span>
  );
});

interface StatusSelectProps {
  status: StatusType;
  onChange: (status: StatusType) => void;
  disabled?: boolean;
  className?: string;
}

export const StatusSelect = memo(function StatusSelect({ status, onChange, disabled = false, className = "" }: StatusSelectProps) {
  return (
    <select
      value={status}
      onChange={(e) => onChange(e.target.value as StatusType)}
      disabled={disabled}
      className={`h-9 px-2.5 text-sm bg-surface-base border border-border-subtle rounded-lg focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-action-primary/10 transition-all ${className}`}
      aria-label="Task status"
    >
      {Object.entries(statusConfigs).map(([key, config]) => (
        <option key={key} value={key}>
          {config.label}
        </option>
      ))}
    </select>
  );
});
