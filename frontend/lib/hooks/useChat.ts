/**
 * React Query Hooks for Chat/Conversations
 *
 * Provides cached conversation and message operations.
 *
 * Features:
 * - Conversation history caching
 * - Message persistence across navigation
 * - Optimistic message updates
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type ChatRequest, type ChatResponse } from "@/lib/api";
import { taskKeys } from "./useTasks";
import { statisticsKeys } from "./useStatistics";

// Query keys
export const chatKeys = {
  conversations: (userId: string) => ["conversations", userId] as const,
  messages: (userId: string, conversationId: number) =>
    ["conversations", userId, conversationId, "messages"] as const,
};

/**
 * Fetch conversation messages
 *
 * @example
 * const { data: messages } = useConversationMessages(userId, conversationId);
 * // Navigate away and back → messages still loaded!
 */
export function useConversationMessages(
  userId: string | undefined,
  conversationId: number | null,
) {
  return useQuery({
    queryKey: conversationId
      ? chatKeys.messages(userId!, conversationId)
      : ["conversations", "empty"],
    queryFn: () => api.getConversationMessages(userId!, conversationId!),
    enabled: !!userId && !!conversationId,
    staleTime: 5 * 60 * 1000, // Messages fresh for 5 minutes
    select: (data) => data.messages,
  });
}

/**
 * Send chat message with optimistic update
 *
 * @example
 * const sendMessage = useSendMessage(userId);
 * sendMessage.mutate({ conversation_id: 1, message: 'Hello!' });
 */
export function useSendMessage(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ChatRequest) => api.sendChat(userId!, data),

    // Optimistic update (show user message immediately)
    onMutate: async (messageData) => {
      if (!messageData.conversation_id) return;

      // Cancel ongoing queries
      await queryClient.cancelQueries({
        queryKey: chatKeys.messages(userId!, messageData.conversation_id),
      });

      // Snapshot previous messages
      const previousMessages = queryClient.getQueryData(
        chatKeys.messages(userId!, messageData.conversation_id),
      );

      // Add user message optimistically
      queryClient.setQueryData(
        chatKeys.messages(userId!, messageData.conversation_id),
        (old: any = []) => [
          ...old,
          {
            id: `temp-${Date.now()}`,
            role: "user",
            content: messageData.message,
            tool_calls: null,
            timestamp: new Date().toISOString(),
          },
        ],
      );

      return { previousMessages };
    },

    // Rollback on error
    onError: (err, messageData, context) => {
      if (context?.previousMessages && messageData.conversation_id) {
        queryClient.setQueryData(
          chatKeys.messages(userId!, messageData.conversation_id),
          context.previousMessages,
        );
      }
    },

    // Refetch after response + invalidate task cache when tools mutate tasks
    onSuccess: (response) => {
      if (response.conversation_id) {
        queryClient.invalidateQueries({
          queryKey: chatKeys.messages(userId!, response.conversation_id),
        });
      }
      // If the chat used task-mutating tools, invalidate dashboard caches
      const TASK_MUTATING_TOOLS = new Set([
        "add_task",
        "complete_task",
        "update_task",
        "delete_task",
      ]);
      if (
        userId &&
        response.tool_calls?.some((tc) => TASK_MUTATING_TOOLS.has(tc.tool))
      ) {
        queryClient.invalidateQueries({ queryKey: taskKeys.all(userId) });
        queryClient.invalidateQueries({ queryKey: statisticsKeys.all(userId) });
      }
    },
  });
}
