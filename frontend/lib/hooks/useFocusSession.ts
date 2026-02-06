/**
 * React Query Hooks for Focus Sessions
 *
 * Provides cached focus session operations with automatic synchronization.
 *
 * Features:
 * - Automatic caching (sessions persist across navigation)
 * - Optimistic updates (instant UI feedback)
 * - Background refetching (keeps data fresh)
 * - Automatic error rollback
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type FocusSession, type CreateFocusSessionData, type UpdateFocusSessionData } from '@/lib/api';

// Query keys for cache management
export const focusSessionKeys = {
  all: (userId: string) => ['focus-sessions', userId] as const,
  active: (userId: string) => ['focus-sessions', userId, 'active'] as const,
  detail: (userId: string, sessionId: number) => ['focus-sessions', userId, sessionId] as const,
  forTask: (userId: string, taskId: number) => ['focus-sessions', userId, 'task', taskId] as const,
};

/**
 * Fetch active focus session for a user
 *
 * @example
 * const { data: session, isLoading } = useActiveFocusSession(userId);
 * // Navigate away and back → instant (cached)
 */
export function useActiveFocusSession(userId: string | undefined) {
  return useQuery({
    queryKey: focusSessionKeys.active(userId!),
    queryFn: () => api.getActiveFocusSession(userId!),
    enabled: !!userId, // Only fetch if userId exists
    staleTime: 30 * 1000, // Fresh for 30 seconds
  });
}

/**
 * Start a new focus session with optimistic update
 *
 * @example
 * const startSession = useStartFocusSession(userId);
 * startSession.mutate({ task_id: 1, duration_minutes: 25 }); // Instant UI update!
 */
export function useStartFocusSession(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFocusSessionData) => api.startFocusSession(userId!, data),

    // Optimistic update (instant UI)
    onMutate: async (newSessionData) => {
      // Cancel ongoing queries
      await queryClient.cancelQueries({ queryKey: focusSessionKeys.active(userId!) });

      // Snapshot previous value
      const previousSession = queryClient.getQueryData<FocusSession | null>(focusSessionKeys.active(userId!));

      // Optimistically update cache
      queryClient.setQueryData<FocusSession | null>(focusSessionKeys.active(userId!), {
        id: Date.now(), // Temporary ID
        user_id: userId!,
        task_id: newSessionData.task_id,
        started_at: new Date().toISOString(),
        ended_at: null,
        duration_minutes: newSessionData.duration_minutes,
        completed: false,
        notes: null,
      });

      return { previousSession };
    },

    // Rollback on error
    onError: (err, newSession, context) => {
      if (context?.previousSession !== undefined) {
        queryClient.setQueryData(focusSessionKeys.active(userId!), context.previousSession);
      }
    },

    // Refetch after mutation
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: focusSessionKeys.active(userId!) });
    },
  });
}

/**
 * End a focus session with optimistic update
 *
 * @example
 * const endSession = useEndFocusSession(userId);
 * endSession.mutate({ session_id: 1, data: { completed: true, notes: 'Good session' } });
 */
export function useEndFocusSession(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: number; data: UpdateFocusSessionData }) =>
      api.endFocusSession(userId!, sessionId, data),

    // Optimistic update
    onMutate: async ({ sessionId, data }) => {
      await queryClient.cancelQueries({ queryKey: focusSessionKeys.active(userId!) });

      const previousSession = queryClient.getQueryData<FocusSession | null>(focusSessionKeys.active(userId!));

      // Update session in cache
      queryClient.setQueryData<FocusSession | null>(focusSessionKeys.active(userId!), (old) => {
        if (!old) return old;
        return {
          ...old,
          ...data,
          ended_at: data.completed ? new Date().toISOString() : old.ended_at,
        };
      });

      return { previousSession };
    },

    onError: (err, variables, context) => {
      if (context?.previousSession !== undefined) {
        queryClient.setQueryData(focusSessionKeys.active(userId!), context.previousSession);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: focusSessionKeys.active(userId!) });
    },
  });
}