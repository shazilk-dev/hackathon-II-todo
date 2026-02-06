# Feature Specification: Task Priorities & Tags

**Feature Branch**: `002-priorities-tags`
**Created**: 2026-02-03
**Status**: Draft
**Input**: User description: "Feature: Task Priorities & Tags

Description:
Add priority levels (High, Medium, Low) and tags/categories to tasks for better
organization and filtering.

Acceptance Criteria:
1. Tasks have priority field (enum: HIGH, MEDIUM, LOW, default: MEDIUM)
2. Tasks can have multiple tags (many-to-many relationship)
3. Users can create custom tags
4. UI displays priority with visual indicators (colors/icons)
5. Tags shown as chips in task cards
6. MCP tools updated to support priority and tags parameters

Technical Approach:
- Add priority field to Task model (enum)
- Create Tag model with many-to-many relationship (TaskTag join table)
- Update MCP tools: add_task, update_task to accept priority and tags
- Frontend: Priority dropdown, Tag multi-select component
- Database migration for new fields and tables"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Assign Priority to Task (Priority: P1)

A user wants to mark tasks as high, medium, or low priority to visually distinguish urgent tasks from routine ones. When creating or editing a task, they can select a priority level, and the task list displays priority with color-coded indicators.

**Why this priority**: Priority is the most fundamental organizational feature that delivers immediate value. Users can quickly identify which tasks need attention first. This works independently without tags and provides a complete MVP for task prioritization.

**Independent Test**: Can be fully tested by creating a task, selecting a priority level (high/medium/low), and verifying the task displays with the correct priority indicator (color or icon) in the task list. Delivers value of visual task prioritization.

**Acceptance Scenarios**:

1. **Given** a user is creating a new task, **When** they select "High Priority" from the priority dropdown, **Then** the task is created with high priority and displays with a red indicator
2. **Given** a user has an existing task with medium priority, **When** they edit the task and change priority to "Low", **Then** the task updates and displays with a green/gray indicator
3. **Given** a user views their task list, **When** tasks have different priorities, **Then** high priority tasks are visually distinct (e.g., red color/icon), medium priority tasks use neutral colors (yellow/blue), and low priority tasks use subtle colors (green/gray)
4. **Given** a user creates a task without selecting priority, **When** the task is saved, **Then** it defaults to "Medium" priority
5. **Given** a user has tasks with various priorities, **When** they view the list, **Then** they can quickly scan and identify urgent tasks by their color indicators

---

### User Story 2 - Create and Apply Tags to Tasks (Priority: P1)

A user wants to categorize tasks using custom tags (e.g., "Work", "Personal", "Urgent", "Shopping"). They can create new tags with custom names and colors, then apply multiple tags to any task for flexible categorization.

**Why this priority**: Tags provide essential categorization that complements priorities. This is independently valuable and delivers the core tagging MVP - users can organize tasks into meaningful categories immediately.

**Independent Test**: Can be fully tested by creating a custom tag (e.g., "Work" with blue color), applying it to a task, and verifying the tag appears as a colored chip on the task card. Delivers value of task categorization.

**Acceptance Scenarios**:

1. **Given** a user is creating a task, **When** they click "Add Tag" and type a new tag name "Work" and select blue color, **Then** a new tag is created and applied to the task
2. **Given** a user has existing tags, **When** they create/edit a task and select multiple tags from the list, **Then** all selected tags appear as colored chips on the task card
3. **Given** a user creates a tag "Personal" with green color, **When** they view any task with that tag, **Then** the tag chip displays with the green background color
4. **Given** a user has no tags created yet, **When** they try to add tags to a task, **Then** they see an option to create their first tag with name and color picker
5. **Given** a user wants to apply the same tag to multiple tasks, **When** they select an existing tag, **Then** the tag appears in all tagged tasks consistently

---

### User Story 3 - Filter Tasks by Priority (Priority: P2)

A user wants to filter their task list to show only high-priority tasks, or view tasks grouped by priority level, to focus on what's most important.

**Why this priority**: Filtering by priority builds on the basic priority assignment (P1) and provides actionable value. Users can focus their attention efficiently. Can be developed and tested independently after priority assignment works.

**Independent Test**: Can be fully tested by creating tasks with different priorities, clicking a "High Priority" filter button, and verifying only high-priority tasks are displayed. Delivers value of focused task viewing.

**Acceptance Scenarios**:

1. **Given** a user has tasks with mixed priorities (high, medium, low), **When** they click "High Priority" filter, **Then** only high-priority tasks are displayed in the list
2. **Given** a user has applied a priority filter, **When** they click "All Tasks" or "Clear Filter", **Then** all tasks are displayed regardless of priority
3. **Given** a user has tasks with multiple priorities, **When** they apply a "Medium Priority" filter, **Then** only medium-priority tasks are shown and the filter UI indicates it's active
4. **Given** a user applies a priority filter to an empty result set, **When** no tasks match, **Then** they see a helpful message like "No high-priority tasks" with an option to clear the filter

---

### User Story 4 - Filter Tasks by Tags (Priority: P2)

A user wants to filter their task list to show only tasks with specific tags (e.g., show only "Work" tasks, or tasks tagged "Urgent"). They can select one or more tags to filter, enabling flexible task viewing.

**Why this priority**: Tag filtering builds on the basic tag assignment (P1) and provides powerful organization capabilities. Users can view tasks by category or context. Can be developed independently after tag creation works.

**Independent Test**: Can be fully tested by creating tasks with different tags, selecting a tag filter (e.g., "Work"), and verifying only tasks with that tag are displayed. Delivers value of context-based task viewing.

**Acceptance Scenarios**:

1. **Given** a user has tasks with different tags, **When** they click on a tag chip or select a tag from a filter menu, **Then** only tasks containing that tag are displayed
2. **Given** a user has applied a tag filter, **When** they select additional tags, **Then** tasks matching ANY of the selected tags are shown (OR logic)
3. **Given** a user has active tag filters, **When** they click "Clear Filters", **Then** all tasks are displayed and tag filters are reset
4. **Given** a user filters by a tag with no matching tasks, **When** the empty state appears, **Then** they see a message like "No tasks tagged with 'Work'" with an option to clear the filter
5. **Given** a user has both priority and tag filters active, **When** they view the list, **Then** tasks must match both filters (AND logic between filter types)

---

### User Story 5 - Manage Tags (Edit/Delete) (Priority: P3)

A user wants to rename tags, change tag colors, or delete tags they no longer need. When a tag is updated, all tasks using that tag reflect the changes. When a tag is deleted, it's removed from all tasks.

**Why this priority**: Tag management is important for long-term organization but not critical for initial value delivery. Users can create and use tags before needing to manage them. This can be added after core tag functionality works.

**Independent Test**: Can be fully tested by creating a tag, editing its name or color, and verifying all tasks show the updated tag. Then deleting the tag and verifying it's removed from all tasks. Delivers value of tag lifecycle management.

**Acceptance Scenarios**:

1. **Given** a user has a tag "Wrk" applied to multiple tasks, **When** they edit the tag name to "Work", **Then** all tasks show the updated tag name "Work"
2. **Given** a user has a tag with blue color, **When** they change the tag color to red, **Then** all task cards display the tag chip with the new red background
3. **Given** a user wants to delete a tag, **When** they confirm deletion, **Then** the tag is removed from all tasks and no longer appears in the tag list
4. **Given** a user deletes a tag that was applied to 10 tasks, **When** they view those tasks, **Then** the deleted tag is not shown on any task card
5. **Given** a user tries to create a duplicate tag name, **When** they attempt to save, **Then** they see a validation error indicating the tag name already exists

---

### User Story 6 - Combine Priority and Tags for Advanced Organization (Priority: P3)

A user wants to use both priorities and tags together for sophisticated task organization (e.g., "High priority Work tasks" or "Personal tasks with Low priority"). The system supports filtering and visual display of both attributes simultaneously.

**Why this priority**: This is an advanced use case that emerges after users adopt both priorities and tags. It provides power-user value but isn't needed for basic functionality. Can be implemented after both core features work independently.

**Independent Test**: Can be fully tested by creating a task with high priority and "Work" tag, applying filters for both attributes, and verifying the task appears in the filtered results. Delivers value of advanced task organization.

**Acceptance Scenarios**:

1. **Given** a user has tasks with various priority-tag combinations, **When** they filter by "High Priority" AND "Work" tag, **Then** only tasks matching both criteria are displayed
2. **Given** a user views a task card, **When** the task has both priority and multiple tags, **Then** the priority indicator and all tag chips are clearly visible without visual clutter
3. **Given** a user creates a high-priority task with 3 tags, **When** they view it in the list, **Then** both the priority color indicator and all tag chips are displayed in a clean, organized layout
4. **Given** a user sorts their tasks, **When** they choose to sort by priority, **Then** high-priority tasks appear first regardless of tags, with secondary sorting by creation date

---

### Edge Cases

- What happens when a user tries to create a tag with an empty name or only whitespace?
- How does the system handle very long tag names (50+ characters) in the task card display?
- What happens when a user applies 10+ tags to a single task - how are they displayed?
- How does the system prevent duplicate tag names for the same user (case-insensitive)?
- What happens when a user changes a tag color while multiple tasks are using it?
- How does the system handle tag deletion when the tag is applied to hundreds of tasks?
- What happens if a user tries to apply the same tag multiple times to one task?
- How are tags displayed on mobile devices with limited screen width?
- What happens when filtering by tags that no tasks currently have?
- How does the system handle special characters in tag names (e.g., #, @, emoji)?

## Requirements *(mandatory)*

### Functional Requirements

**Priority Management:**

- **FR-001**: System MUST allow users to assign a priority level to any task (options: Low, Medium, High, Critical)
- **FR-002**: System MUST default new tasks to "Medium" priority if no priority is explicitly selected
- **FR-003**: System MUST display priority using visual indicators (colors, icons, or badges) in the task list and detail views
- **FR-004**: System MUST allow users to change a task's priority at any time through task editing
- **FR-005**: System MUST use consistent color coding for priorities across all views (e.g., Critical=Red, High=Orange, Medium=Blue, Low=Green/Gray)
- **FR-006**: System MUST preserve task priority when tasks are updated or edited

**Tag Management:**

- **FR-007**: System MUST allow users to create custom tags with a name (1-50 characters) and color (hex format)
- **FR-008**: System MUST enforce unique tag names per user (case-insensitive)
- **FR-009**: System MUST allow users to apply multiple tags to a single task
- **FR-010**: System MUST display tags as colored chips/badges on task cards with the tag name and background color
- **FR-011**: System MUST allow users to edit tag names and colors after creation
- **FR-012**: System MUST allow users to delete tags, which removes them from all tasks
- **FR-013**: System MUST update all tasks automatically when a tag name or color is changed
- **FR-014**: System MUST prevent creation of tags with empty or whitespace-only names
- **FR-015**: System MUST support tag names with letters, numbers, spaces, and common punctuation (hyphens, underscores)

**Tag-Task Association:**

- **FR-016**: System MUST prevent duplicate tag assignments (same tag cannot be applied twice to one task)
- **FR-017**: System MUST allow users to remove tags from individual tasks without deleting the tag entirely
- **FR-018**: System MUST maintain tag associations when tasks are edited
- **FR-019**: System MUST display all tags assigned to a task in the task detail view
- **FR-020**: System MUST handle tasks with no tags gracefully (no error, empty tags section)

**Filtering and Organization:**

- **FR-021**: System MUST allow users to filter tasks by priority level (show only Critical, High, Medium, or Low tasks)
- **FR-022**: System MUST allow users to filter tasks by one or more tags
- **FR-023**: System MUST support multi-tag filtering with OR logic (show tasks with tag A OR tag B)
- **FR-024**: System MUST support combined priority and tag filtering with AND logic (tasks must match priority AND tag criteria)
- **FR-025**: System MUST provide a "Clear All Filters" option to reset to unfiltered task view
- **FR-026**: System MUST indicate active filters clearly in the UI (e.g., filter chips, highlighted buttons)
- **FR-027**: System MUST show helpful messages when filters return no results (e.g., "No high-priority tasks found")

**User Data Isolation:**

- **FR-028**: System MUST ensure tags are scoped to individual users (user A's "Work" tag is separate from user B's "Work" tag)
- **FR-029**: System MUST prevent users from viewing or modifying other users' tags
- **FR-030**: System MUST only show a user's own tags in tag selection dropdowns and filters

**Integration Requirements:**

- **FR-031**: System MUST expose priority field in all task creation and update operations
- **FR-032**: System MUST expose tag operations (create, update, delete, list) through appropriate interfaces
- **FR-033**: System MUST include priority and tag information in task list and detail responses
- **FR-034**: System MUST validate priority values against allowed options (Low, Medium, High, Critical)

### Key Entities

- **Task (Extended)**: Existing task entity with priority field
  - New attribute: `priority` (enum: Low, Medium, High, Critical with default Medium)
  - Relationship: Many-to-many with Tags through TaskTag junction
  - Existing attributes: title, description, completion status, due date, user ownership

- **Tag**: User-created category for organizing tasks
  - Attributes: unique name (per user), color (hex format), creation timestamp, user ownership
  - Relationship: Many-to-many with Tasks (one tag can be applied to many tasks, one task can have many tags)
  - Scope: Each user has their own isolated set of tags

- **TaskTag (Association)**: Junction entity linking tasks and tags
  - Attributes: task reference, tag reference, creation timestamp
  - Purpose: Manages many-to-many relationship between tasks and tags
  - Behavior: Deleting a tag removes all TaskTag associations; deleting a task removes its TaskTag associations

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can assign a priority to a task in under 10 seconds (2 clicks: edit task, select priority)
- **SC-002**: Users can create and apply a new tag to a task in under 20 seconds without documentation
- **SC-003**: Priority visual indicators are distinct and recognizable at a glance (users can identify high-priority tasks in under 2 seconds when scanning a list of 20+ tasks)
- **SC-004**: Tag chips display clearly on task cards without overwhelming the task title (maximum 5 tags displayed inline, with "show more" for additional tags)
- **SC-005**: Users can filter a list of 100+ tasks by priority or tag in under 3 seconds with results appearing instantly
- **SC-006**: 90% of users successfully use priorities and tags for task organization within their first session without support
- **SC-007**: System supports at least 50 custom tags per user without performance degradation
- **SC-008**: Tag color changes propagate to all affected tasks within 1 second (user sees immediate feedback)
- **SC-009**: Zero duplicate tags created even when multiple users create tags simultaneously (tag uniqueness enforced)
- **SC-010**: Users report improved task organization satisfaction by at least 40% (measured via surveys before/after feature adoption)
- **SC-011**: Tag deletion removes tags from all associated tasks with zero data inconsistencies
- **SC-012**: Combined priority and tag filters produce accurate results 100% of the time (no false positives or missing tasks)

## Assumptions

- Users are familiar with priority concepts (low, medium, high urgency)
- Users understand the concept of tags/labels for categorization (similar to email labels, folder tags, etc.)
- The system already has task creation and editing capabilities
- Visual design of priority indicators (colors, icons) follows accessibility guidelines (sufficient contrast, not color-only indicators)
- Tag colors are selected from a predefined palette or validated for accessibility
- Users will create a reasonable number of tags (typically 5-20) rather than hundreds
- Tag names are primarily in Latin alphabet, though system supports Unicode
- Filtering is client-side for better performance with typical task volumes (under 1000 tasks per user)
- Priority levels are fixed and not customizable (users cannot add "Extreme" or rename "High")
- Tag-to-tag relationships are not needed (no nested tags or tag hierarchies)

## Dependencies

- Existing task model and CRUD operations
- User authentication and data isolation mechanisms
- Task list UI component for displaying tasks
- Task creation/editing forms

## Out of Scope

- Custom priority levels (users cannot add "Extreme" priority or rename existing levels)
- Nested or hierarchical tags (e.g., "Work > Project A > Phase 1")
- Tag suggestions or auto-tagging based on task content
- Tag analytics or usage statistics (e.g., "most used tags", "tag productivity insights")
- Bulk tag operations (applying/removing tags from multiple tasks at once)
- Tag templates or sharing tags between users
- Smart filters or saved filter combinations
- Sorting tasks by priority (only filtering by priority is in scope)
- Tag icons or emoji in tag names
- Tag permissions or collaborative tag management
- Integration with external tagging systems
- Tag-based notifications or reminders
- Automatic tag cleanup (removing unused tags)
