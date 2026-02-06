/**
 * React Query Hooks for Statistics
 *
 * Provides cached user statistics with automatic synchronization.
 *
 * Features:
 * - Automatic caching (stats persist across navigation)
 * - Background refetching (keeps data fresh)
 * - Optimistic updates for statistics
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type UserStatistics } from '@/lib/api';

// Query keys for cache management
export const statisticsKeys = {
  all: (userId: string) => ['statistics', userId] as const,
  detail: (userId: string) => ['statistics', userId, 'detail'] as const,
};

/**
 * Fetch user statistics
 *
 * @example
 * const { data: stats, isLoading } = useStatistics(userId);
 * // Navigate away and back → instant (cached)
 */
export function useStatistics(userId: string | undefined) {
  return useQuery({
    queryKey: statisticsKeys.detail(userId!),
    queryFn: () => api.getStatistics(userId!),
    enabled: !!userId, // Only fetch if userId exists
    staleTime: 5 * 60 * 1000, // Fresh for 5 minutes
  });
}