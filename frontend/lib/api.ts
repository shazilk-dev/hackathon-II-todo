import { getSession } from "./auth-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3000";

// Log API URL for debugging (only in development or when there's an issue)
if (typeof window !== 'undefined') {
  console.log(`[API] Using backend URL: ${API_URL}`);
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

// Cache for JWT token to avoid fetching on every request
let cachedToken: { token: string; expiresAt: number } | null = null;

// Mutex to prevent concurrent token fetches
let tokenFetchPromise: Promise<{ token: string; expiresAt: number }> | null = null;

async function getAuthHeaders(): Promise<HeadersInit> {
  // First verify we have a NextAuth session
  const session = await getSession();

  if (!session?.user) {
    throw new ApiError(401, "Not authenticated");
  }

  // Check if we have a valid cached token
  const now = Date.now() / 1000;
  if (cachedToken && cachedToken.expiresAt > now + 300) {
    // Token is still valid (with 5 minute buffer)
    return {
      "Authorization": `Bearer ${cachedToken.token}`,
      "Content-Type": "application/json"
    };
  }

  // If a token fetch is already in progress, wait for it
  if (tokenFetchPromise) {
    try {
      const tokenData = await tokenFetchPromise;
      return {
        "Authorization": `Bearer ${tokenData.token}`,
        "Content-Type": "application/json"
      };
    } catch (error) {
      // If the in-progress fetch failed, continue to try fetching again
      tokenFetchPromise = null;
    }
  }

  // Fetch a new JWT token from our token exchange endpoint
  tokenFetchPromise = (async () => {
    try {
      const tokenResponse = await fetch(`${AUTH_URL}/api/auth/token`, {
        credentials: "include" // Include NextAuth session cookie
      });

      if (!tokenResponse.ok) {
        throw new ApiError(401, "Failed to get authentication token");
      }

      const tokenData = await tokenResponse.json();

      // Cache the token
      const now = Date.now() / 1000;
      cachedToken = {
        token: tokenData.token,
        expiresAt: now + (60 * 60 * 24 * 7) // 7 days
      };

      return cachedToken;
    } catch (error) {
      cachedToken = null; // Clear cache on error
      throw new ApiError(401, "Authentication failed");
    } finally {
      tokenFetchPromise = null; // Clear the promise
    }
  })();

  const tokenData = await tokenFetchPromise;
  return {
    "Authorization": `Bearer ${tokenData.token}`,
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

// Helper to check if error should be suppressed (browser extension errors, etc)
function isSuppressibleError(error: unknown): boolean {
  if (error instanceof Error) {
    // Suppress AbortError (happens when requests are cancelled/duplicated)
    if (error.name === 'AbortError') return true;
    // Suppress message port errors (browser extension communication issues)
    if (error.message.includes('message port')) return true;
  }
  return false;
}

export type PriorityType = "low" | "medium" | "high" | "critical";
export type StatusType = "backlog" | "in_progress" | "blocked" | "done";

export interface Tag {
  id: number;
  user_id: string;
  name: string;
  color: string;  // hex color (#RRGGBB)
  created_at: string;
}

export interface Task {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  due_date: string | null;  // ISO 8601
  priority: PriorityType;
  status: StatusType;
  tags: Tag[];
  created_at: string;
  updated_at: string;
}

export interface TasksResponse {
  tasks: Task[];
  count: number;
}

export interface TagsResponse {
  tags: Tag[];
  count: number;
}

export interface CreateTagData {
  name: string;
  color: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  due_date?: string | null;
  priority?: PriorityType;
  status?: StatusType;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  due_date?: string | null;
  priority?: PriorityType;
  status?: StatusType;
}

// Focus Session types
export type DurationType = 5 | 15 | 25;

export interface FocusSession {
  id: number;
  user_id: string;
  task_id: number;
  started_at: string;  // ISO 8601
  ended_at: string | null;  // ISO 8601 or null if still running
  duration_minutes: DurationType;
  completed: boolean;
  notes: string | null;
}

export interface CreateFocusSessionData {
  task_id: number;
  duration_minutes: DurationType;
}

export interface UpdateFocusSessionData {
  completed?: boolean;
  notes?: string;
}

// Statistics types
export interface DayStatistics {
  date: string;  // YYYY-MM-DD
  completed_count: number;
}

export interface WeeklyStatistics {
  week_start: string;  // YYYY-MM-DD
  days: DayStatistics[];
  total: number;
}

export interface StreakInfo {
  current_streak: number;
  longest_streak: number;
  last_completion_date: string | null;  // YYYY-MM-DD
}

export interface TaskStatistics {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  completion_rate: number;  // 0-100
  total_completions: number;
}

export interface UserStatistics {
  statistics: TaskStatistics;
  streak: StreakInfo;
  weekly: WeeklyStatistics;
}

// Chat types
export interface ChatRequest {
  conversation_id: number | null;
  message: string;
}

export interface ToolCall {
  tool: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
}

export interface ChatResponse {
  conversation_id: number;
  response: string;
  tool_calls: ToolCall[];
}

export const api = {
  // Get all tasks for user
  async getTasks(userId: string, status: "all" | "pending" | "completed" = "all"): Promise<TasksResponse> {
    try {
      const headers = await getAuthHeaders();
      const url = new URL(`${API_URL}/api/${userId}/tasks`);
      url.searchParams.set("status_filter", status);

      const response = await fetch(url.toString(), { 
        headers,
        cache: 'no-store'
      });
      return handleResponse<TasksResponse>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError(503, `Backend server is not reachable at ${API_URL}. Please check your connection.`);
      }
      throw error;
    }
  },

  // Create a new task
  async createTask(userId: string, data: CreateTaskData): Promise<Task> {
    try {
      const headers = await getAuthHeaders();

      const response = await fetch(`${API_URL}/api/${userId}/tasks`, {
        method: "POST",
        headers,
        body: JSON.stringify(data)
      });

      return handleResponse<Task>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError(503, `Backend server is not reachable at ${API_URL}. Please check your connection.`);
      }
      throw error;
    }
  },

  // Get single task
  async getTask(userId: string, taskId: number): Promise<Task> {
    try {
      const headers = await getAuthHeaders();

      const response = await fetch(`${API_URL}/api/${userId}/tasks/${taskId}`, {
        headers
      });

      return handleResponse<Task>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError(503, `Backend server is not reachable at ${API_URL}. Please check your connection.`);
      }
      throw error;
    }
  },

  // Update task
  async updateTask(userId: string, taskId: number, data: UpdateTaskData): Promise<Task> {
    try {
      const headers = await getAuthHeaders();

      const response = await fetch(`${API_URL}/api/${userId}/tasks/${taskId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(data)
      });

      return handleResponse<Task>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError(503, `Backend server is not reachable at ${API_URL}. Please check your connection.`);
      }
      throw error;
    }
  },

  // Delete task
  async deleteTask(userId: string, taskId: number): Promise<{ message: string }> {
    try {
      const headers = await getAuthHeaders();

      const response = await fetch(`${API_URL}/api/${userId}/tasks/${taskId}`, {
        method: "DELETE",
        headers
      });

      return handleResponse<{ message: string }>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError(503, `Backend server is not reachable at ${API_URL}. Please check your connection.`);
      }
      throw error;
    }
  },

  // Toggle task completion
  async toggleComplete(userId: string, taskId: number): Promise<Task> {
    try {
      const headers = await getAuthHeaders();

      const response = await fetch(`${API_URL}/api/${userId}/tasks/${taskId}/complete`, {
        method: "PATCH",
        headers
      });

      return handleResponse<Task>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError(503, `Backend server is not reachable at ${API_URL}. Please check your connection.`);
      }
      throw error;
    }
  },

  // Change task status
  async changeStatus(userId: string, taskId: number, status: StatusType): Promise<Task> {
    try {
      const headers = await getAuthHeaders();

      const response = await fetch(`${API_URL}/api/${userId}/tasks/${taskId}/status`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status })
      });

      return handleResponse<Task>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError(503, `Backend server is not reachable at ${API_URL}. Please check your connection.`);
      }
      throw error;
    }
  },

  // Get all tags for user
  async getTags(userId: string): Promise<TagsResponse> {
    try {
      const headers = await getAuthHeaders();

      const response = await fetch(`${API_URL}/api/${userId}/tags`, {
        headers,
        cache: 'no-store'
      });

      return handleResponse<TagsResponse>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError(503, `Backend server is not reachable at ${API_URL}. Please check your connection.`);
      }
      throw error;
    }
  },

  // Create a new tag
  async createTag(userId: string, data: CreateTagData): Promise<Tag> {
    try {
      const headers = await getAuthHeaders();

      const response = await fetch(`${API_URL}/api/${userId}/tags`, {
        method: "POST",
        headers,
        body: JSON.stringify(data)
      });

      return handleResponse<Tag>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError(503, `Backend server is not reachable at ${API_URL}. Please check your connection.`);
      }
      throw error;
    }
  },

  // Update task tags
  async updateTaskTags(userId: string, taskId: number, tagIds: number[]): Promise<{ message: string }> {
    try {
      const headers = await getAuthHeaders();

      const response = await fetch(`${API_URL}/api/${userId}/tasks/${taskId}/tags`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ tag_ids: tagIds })
      });

      return handleResponse<{ message: string }>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError(503, `Backend server is not reachable at ${API_URL}. Please check your connection.`);
      }
      throw error;
    }
  },

  // Statistics API

  // Get user statistics
  async getStatistics(userId: string): Promise<UserStatistics> {
    try {
      const headers = await getAuthHeaders();

      const response = await fetch(`${API_URL}/api/${userId}/statistics`, {
        headers,
        cache: 'no-store'
      });

      return handleResponse<UserStatistics>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError(503, `Backend server is not reachable at ${API_URL}. Please check your connection.`);
      }
      throw error;
    }
  },

  // Focus Sessions API

  // Start a focus session
  async startFocusSession(userId: string, data: CreateFocusSessionData): Promise<FocusSession> {
    try {
      const headers = await getAuthHeaders();

      const response = await fetch(`${API_URL}/api/${userId}/focus-sessions`, {
        method: "POST",
        headers,
        body: JSON.stringify(data)
      });

      return handleResponse<FocusSession>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError(503, `Backend server is not reachable at ${API_URL}. Please check your connection.`);
      }
      throw error;
    }
  },

  // End a focus session
  async endFocusSession(userId: string, sessionId: number, data: UpdateFocusSessionData): Promise<FocusSession> {
    try {
      const headers = await getAuthHeaders();

      const response = await fetch(`${API_URL}/api/${userId}/focus-sessions/${sessionId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(data)
      });

      return handleResponse<FocusSession>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError(503, `Backend server is not reachable at ${API_URL}. Please check your connection.`);
      }
      throw error;
    }
  },

  // Get active focus session
  async getActiveFocusSession(userId: string): Promise<FocusSession | null> {
    try {
      const headers = await getAuthHeaders();

      const response = await fetch(`${API_URL}/api/${userId}/focus-sessions/active`, {
        headers,
        cache: 'no-store'
      });

      if (response.status === 404) {
        return null;
      }

      return handleResponse<FocusSession>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError(503, `Backend server is not reachable at ${API_URL}. Please check your connection.`);
      }
      throw error;
    }
  },

  // Get focus sessions
  async getFocusSessions(userId: string, taskId?: number, limit?: number): Promise<FocusSession[]> {
    try {
      const headers = await getAuthHeaders();
      const url = new URL(`${API_URL}/api/${userId}/focus-sessions`);

      if (taskId) url.searchParams.set("task_id", taskId.toString());
      if (limit) url.searchParams.set("limit", limit.toString());

      const response = await fetch(url.toString(), {
        headers,
        cache: 'no-store'
      });

      return handleResponse<FocusSession[]>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError(503, `Backend server is not reachable at ${API_URL}. Please check your connection.`);
      }
      throw error;
    }
  },

  // Chat
  async sendChat(userId: string, data: ChatRequest): Promise<ChatResponse> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/api/${userId}/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });
      return handleResponse<ChatResponse>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new ApiError(503, `Backend server is not reachable at ${API_URL}. Please check your connection.`);
      }
      throw error;
    }
  }
};
