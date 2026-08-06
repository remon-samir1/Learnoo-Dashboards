import { api } from '@/src/lib/api';
import type { Discussion, CreateDiscussionRequest } from '@/src/types';
import { createQueryHook, createMutationHook } from './index';

// ============================================
// Discussions Hooks
// ============================================

export const useDiscussions = createQueryHook(
  (params?: any) => api.discussions.list(params),
  { enabled: true }
);

/**
 * Create a discussion.
 *
 * The API endpoint accepts either a typed JSON body (`CreateDiscussionRequest`)
 * or a multipart `FormData` (used by the chapter watch composer to attach a
 * voice recording and/or screenshot). Mirror that union here so callers can
 * submit either shape.
 */
export const useCreateDiscussion = createMutationHook(
  (data: CreateDiscussionRequest | FormData) =>
    api.discussions.create(data).then(res => res.data)
);

export const useDeleteDiscussion = createMutationHook(
  (discussionId: number) =>
    api.discussions.delete(discussionId).then(res => res.data)
);
