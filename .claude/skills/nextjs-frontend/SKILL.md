---
name: nextjs-frontend
description: Generate Next.js 16 frontend code with App Router, TypeScript, and Tailwind CSS. Use when implementing UI components, pages, or frontend features for the todo app.
allowed-tools: Read, Write, Glob, Grep, Bash
---

# Next.js 16 Frontend Skill

## Stack
- Next.js 16+ (App Router)
- React 19+
- TypeScript (strict mode)
- Tailwind CSS 4+
- Better Auth (client-side)

## Project Structure

```
frontend/
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── app/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   ├── globals.css          # Global styles
│   ├── auth/
│   │   └── [...path]/
│   │       └── page.tsx     # Auth pages (Better Auth)
│   └── dashboard/
│       ├── layout.tsx       # Dashboard layout (protected)
│       └── page.tsx         # Dashboard page
├── components/
│   ├── ui/                  # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Card.tsx
│   ├── tasks/
│   │   ├── TaskList.tsx
│   │   ├── TaskItem.tsx
│   │   └── TaskForm.tsx
│   └── layout/
│       ├── Header.tsx
│       └── Sidebar.tsx
├── lib/
│   ├── auth.ts              # Better Auth server config
│   ├── auth-client.ts       # Better Auth client
│   └── api.ts               # API client with JWT
├── types/
│   └── index.ts             # TypeScript types
└── middleware.ts            # Route protection
```

## Code Patterns

### next.config.ts

```typescript
import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Enable if using server actions
    serverActions: {
      bodySizeLimit: "2mb"
    }
  }
};

export default config;
```

### Root Layout (app/layout.tsx)

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Todo App - Phase 2",
  description: "Full-stack todo application"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### Auth Provider (components/providers/AuthProvider.tsx)

```tsx
"use client";

import { createContext, useContext, ReactNode } from "react";
import { useSession, Session } from "@/lib/auth-client";

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  isLoading: true,
  isAuthenticated: false
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();
  
  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading: isPending,
        isAuthenticated: !!session?.user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### Auth Client (lib/auth-client.ts)

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3000"
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession
} = authClient;

// Type exports
export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;
```

### API Client with JWT (lib/api.ts)

```typescript
import { getSession } from "./auth-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const session = await getSession();
  
  if (!session?.session?.token) {
    throw new ApiError(401, "Not authenticated");
  }
  
  return {
    "Authorization": `Bearer ${session.session.token}`,
    "Content-Type": "application/json"
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new ApiError(response.status, error.detail || response.statusText);
  }
  return response.json();
}

export interface Task {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface TasksResponse {
  tasks: Task[];
  count: number;
}

export interface CreateTaskData {
  title: string;
  description?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
}

export const api = {
  // Get all tasks for user
  async getTasks(userId: string, status: "all" | "pending" | "completed" = "all"): Promise<TasksResponse> {
    const headers = await getAuthHeaders();
    const url = new URL(`${API_URL}/api/${userId}/tasks`);
    url.searchParams.set("status", status);
    
    const response = await fetch(url.toString(), { headers });
    return handleResponse<TasksResponse>(response);
  },
  
  // Create a new task
  async createTask(userId: string, data: CreateTaskData): Promise<Task> {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_URL}/api/${userId}/tasks`, {
      method: "POST",
      headers,
      body: JSON.stringify(data)
    });
    
    return handleResponse<Task>(response);
  },
  
  // Get single task
  async getTask(userId: string, taskId: number): Promise<Task> {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_URL}/api/${userId}/tasks/${taskId}`, {
      headers
    });
    
    return handleResponse<Task>(response);
  },
  
  // Update task
  async updateTask(userId: string, taskId: number, data: UpdateTaskData): Promise<Task> {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_URL}/api/${userId}/tasks/${taskId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(data)
    });
    
    return handleResponse<Task>(response);
  },
  
  // Delete task
  async deleteTask(userId: string, taskId: number): Promise<{ message: string }> {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_URL}/api/${userId}/tasks/${taskId}`, {
      method: "DELETE",
      headers
    });
    
    return handleResponse<{ message: string }>(response);
  },
  
  // Toggle task completion
  async toggleComplete(userId: string, taskId: number): Promise<Task> {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_URL}/api/${userId}/tasks/${taskId}/complete`, {
      method: "PATCH",
      headers
    });
    
    return handleResponse<Task>(response);
  }
};
```

### Protected Route Middleware (middleware.ts)

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/dashboard"];
const authRoutes = ["/auth"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if path is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Check if path is auth route
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Get session cookie (Better Auth uses this)
  const sessionCookie = request.cookies.get("better-auth.session_token");
  const isAuthenticated = !!sessionCookie;
  
  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }
  
  // Redirect authenticated users from auth routes
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*"]
};
```

### Task List Component (components/tasks/TaskList.tsx)

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { api, Task, TasksResponse } from "@/lib/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { TaskItem } from "./TaskItem";
import { TaskForm } from "./TaskForm";

type StatusFilter = "all" | "pending" | "completed";

export function TaskList() {
  const { session } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");
  
  const userId = session?.user?.id;
  
  const fetchTasks = useCallback(async () => {
    if (!userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.getTasks(userId, filter);
      setTasks(response.tasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tasks");
    } finally {
      setIsLoading(false);
    }
  }, [userId, filter]);
  
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);
  
  const handleTaskCreated = (task: Task) => {
    setTasks(prev => [task, ...prev]);
  };
  
  const handleTaskUpdated = (updatedTask: Task) => {
    setTasks(prev => 
      prev.map(task => task.id === updatedTask.id ? updatedTask : task)
    );
  };
  
  const handleTaskDeleted = (taskId: number) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };
  
  if (!userId) {
    return <div>Please sign in to view tasks</div>;
  }
  
  return (
    <div className="space-y-6">
      {/* Add Task Form */}
      <TaskForm userId={userId} onTaskCreated={handleTaskCreated} />
      
      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(["all", "pending", "completed"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg capitalize ${
              filter === status
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {status}
          </button>
        ))}
      </div>
      
      {/* Task List */}
      {isLoading ? (
        <div className="text-center py-8">Loading tasks...</div>
      ) : error ? (
        <div className="text-red-500 text-center py-8">{error}</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No tasks found. Create one above!
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              userId={userId}
              onUpdate={handleTaskUpdated}
              onDelete={handleTaskDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

### Task Item Component (components/tasks/TaskItem.tsx)

```tsx
"use client";

import { useState } from "react";
import { api, Task } from "@/lib/api";

interface TaskItemProps {
  task: Task;
  userId: string;
  onUpdate: (task: Task) => void;
  onDelete: (taskId: number) => void;
}

export function TaskItem({ task, userId, onUpdate, onDelete }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [isLoading, setIsLoading] = useState(false);
  
  const handleToggleComplete = async () => {
    setIsLoading(true);
    try {
      const updated = await api.toggleComplete(userId, task.id);
      onUpdate(updated);
    } catch (err) {
      console.error("Failed to toggle completion:", err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSave = async () => {
    setIsLoading(true);
    try {
      const updated = await api.updateTask(userId, task.id, { title, description });
      onUpdate(updated);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update task:", err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    
    setIsLoading(true);
    try {
      await api.deleteTask(userId, task.id);
      onDelete(task.id);
    } catch (err) {
      console.error("Failed to delete task:", err);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isEditing) {
    return (
      <div className="p-4 border rounded-lg bg-white shadow-sm">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border rounded mb-2"
          placeholder="Task title"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border rounded mb-2"
          placeholder="Description (optional)"
          rows={2}
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={isLoading || !title.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Saving..." : "Save"}
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setTitle(task.title);
              setDescription(task.description || "");
            }}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`p-4 border rounded-lg bg-white shadow-sm ${
      task.completed ? "opacity-60" : ""
    }`}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={task.completed}
          onChange={handleToggleComplete}
          disabled={isLoading}
          className="mt-1 h-5 w-5 rounded border-gray-300"
        />
        
        {/* Content */}
        <div className="flex-1">
          <h3 className={`font-medium ${task.completed ? "line-through" : ""}`}>
            {task.title}
          </h3>
          {task.description && (
            <p className="text-gray-600 text-sm mt-1">{task.description}</p>
          )}
          <p className="text-gray-400 text-xs mt-2">
            Created: {new Date(task.created_at).toLocaleDateString()}
          </p>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-600 hover:text-blue-800"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="text-red-600 hover:text-red-800"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Task Form Component (components/tasks/TaskForm.tsx)

```tsx
"use client";

import { useState, FormEvent } from "react";
import { api, Task } from "@/lib/api";

interface TaskFormProps {
  userId: string;
  onTaskCreated: (task: Task) => void;
}

export function TaskForm({ userId, onTaskCreated }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const task = await api.createTask(userId, {
        title: title.trim(),
        description: description.trim() || undefined
      });
      onTaskCreated(task);
      setTitle("");
      setDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded-lg bg-gray-50">
      <h2 className="text-lg font-semibold mb-3">Add New Task</h2>
      
      {error && (
        <div className="mb-3 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What do you need to do?"
        className="w-full px-3 py-2 border rounded mb-2"
        required
        maxLength={200}
      />
      
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Add a description (optional)"
        className="w-full px-3 py-2 border rounded mb-3"
        rows={2}
      />
      
      <button
        type="submit"
        disabled={isLoading || !title.trim()}
        className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? "Adding..." : "Add Task"}
      </button>
    </form>
  );
}
```

### Dashboard Page (app/dashboard/page.tsx)

```tsx
import { TaskList } from "@/components/tasks/TaskList";
import { Header } from "@/components/layout/Header";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <main className="max-w-3xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">My Tasks</h1>
        <TaskList />
      </main>
    </div>
  );
}
```

## Commands

```bash
# Create new Next.js app
npx create-next-app@latest frontend --typescript --tailwind --app --eslint

# Install Better Auth
npm install better-auth @better-auth/react

# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Important Notes

1. **Server vs Client Components**
   - Default to Server Components
   - Add `"use client"` only for interactivity (useState, useEffect, onClick)

2. **Better Auth Setup**
   - Server config in `lib/auth.ts`
   - Client config in `lib/auth-client.ts`
   - Don't mix them up!

3. **API Calls**
   - Always include JWT in Authorization header
   - Handle errors gracefully
   - Show loading states

4. **TypeScript**
   - Define types for all data
   - Use strict mode
   - Avoid `any`
