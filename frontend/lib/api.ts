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

  // Fetch a new JWT token from our token exchange endpoint
  try {
    const tokenResponse = await fetch(`${AUTH_URL}/api/auth/token`, {
      credentials: "include" // Include NextAuth session cookie
    });

    if (!tokenResponse.ok) {
      throw new ApiError(401, "Failed to get authentication token");
    }

    const tokenData = await tokenResponse.json();

    // Cache the token
    cachedToken = {
      token: tokenData.token,
      expiresAt: now + (60 * 60 * 24 * 7) // 7 days
    };

    return {
      "Authorization": `Bearer ${tokenData.token}`,
      "Content-Type": "application/json"
    };
  } catch (error) {
    cachedToken = null; // Clear cache on error
    throw new ApiError(401, "Authentication failed");
  }
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
  }
};
