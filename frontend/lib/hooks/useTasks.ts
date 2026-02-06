/**
 * React Query Hooks for Tasks
 *
 * Provides cached task operations with automatic synchronization.
 *
 * Features:
 * - Automatic caching (tasks persist across navigation)
 * - Background refetching (keeps data fresh)
 * - Optimistic updates for instant UI feedback
 * - Statistics invalidation on task mutations
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  api,
  type Task,
  type CreateTaskData,
  type UpdateTaskData,
  type TasksResponse,
} from "@/lib/api";
import { statisticsKeys } from "./useStatistics";

// Query keys for cache management
export const taskKeys = {
  all: (userId: string) => ["tasks", userId] as const,
  filtered: (userId: string, status: string) =>
    ["tasks", userId, status] as const,
  detail: (userId: string, taskId: number) =>
    ["tasks", userId, taskId] as const,
};

/**
 * Fetch all tasks for a user (with optional status filter)
 *
 * @example
 * const { data: tasks, isLoading } = useTasks(userId, 'all');
 * // Navigate away and back → instant (cached)
 */
export function useTasks(
  userId: string | undefined,
  status: "all" | "pending" | "completed" = "all",
) {
  return useQuery({
    queryKey: taskKeys.filtered(userId!, status),
    queryFn: () => api.getTasks(userId!, status),
    enabled: !!userId, // Only fetch if userId exists
    staleTime: 2 * 60 * 1000, // Fresh for 2 minutes
    select: (data) => data.tasks, // Extract just the tasks array
  });
}

/**
 * Helper: invalidate all task and statistics caches for a user
 */
function invalidateTaskCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string,
) {
  queryClient.invalidateQueries({ queryKey: ["tasks", userId] });
  queryClient.invalidateQueries({ queryKey: statisticsKeys.all(userId) });
}

/**
 * Create a new task with optimistic update
 *
 * Adds a temporary task to the cache immediately, then replaces
 * with the server response on success.
 */
export function useCreateTask(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaskData) => api.createTask(userId!, data),

    onMutate: async (data) => {
      // Cancel inflight fetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["tasks", userId!] });

      // Snapshot all matching caches for rollback
      const previousCaches = queryClient.getQueriesData<TasksResponse>({
        queryKey: ["tasks", userId!],
      });

      // Create optimistic task with a temporary negative ID
      const optimisticTask: Task = {
        id: -Date.now(),
        user_id: userId!,
        title: data.title,
        description: data.description ?? null,
        completed: false,
        due_date: data.due_date ?? null,
        priority: data.priority ?? "medium",
        status: data.status ?? "backlog",
        tags: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Prepend optimistic task to all matching caches
      queryClient.setQueriesData<TasksResponse>(
        { queryKey: ["tasks", userId!] },
        (old) =>
          old
            ? { tasks: [optimisticTask, ...old.tasks], count: old.count + 1 }
            : old,
      );

      return { previousCaches };
    },

    onError: (_err, _vars, context) => {
      // Rollback all caches
      context?.previousCaches?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },

    onSettled: () => {
      invalidateTaskCaches(queryClient, userId!);
    },
  });
}

/**
 * Update a task with optimistic update
 *
 * Instantly applies the partial update in the cache, then
 * revalidates from the server.
 */
export function useUpdateTask(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: number; data: UpdateTaskData }) =>
      api.updateTask(userId!, taskId, data),

    onMutate: async ({ taskId, data }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks", userId!] });

      const previousCaches = queryClient.getQueriesData<TasksResponse>({
        queryKey: ["tasks", userId!],
      });

      // Apply partial update across all matching caches
      queryClient.setQueriesData<TasksResponse>(
        { queryKey: ["tasks", userId!] },
        (old) =>
          old
            ? {
                ...old,
                tasks: old.tasks.map((task) =>
                  task.id === taskId
                    ? {
                        ...task,
                        ...data,
                        // Sync completed ↔ status
                        ...(data.status !== undefined && {
                          completed: data.status === "done",
                        }),
                        ...((data as Record<string, unknown>).completed !==
                          undefined &&
                          data.status === undefined && {
                            status: (data as Record<string, unknown>).completed
                              ? "done"
                              : "backlog",
                          }),
                        updated_at: new Date().toISOString(),
                      }
                    : task,
                ),
              }
            : old,
      );

      return { previousCaches };
    },

    onError: (_err, _vars, context) => {
      context?.previousCaches?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },

    onSettled: () => {
      invalidateTaskCaches(queryClient, userId!);
    },
  });
}

/**
 * Toggle task completion with optimistic update
 *
 * Instantly flips completed/status in the cache for
 * an immediate checkbox toggle experience.
 */
export function useToggleTaskComplete(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: number) => api.toggleComplete(userId!, taskId),

    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ["tasks", userId!] });

      const previousCaches = queryClient.getQueriesData<TasksResponse>({
        queryKey: ["tasks", userId!],
      });

      // Optimistically toggle completed and sync status
      queryClient.setQueriesData<TasksResponse>(
        { queryKey: ["tasks", userId!] },
        (old) =>
          old
            ? {
                ...old,
                tasks: old.tasks.map((task) =>
                  task.id === taskId
                    ? {
                        ...task,
                        completed: !task.completed,
                        status: !task.completed ? "done" : ("backlog" as const),
                        updated_at: new Date().toISOString(),
                      }
                    : task,
                ),
              }
            : old,
      );

      return { previousCaches };
    },

    onError: (_err, _vars, context) => {
      context?.previousCaches?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },

    onSettled: () => {
      invalidateTaskCaches(queryClient, userId!);
    },
  });
}

/**
 * Delete a task with optimistic update
 *
 * Instantly removes the task from the cache so the UI
 * updates without waiting for the server round-trip.
 */
export function useDeleteTask(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: number) => api.deleteTask(userId!, taskId),

    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ["tasks", userId!] });

      const previousCaches = queryClient.getQueriesData<TasksResponse>({
        queryKey: ["tasks", userId!],
      });

      // Optimistically remove the task from all caches
      queryClient.setQueriesData<TasksResponse>(
        { queryKey: ["tasks", userId!] },
        (old) =>
          old
            ? {
                ...old,
                tasks: old.tasks.filter((task) => task.id !== taskId),
                count: old.count - 1,
              }
            : old,
      );

      return { previousCaches };
    },

    onError: (_err, _vars, context) => {
      context?.previousCaches?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },

    onSettled: () => {
      invalidateTaskCaches(queryClient, userId!);
    },
  });
}
