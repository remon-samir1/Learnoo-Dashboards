import { api } from '@/src/lib/api';
import type { Discussion, CreateDiscussionRequest } from '@/src/types';
import { createQueryHook, createMutationHook } from './index';

// ============================================
// Discussions Hooks
// ============================================

export const useDiscussions = createQueryHook(
  (params?: any) => api.discussions.list(params).then(res => res.data),
  { enabled: true }
);

export const useCreateDiscussion = createMutationHook(
  (data: CreateDiscussionRequest) =>
    api.discussions.create(data).then(res => res.data)
);

export const useDeleteDiscussion = createMutationHook(
  (discussionId: number) =>
    api.discussions.delete(discussionId).then(res => res.data)
);
