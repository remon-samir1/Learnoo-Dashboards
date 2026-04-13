import { api } from '@/src/lib/api';
import type { Comment, CreateCommentRequest } from '@/src/types';
import { createQueryHook, createMutationHook } from './index';

// ============================================
// Comments Hooks
// ============================================

export const useComments = createQueryHook(
  (postId: number) => api.comments.list(postId).then(res => res.data),
  { enabled: true }
);

export const useCreateComment = createMutationHook(
  (postId: number, data: CreateCommentRequest) =>
    api.comments.create(postId, data).then(res => res.data)
);

export const useDeleteComment = createMutationHook(
  (commentId: number) =>
    api.comments.delete(commentId).then(res => res.data)
);
