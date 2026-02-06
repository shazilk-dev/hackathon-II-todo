/**
 * React Query Hooks - Centralized Export
 *
 * Import all hooks from one place:
 * import { useTasks, useCreateTask } from '@/lib/hooks';
 */

// Task hooks
export {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useToggleTaskComplete,
  useDeleteTask,
  taskKeys,
} from './useTasks';

// Statistics hooks
export {
  useStatistics,
  statisticsKeys,
} from './useStatistics';

// Focus session hooks
export {
  useActiveFocusSession,
  useStartFocusSession,
  useEndFocusSession,
  focusSessionKeys,
} from './useFocusSession';

// Tag hooks
export {
  useTags,
  useCreateTag,
  useUpdateTaskTags,
  tagKeys,
} from './useTags';

// Chat hooks
export {
  useConversationMessages,
  useSendMessage,
  chatKeys,
} from './useChat';
