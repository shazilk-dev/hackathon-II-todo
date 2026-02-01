/**
 * ChatKit API Contracts
 *
 * TypeScript type definitions for ChatKit-related API endpoints.
 * These contracts define the shape of requests and responses for
 * ChatKit session creation and message processing.
 *
 * @module contracts/chatkit-api
 */

// =============================================================================
// Session Endpoint Contracts
// =============================================================================

/**
 * POST /api/chatkit/session
 *
 * Creates a ChatKit session for an authenticated user.
 * Returns a client secret that the frontend uses to initialize the ChatKit widget.
 */

/**
 * Session creation request (empty body, auth from JWT header)
 */
export interface CreateChatKitSessionRequest {
  // No request body - user identity comes from Authorization header
}

/**
 * Session creation response
 */
export interface CreateChatKitSessionResponse {
  /** Client secret for initializing ChatKit widget */
  client_secret: string;
}

/**
 * Session creation error response
 */
export interface SessionErrorResponse {
  /** Error message */
  detail: string;
}

// =============================================================================
// ChatKit Endpoint Contracts
// =============================================================================

/**
 * POST /chatkit
 *
 * Main ChatKit endpoint that processes chat messages.
 * This endpoint receives requests from the ChatKit widget and returns
 * streaming responses via Server-Sent Events (SSE).
 *
 * Note: Request/response structure is defined by ChatKit SDK.
 * Frontend uses ChatKit React component which handles communication automatically.
 */

/**
 * ChatKit request (handled by ChatKit SDK)
 *
 * The actual request structure is managed by @openai/chatkit-react.
 * This is a reference for documentation purposes.
 */
export interface ChatKitRequest {
  /** Thread ID (null for new conversations) */
  thread_id?: string | null;

  /** User message content */
  message: string;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * ChatKit streaming response events
 *
 * The backend streams events via Server-Sent Events.
 * ChatKit React component handles parsing these events.
 */
export type ChatKitStreamEvent =
  | AssistantMessageEvent
  | ToolCallEvent
  | ErrorEvent
  | ThreadUpdateEvent;

/**
 * Assistant message chunk event
 */
export interface AssistantMessageEvent {
  type: 'assistant_message';
  content: string;
  is_complete: boolean;
}

/**
 * Tool call execution event
 */
export interface ToolCallEvent {
  type: 'tool_call';
  tool: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
}

/**
 * Error event
 */
export interface ErrorEvent {
  type: 'error';
  error: {
    message: string;
    code: string;
  };
}

/**
 * Thread update event (conversation ID)
 */
export interface ThreadUpdateEvent {
  type: 'thread_update';
  thread_id: string;
}

// =============================================================================
// Backend Context Types (for reference)
// =============================================================================

/**
 * Context passed from FastAPI to ChatKitServer.respond()
 *
 * This is not part of the API contract but documents what
 * data is available in the backend's respond() method.
 */
export interface ChatKitServerContext {
  /** Authenticated user ID from JWT token */
  user_id: string;

  /** Additional session metadata */
  session_metadata?: Record<string, unknown>;
}

// =============================================================================
// Tool Call Types
// =============================================================================

/**
 * Tool call structure for task operations
 *
 * These are the tools available to the AI agent for task management.
 */
export type TaskTool =
  | AddTaskTool
  | ListTasksTool
  | CompleteTaskTool
  | UpdateTaskTool
  | DeleteTaskTool;

/**
 * Add task tool
 */
export interface AddTaskTool {
  tool: 'add_task';
  args: {
    title: string;
    description?: string;
  };
  result: {
    task_id: number;
    status: 'created';
    title: string;
  };
}

/**
 * List tasks tool
 */
export interface ListTasksTool {
  tool: 'list_tasks';
  args: {
    status?: 'all' | 'pending' | 'completed';
  };
  result: {
    tasks: Array<{
      id: number;
      title: string;
      description: string | null;
      completed: boolean;
    }>;
    count: number;
  };
}

/**
 * Complete task tool
 */
export interface CompleteTaskTool {
  tool: 'complete_task';
  args: {
    task_id: number;
  };
  result: {
    task_id: number;
    status: 'completed';
    title: string;
  };
}

/**
 * Update task tool
 */
export interface UpdateTaskTool {
  tool: 'update_task';
  args: {
    task_id: number;
    title?: string;
    description?: string;
  };
  result: {
    task_id: number;
    status: 'updated';
    title: string;
  };
}

/**
 * Delete task tool
 */
export interface DeleteTaskTool {
  tool: 'delete_task';
  args: {
    task_id: number;
  };
  result: {
    task_id: number;
    status: 'deleted';
    title: string;
  };
}

// =============================================================================
// Error Types
// =============================================================================

/**
 * Standard error response structure
 */
export interface APIErrorResponse {
  /** Error message */
  detail: string;

  /** HTTP status code */
  status?: number;

  /** Error code (for client-side handling) */
  code?: string;
}

/**
 * Authentication error (401)
 */
export interface AuthenticationError extends APIErrorResponse {
  status: 401;
  code: 'auth_error';
  detail: 'Authentication failed. Please log in again.';
}

/**
 * Rate limit error (429)
 */
export interface RateLimitError extends APIErrorResponse {
  status: 429;
  code: 'rate_limit';
  detail: 'Too many requests. Please wait a moment.';
}

/**
 * Internal server error (500)
 */
export interface InternalServerError extends APIErrorResponse {
  status: 500;
  code: 'internal_error';
  detail: 'Internal server error. Please try again.';
}

// =============================================================================
// Request/Response Helpers
// =============================================================================

/**
 * Type guard for session response
 */
export function isSessionResponse(
  data: unknown
): data is CreateChatKitSessionResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'client_secret' in data &&
    typeof (data as CreateChatKitSessionResponse).client_secret === 'string'
  );
}

/**
 * Type guard for error response
 */
export function isErrorResponse(data: unknown): data is APIErrorResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'detail' in data &&
    typeof (data as APIErrorResponse).detail === 'string'
  );
}

// =============================================================================
// HTTP Headers
// =============================================================================

/**
 * Required headers for ChatKit API requests
 */
export interface ChatKitAPIHeaders {
  /** JWT authentication token */
  'Authorization': `Bearer ${string}`;

  /** Content type */
  'Content-Type': 'application/json';
}

/**
 * Create authenticated headers for ChatKit API
 */
export function createChatKitHeaders(token: string): ChatKitAPIHeaders {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

// =============================================================================
// Endpoint URLs
// =============================================================================

/**
 * ChatKit API endpoints
 */
export const CHATKIT_ENDPOINTS = {
  /** Create ChatKit session */
  CREATE_SESSION: '/api/chatkit/session',

  /** Main ChatKit message processing endpoint */
  CHATKIT: '/chatkit'
} as const;

/**
 * Build full endpoint URL
 */
export function buildChatKitURL(
  baseURL: string,
  endpoint: keyof typeof CHATKIT_ENDPOINTS
): string {
  return `${baseURL}${CHATKIT_ENDPOINTS[endpoint]}`;
}

// =============================================================================
// Example Usage
// =============================================================================

/**
 * Example: Creating a ChatKit session
 *
 * ```typescript
 * const response = await fetch(buildChatKitURL(API_URL, 'CREATE_SESSION'), {
 *   method: 'POST',
 *   headers: createChatKitHeaders(jwtToken)
 * });
 *
 * const data = await response.json();
 *
 * if (isSessionResponse(data)) {
 *   // Use data.client_secret to initialize ChatKit
 *   const chatKit = useChatKit({
 *     api: {
 *       getClientSecret: async () => data.client_secret
 *     }
 *   });
 * }
 * ```
 */

/**
 * Example: Handling errors
 *
 * ```typescript
 * try {
 *   const response = await fetch(url, options);
 *   if (!response.ok) {
 *     const error = await response.json();
 *
 *     if (isErrorResponse(error)) {
 *       // Handle specific error codes
 *       if (error.code === 'auth_error') {
 *         // Redirect to login
 *       } else if (error.code === 'rate_limit') {
 *         // Show rate limit message
 *       }
 *     }
 *   }
 * } catch (err) {
 *   // Handle network errors
 * }
 * ```
 */
