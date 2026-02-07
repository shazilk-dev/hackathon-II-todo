/**
 * ChatKit API Client
 *
 * Handles ChatKit session management, thread persistence, and authentication.
 * Uses Better Auth JWT tokens for backend API authentication.
 *
 * @module lib/api/chatkit
 */

import { getSession } from '@/lib/auth-client';
import type { CreateChatKitSessionResponse } from '@/types/chatkit';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Storage key for ChatKit thread ID in localStorage
 */
const STORAGE_KEYS = {
  THREAD_ID: 'chatkit_thread_id'
} as const;

/**
 * Get ChatKit client secret for initializing the widget
 *
 * Creates a ChatKit session by calling the backend API with Better Auth JWT.
 * The backend validates the JWT and returns a short-lived client secret.
 *
 * @returns Promise resolving to client secret string
 * @throws Error if not authenticated or session creation fails
 *
 * @example
 * ```typescript
 * const clientSecret = await getChatKitClientSecret();
 * const chatKit = useChatKit({
 *   api: {
 *     getClientSecret: getChatKitClientSecret
 *   }
 * });
 * ```
 */
export async function getChatKitClientSecret(): Promise<string> {
  const sessionResult = await getSession();

  // Better Auth getSession returns { data: { user, session } } or { error }
  const session = sessionResult as any;

  if (!session?.data?.user) {
    throw new Error('Not authenticated. Please log in to access chat.');
  }

  // Get JWT token from token exchange endpoint
  const AUTH_URL = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3000');
  const tokenResponse = await fetch(`${AUTH_URL}/api/auth/token`, {
    credentials: 'include' // Include NextAuth session cookie
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to get authentication token');
  }

  const { token } = await tokenResponse.json();

  try {
    const response = await fetch(`${API_URL}/api/chatkit/session`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (response.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      } else if (response.status >= 500) {
        throw new Error('Server error. Please try again later.');
      }

      // Generic error fallback
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to create chat session');
    }

    const data: CreateChatKitSessionResponse = await response.json();

    if (!data.client_secret) {
      throw new Error('Invalid session response: missing client secret');
    }

    return data.client_secret;
  } catch (error) {
    // Network errors
    if (error instanceof TypeError) {
      throw new Error('Network error. Please check your internet connection.');
    }

    // Re-throw known errors
    if (error instanceof Error) {
      throw error;
    }

    // Unknown errors
    throw new Error('An unexpected error occurred while creating chat session.');
  }
}

/**
 * Load thread ID from localStorage
 *
 * Retrieves the stored ChatKit thread ID to resume previous conversations.
 * Returns null if no thread ID is stored or if running server-side.
 *
 * @returns Stored thread ID or null
 *
 * @example
 * ```typescript
 * const threadId = getStoredThreadId();
 * const chatKit = useChatKit({
 *   initialThread: threadId || undefined
 * });
 * ```
 */
export function getStoredThreadId(): string | null {
  if (typeof window === 'undefined') {
    return null; // Server-side rendering
  }

  try {
    return localStorage.getItem(STORAGE_KEYS.THREAD_ID);
  } catch (error) {
    console.error('Failed to read thread ID from localStorage:', error);
    return null;
  }
}

/**
 * Save thread ID to localStorage
 *
 * Persists the ChatKit thread ID for conversation resumption across sessions.
 * If threadId is null, removes the stored value.
 *
 * @param threadId - Thread ID to save, or null to clear
 *
 * @example
 * ```typescript
 * // Save thread ID
 * saveThreadId('thread_abc123');
 *
 * // Clear thread ID
 * saveThreadId(null);
 * ```
 */
export function saveThreadId(threadId: string | null): void {
  if (typeof window === 'undefined') {
    return; // Server-side rendering
  }

  try {
    if (threadId) {
      localStorage.setItem(STORAGE_KEYS.THREAD_ID, threadId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.THREAD_ID);
    }
  } catch (error) {
    console.error('Failed to save thread ID to localStorage:', error);
  }
}

/**
 * Clear current conversation
 *
 * Removes the stored thread ID, effectively starting a fresh conversation.
 * This is used when the user clicks "New Chat" button.
 *
 * @example
 * ```typescript
 * const handleNewChat = () => {
 *   clearConversation();
 *   chatKit.setThreadId(null);
 * };
 * ```
 */
export function clearConversation(): void {
  saveThreadId(null);
}
