 Enhanced Todo App: Due Dates, Priority, Tags & Views

 Overview

 Incrementally add production-ready features to the hackathon todo app   
 in 5 phases, prioritizing due dates + priority first (user's top        
 request). Each phase is independently testable and deployable.

 Architecture Context

 - Backend: FastAPI + SQLModel + PostgreSQL (Neon), async patterns,      
 3-layer architecture
 - Frontend: Next.js 16 + TypeScript strict + Tailwind, direct API       
 calls, professional minimalist design
 - Security: JWT auth, user isolation enforced everywhere
 - Database: Alembic migrations, currently: id, user_id, title,
 description, completed, created_at, updated_at

 ---
 Phase 1: Due Dates + Priority (HIGHEST VALUE)

 Backend Changes

 Migration: 
 backend/src/db/migrations/versions/xxxx_add_due_date_and_priority.py    
 def upgrade():
     op.add_column('tasks', sa.Column('due_date', sa.DateTime(),         
 nullable=True))
     op.add_column('tasks', sa.Column('priority', sa.String(10),         
 nullable=False, server_default='medium'))
     op.create_index('ix_tasks_due_date', 'tasks', ['due_date'])
     op.create_index('ix_tasks_priority', 'tasks', ['priority'])
     op.create_check_constraint('check_priority_valid', 'tasks',
         "priority IN ('low', 'medium', 'high', 'critical')")

 Model: backend/src/models/task.py
 - Add: due_date: Optional[datetime] with index
 - Add: priority: Literal["low", "medium", "high", "critical"] with      
 default="medium", index

 Schema: backend/src/schemas/task.py
 - Add fields to TaskCreate, TaskUpdate, TaskResponse
 - Add validator: due_date_not_in_past() (warning only, allow past       
 dates)

 Service: backend/src/services/task_service.py
 - Extend get_tasks() with:
   - priority_filter: Optional[str] - filter by priority
   - due_date_filter: Optional[str] - "overdue", "today", "this_week",   
 "all"
   - Sort options: "priority" (critical→low using CASE), "due_date"      
 (nulls last)

 API: backend/src/api/routers/tasks.py
 - Add query params: priority_filter, due_date_filter to GET 
 /api/{user_id}/tasks

 Frontend Changes

 Types: frontend/lib/api.ts
 export type PriorityType = "low" | "medium" | "high" | "critical";      
 export interface Task {
   // ... existing fields
   due_date: string | null;  // ISO 8601
   priority: PriorityType;
 }

 Form: frontend/components/tasks/TaskForm.tsx
 - Add priority <select> dropdown (Low/Medium/High/Critical)
 - Add due date <input type="date">
 - Grid layout: grid grid-cols-2 gap-2

 Display: frontend/components/tasks/TaskItem.tsx
 - Add priority badge with colors:
   - Critical: bg-red-100 text-red-700
   - High: bg-orange-100 text-orange-700
   - Medium: bg-blue-100 text-blue-700
   - Low: bg-slate-100 text-slate-600
 - Add due date display with Calendar icon (lucide-react)
 - Show overdue indicator: red text + "(Overdue)" label

 Testing

 - Backend: Priority validation, due_date filtering
 (overdue/today/week), sorting
 - Frontend: Form renders inputs, TaskItem shows badges correctly,       
 overdue highlighting
 - Integration: POST/PUT with new fields, GET with filters

 Critical Files

 - backend/src/models/task.py
 - backend/src/services/task_service.py
 - backend/src/schemas/task.py
 - backend/src/api/routers/tasks.py
 - frontend/lib/api.ts
 - frontend/components/tasks/TaskForm.tsx
 - frontend/components/tasks/TaskItem.tsx

 ---
 Phase 2: Enhanced Status System

 Backend Changes

 Migration: backend/src/db/migrations/versions/xxxx_add_status_field.py  
 - Add status column: VARCHAR(20) with CHECK constraint 
 (backlog/in_progress/blocked/done)
 - Migrate existing data: completed=True → 'done', completed=False →     
 'backlog'
 - Keep completed for Phase 2 transition (drop in Phase 3)
 - Add index: ix_tasks_status

 Model: backend/src/models/task.py
 - Add: status: Literal["backlog", "in_progress", "blocked", "done"]     
 with default="backlog"
 - Add property: is_completed returns status == "done" (backwards        
 compatibility)

 Service: backend/src/services/task_service.py
 - Update get_tasks() to filter by status
 - Add change_status() method for state transitions
 - Keep toggle_completion() but map to status changes

 API: backend/src/api/routers/tasks.py
 - Add endpoint: PATCH /api/{user_id}/tasks/{task_id}/status (body: {    
 status: "in_progress" })

 Frontend Changes

 Component: frontend/components/tasks/StatusBadge.tsx (NEW)
 - Status configs: backlog (slate, Inbox), in_progress (blue, Clock),    
 blocked (red, AlertCircle), done (green, CheckCircle2)

 Update: frontend/components/tasks/TaskItem.tsx
 - Replace checkbox with status <select> dropdown
 - Or keep checkbox for quick "mark done", add status dropdown in        
 expanded view

 Testing

 - Status transitions, filtering, backwards compatibility with completed 
  field

 ---
 Phase 3: Tags/Categories System

 Backend Changes

 Migration: backend/src/db/migrations/versions/xxxx_add_tags.py
 - Create tags table: id, user_id, name (VARCHAR 50), color (VARCHAR 7   
 for hex), created_at
 - Unique constraint: (user_id, name)
 - Create task_tags junction table: task_id, tag_id, created_at 
 (many-to-many)
 - Indexes: user_id, task_id, tag_id

 Model: backend/src/models/tag.py (NEW)
 - Tag model with relationship to tasks
 - TaskTag link model

 Service: backend/src/services/tag_service.py (NEW)
 - get_or_create_tag() - deduplication per user
 - add_tags_to_task() - many-to-many association
 - get_user_tags() - list all tags for user

 API: backend/src/api/routers/tags.py (NEW)
 - GET /api/{user_id}/tags - list tags
 - POST /api/{user_id}/tags - create tag
 - PUT /api/{user_id}/tasks/{task_id}/tags - set task tags (body: {      
 tag_ids: [1,2,3] })

 Update: backend/src/api/routers/tasks.py
 - Add query param: tag_filter: List[int] to GET /api/{user_id}/tasks    

 Frontend Changes

 Component: frontend/components/tasks/TagInput.tsx (NEW)
 - Autocomplete input with existing tags
 - Press Enter to create tag
 - Display as removable chips

 Component: frontend/components/tasks/TagDisplay.tsx (NEW)
 - Read-only tag chips (for TaskItem)
 - Click to filter by tag

 Update: frontend/components/tasks/TaskForm.tsx
 - Add TagInput in expanded section

 Testing

 - Tag creation (unique per user), task-tag association, filtering by    
 tags

 ---
 Phase 4: Multiple Views (List + Calendar + Kanban)

 Backend Changes

 Optimization: Add endpoint GET
 /api/{user_id}/tasks/grouped?group_by=status
 - Returns: { "backlog": [...], "in_progress": [...], "blocked": [...],  
 "done": [...] }

 Frontend Changes

 Component: frontend/components/tasks/ViewSwitcher.tsx (NEW)
 - Toggle between: list, calendar, kanban
 - Icons: List, Calendar, Trello (lucide-react)

 Component: frontend/components/tasks/ListView.tsx
 - Current TaskList (rename/refactor)

 Component: frontend/components/tasks/CalendarView.tsx (NEW)
 - Month view grid with task dots on due dates
 - Click date to create task with that due date
 - Overdue tasks highlighted in red

 Component: frontend/components/tasks/KanbanView.tsx (NEW)
 - 4 columns: Backlog | In Progress | Blocked | Done
 - Drag-and-drop with @dnd-kit/core (or native HTML5 drag)
 - Updates status on drop

 State Management:
 - Store view in URL query params: /tasks?view=calendar
 - Use useRouter() and searchParams

 Testing

 - View switching persists in URL, calendar renders correctly, 
 drag-and-drop updates status

 ---
 Phase 5: Quick Date Shortcuts + Polish

 Frontend Changes

 Component: frontend/components/tasks/QuickDatePicker.tsx (NEW)
 - Preset buttons: Today, Tomorrow, This Week, Next Week, Custom Date    
 - Replace manual date input with quick picker

 Polish:
 - Keyboard shortcuts: Ctrl/Cmd+N (new task), Escape (close modals)      
 - Bulk actions: Select multiple, change priority/status/tags in bulk    
 - Smart sorting: Overdue → Today → Priority → Created
 - Toast notifications for actions (success/error)
 - Skeleton loaders for initial load
 - Optimistic UI updates (instant feedback)
 - Accessibility: ARIA labels, keyboard nav, focus management

 Testing

 - Keyboard shortcuts work, bulk actions update correctly, accessibility 
  with screen reader

 ---
 Verification Steps

 After Phase 1:

 1. Run migration: alembic upgrade head
 2. Backend: pytest tests/unit/test_task_service.py
 tests/integration/test_task_api.py
 3. Create task with priority + due date: POST /api/{user_id}/tasks      
 4. Filter overdue tasks: GET
 /api/{user_id}/tasks?due_date_filter=overdue
 5. Frontend: Sign in, create task, see priority badge + due date        
 6. Check overdue indicator shows for past due dates

 After Phase 2:

 1. Run migration: alembic upgrade head
 2. Check existing tasks migrated: completed=True → status='done'        
 3. Change task status: PATCH /api/{user_id}/tasks/{id}/status (body:    
 {"status": "in_progress"})
 4. Frontend: See status dropdown, change status, verify badge updates   

 After Phase 3:

 1. Run migration: alembic upgrade head
 2. Create tag: POST /api/{user_id}/tags (body: {"name": "work",
 "color": "#3b82f6"})
 3. Add tags to task: PUT /api/{user_id}/tasks/{id}/tags (body:
 {"tag_ids": [1,2]})
 4. Filter by tag: GET /api/{user_id}/tasks?tag_filter=1
 5. Frontend: Type tag in input, see autocomplete, add tag, see chip     

 After Phase 4:

 1. Toggle view to Calendar: /tasks?view=calendar
 2. See tasks on calendar dates
 3. Click date, create task with that due date
 4. Toggle to Kanban: /tasks?view=kanban
 5. Drag task from Backlog to In Progress, verify status updates

 After Phase 5:

 1. Test keyboard shortcuts: Ctrl+N opens task form
 2. Select multiple tasks, bulk change priority
 3. See toast notification on task create
 4. Test with screen reader (NVDA/JAWS)

 ---
 Rollback Strategy

 Phase 1: Migration downgrade drops columns cleanly. Frontend nullable   
 types handle missing fields.

 Phase 2: Keep completed during Phase 2 for safety. Drop in Phase 3      
 after frontend migrated.

 Phase 3: Drop task_tags, tags tables. No changes to tasks table.        

 Phase 4: No database changes. Hide view switcher, default to list view. 

 Phase 5: No database changes. Remove UI enhancements, core features     
 intact.

 ---
 Success Metrics

 Phase 1: Users can set due dates + priorities. Overdue tasks
 highlighted. Filter by priority/due date works.

 Phase 2: Users can move tasks through workflow (Backlog → In Progress → 
  Done). Status filtering works.

 Phase 3: Users can create tags and organize tasks. Tag filtering works. 

 Phase 4: Users can switch between List/Calendar/Kanban views.
 Drag-and-drop updates status.

 Phase 5: Users have quick date shortcuts. Bulk actions speed up
 workflows. Accessibility compliant (WCAG AA).

 ---
 Timeline Estimate (for planning only, not a commitment)

 - Phase 1: 2-3 days (migration, backend logic, frontend UI)
 - Phase 2: 1-2 days (migration, status logic, dropdown UI)
 - Phase 3: 2-3 days (new tables, tag service, autocomplete UI)
 - Phase 4: 3-4 days (calendar component, kanban board, drag-and-drop)   
 - Phase 5: 1-2 days (shortcuts, bulk actions, polish)

 Total: ~10-14 days for complete implementation and testing.