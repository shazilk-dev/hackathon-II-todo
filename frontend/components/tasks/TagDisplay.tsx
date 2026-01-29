"use client";

import { memo } from "react";
import { Tag } from "@/lib/api";
import { X } from "lucide-react";

interface TagDisplayProps {
  tags: Tag[];
  onRemove?: (tagId: number) => void;
  readOnly?: boolean;
  className?: string;
}

export const TagDisplay = memo(function TagDisplay({ tags, onRemove, readOnly = false, className = "" }: TagDisplayProps) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {tags.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex items-center gap-1 h-5 px-2 text-[10px] font-medium rounded-full"
          style={{
            backgroundColor: `${tag.color}20`,
            color: tag.color,
            border: `1px solid ${tag.color}40`
          }}
        >
          {tag.name}
          {!readOnly && onRemove && (
            <button
              onClick={() => onRemove(tag.id)}
              className="hover:opacity-70 transition-opacity"
              aria-label={`Remove ${tag.name} tag`}
              type="button"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </span>
      ))}
    </div>
  );
});
