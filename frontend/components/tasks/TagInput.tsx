"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import { api, Tag } from "@/lib/api";
import { TagDisplay } from "./TagDisplay";
import { Plus } from "lucide-react";

interface TagInputProps {
  userId: string;
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  className?: string;
}

// Predefined color palette for new tags
const TAG_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
];

export function TagInput({ userId, selectedTags, onTagsChange, className = "" }: TagInputProps) {
  const [input, setInput] = useState("");
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [filteredTags, setFilteredTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Load all tags on mount
  useEffect(() => {
    const loadTags = async () => {
      try {
        const response = await api.getTags(userId);
        setAvailableTags(response.tags);
      } catch (err) {
        console.error("Failed to load tags:", err);
      }
    };
    loadTags();
  }, [userId]);

  // Filter tags based on input
  useEffect(() => {
    if (input.trim()) {
      const query = input.toLowerCase();
      const filtered = availableTags.filter(
        (tag) =>
          tag.name.toLowerCase().includes(query) &&
          !selectedTags.find((t) => t.id === tag.id)
      );
      setFilteredTags(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredTags([]);
      setShowSuggestions(false);
    }
  }, [input, availableTags, selectedTags]);

  const handleKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault();
      await createOrSelectTag(input.trim());
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const createOrSelectTag = async (tagName: string) => {
    setIsLoading(true);
    try {
      // Check if tag already exists in available tags
      const existingTag = availableTags.find(
        (tag) => tag.name.toLowerCase() === tagName.toLowerCase()
      );

      if (existingTag) {
        // Add existing tag if not already selected
        if (!selectedTags.find((t) => t.id === existingTag.id)) {
          onTagsChange([...selectedTags, existingTag]);
        }
      } else {
        // Create new tag with a color from the palette
        const colorIndex = availableTags.length % TAG_COLORS.length;
        const newTag = await api.createTag(userId, {
          name: tagName,
          color: TAG_COLORS[colorIndex],
        });
        setAvailableTags([...availableTags, newTag]);
        onTagsChange([...selectedTags, newTag]);
      }

      setInput("");
      setShowSuggestions(false);
    } catch (err) {
      console.error("Failed to create/select tag:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTag = (tag: Tag) => {
    onTagsChange([...selectedTags, tag]);
    setInput("");
    setShowSuggestions(false);
  };

  const handleRemoveTag = (tagId: number) => {
    onTagsChange(selectedTags.filter((t) => t.id !== tagId));
  };

  return (
    <div className={className}>
      <label htmlFor="tags" className="block text-[10px] font-medium text-content-tertiary mb-1">
        Tags
      </label>
      <div className="relative">
        <div className="flex items-center gap-2 w-full px-3 py-2 bg-surface-base border border-border-subtle rounded-lg focus-within:border-border-focus focus-within:ring-2 focus-within:ring-action-primary/10 transition-all">
          <Plus className="w-3.5 h-3.5 text-content-tertiary flex-shrink-0" />
          <input
            id="tags"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => input.trim() && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Add tag..."
            disabled={isLoading}
            className="flex-1 text-sm bg-transparent border-none focus:outline-none placeholder:text-content-tertiary"
            aria-label="Add tag"
          />
        </div>

        {/* Autocomplete suggestions */}
        {showSuggestions && filteredTags.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-surface-raised border border-border-subtle rounded-lg shadow-lg max-h-40 overflow-y-auto">
            {filteredTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleSelectTag(tag)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-action-secondary transition-colors flex items-center gap-2"
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                {tag.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected tags */}
      {selectedTags.length > 0 && (
        <div className="mt-2">
          <TagDisplay
            tags={selectedTags}
            onRemove={handleRemoveTag}
            readOnly={false}
          />
        </div>
      )}
    </div>
  );
}
