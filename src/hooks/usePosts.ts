import { api } from '@/src/lib/api';
import type { Post, CreatePostRequest } from '@/src/types';
import { createQueryHook, createMutationHook } from './index';

// ============================================
// Posts Hooks (Community)
// ============================================

export const usePosts = createQueryHook<Post[], [number | null]>(
  (courseId) =>
    api.posts
      .list(
        courseId !== null && Number.isFinite(courseId) && courseId > 0
          ? { course_id: courseId }
          : undefined,
      )
      .then((res) => res.data),
  { enabled: true },
);

export const usePost = createQueryHook(
  (id: number) => api.posts.get(id).then(res => res.data),
  { enabled: true }
);

export const useCreatePost = createMutationHook(
  (data: CreatePostRequest) => api.posts.create(data).then(res => res.data)
);

export const useUpdatePost = createMutationHook(
  (id: number, data: Partial<CreatePostRequest>) => 
    api.posts.update(id, data).then(res => res.data)
);

export const useDeletePost = createMutationHook(
  (id: number) => api.posts.delete(id).then(res => res.data)
);

export const useReactToPost = createMutationHook(
  (postId: number, body: { type: 'like' }) =>
    api.posts.react(postId, body).then((res) => res.data),
);
