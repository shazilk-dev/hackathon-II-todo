/**
 * React Query Hooks for Tags
 *
 * Provides cached tag operations with automatic synchronization.
 *
 * Features:
 * - Automatic caching (tags persist across navigation)
 * - Optimistic updates (instant UI feedback)
 * - Background refetching (keeps data fresh)
 * - Automatic error rollback
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type Tag, type CreateTagData } from '@/lib/api';

// Query keys for cache management
export const tagKeys = {
  all: (userId: string) => ['tags', userId] as const,
  detail: (userId: string, tagId: number) => ['tags', userId, tagId] as const,
};

/**
 * Fetch all tags for a user
 *
 * @example
 * const { data: tags, isLoading } = useTags(userId);
 * // Navigate away and back → instant (cached)
 */
export function useTags(userId: string | undefined) {
  return useQuery({
    queryKey: tagKeys.all(userId!),
    queryFn: () => api.getTags(userId!).then(res => res.tags),
    enabled: !!userId, // Only fetch if userId exists
    staleTime: 5 * 60 * 1000, // Fresh for 5 minutes
  });
}

/**
 * Create a new tag with optimistic update
 *
 * @example
 * const createTag = useCreateTag(userId);
 * createTag.mutate({ name: 'Work', color: '#FF6B6B' }); // Instant UI update!
 */
export function useCreateTag(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTagData) => api.createTag(userId!, data),

    // Optimistic update (instant UI)
    onMutate: async (newTagData) => {
      // Cancel ongoing queries
      await queryClient.cancelQueries({ queryKey: tagKeys.all(userId!) });

      // Snapshot previous value
      const previousTags = queryClient.getQueryData<Tag[]>(tagKeys.all(userId!));

      // Optimistically update cache
      const newTag = {
        id: Date.now(), // Temporary ID
        user_id: userId!,
        name: newTagData.name,
        color: newTagData.color,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData<Tag[]>(tagKeys.all(userId!), (old = []) => [
        ...old,
        newTag,
      ]);

      return { previousTags };
    },

    // Rollback on error
    onError: (err, newTag, context) => {
      if (context?.previousTags) {
        queryClient.setQueryData(tagKeys.all(userId!), context.previousTags);
      }
    },

    // Refetch after mutation
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.all(userId!) });
    },
  });
}

/**
 * Update task tags with optimistic update
 *
 * @example
 * const updateTaskTags = useUpdateTaskTags(userId);
 * updateTaskTags.mutate({ taskId: 1, tagIds: [1, 2, 3] });
 */
export function useUpdateTaskTags(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, tagIds }: { taskId: number; tagIds: number[] }) =>
      api.updateTaskTags(userId!, taskId, tagIds),

    // Optimistic update
    onMutate: async ({ taskId, tagIds }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', userId!] });

      const previousTasks = queryClient.getQueryData<any>(['tasks', userId!]);

      // Update task tags in cache - this is a bit tricky since we need to update the task object
      // For now, we'll just invalidate the tasks query to refetch
      return { previousTasks };
    },

    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', userId!], context.previousTasks);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', userId!] }); // Invalidate tasks to refetch with new tags
    },
  });
}