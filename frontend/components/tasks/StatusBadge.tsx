"use client";

import { memo } from "react";
import { StatusType } from "@/lib/api";
import { Inbox, Clock, AlertCircle, CheckCircle2 } from "lucide-react";

interface StatusConfig {
  label: string;
  bgClass: string;
  textClass: string;
  icon: React.ComponentType<{ className?: string }>;
}

const statusConfigs: Record<StatusType, StatusConfig> = {
  backlog: {
    label: "Backlog",
    bgClass: "bg-surface-base",
    textClass: "text-content-tertiary",
    icon: Inbox,
  },
  in_progress: {
    label: "In Progress",
    bgClass: "bg-state-info-light",
    textClass: "text-state-info",
    icon: Clock,
  },
  blocked: {
    label: "Blocked",
    bgClass: "bg-state-error-light",
    textClass: "text-state-error",
    icon: AlertCircle,
  },
  done: {
    label: "Done",
    bgClass: "bg-state-success-light",
    textClass: "text-state-success",
    icon: CheckCircle2,
  },
};

interface StatusBadgeProps {
  status: StatusType;
  showIcon?: boolean;
  className?: string;
}

export const StatusBadge = memo(function StatusBadge({
  status,
  showIcon = true,
  className = "",
}: StatusBadgeProps) {
  const config = statusConfigs[status];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 h-5 px-2 text-[11px] font-semibold rounded-lg ${config.bgClass} ${config.textClass} ${className}`}
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

export const StatusSelect = memo(function StatusSelect({
  status,
  onChange,
  disabled = false,
  className = "",
}: StatusSelectProps) {
  return (
    <select
      value={status}
      onChange={(e) => onChange(e.target.value as StatusType)}
      disabled={disabled}
      className={`h-9 px-2.5 text-sm bg-surface-base border border-border-subtle rounded-xl focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-action-primary/10 transition-all ${className}`}
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
