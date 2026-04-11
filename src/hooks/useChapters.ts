import { api } from '@/src/lib/api';
import type { Chapter, CreateChapterRequest, UpdateChapterRequest } from '@/src/types';
import { createQueryHook, createMutationHook } from './index';

// ============================================
// Chapters Hooks
// ============================================

export const useChapters = createQueryHook(
  (params?: { lecture_id?: number }) => api.chapters.list(params).then(res => res.data),
  { enabled: true }
);

export const useChapter = createQueryHook(
  (id: number) => api.chapters.get(id).then(res => res.data),
  { enabled: true }
);

export const useCreateChapter = createMutationHook(
  (data: CreateChapterRequest) => api.chapters.create(data).then(res => res.data)
);

export const useUpdateChapter = createMutationHook(
  (id: number, data: UpdateChapterRequest) => 
    api.chapters.update(id, data).then(res => res.data)
);

export const useDeleteChapter = createMutationHook(
  (id: number) => api.chapters.delete(id).then(res => res.data)
);
