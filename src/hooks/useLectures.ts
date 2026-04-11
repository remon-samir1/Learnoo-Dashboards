import { api } from '@/src/lib/api';
import type { Lecture, CreateLectureRequest } from '@/src/types';
import { createQueryHook, createMutationHook } from './index';

// ============================================
// Lectures Hooks
// ============================================

export const useLectures = createQueryHook(
  (params?: { course_id?: number }) => api.lectures.list(params).then(res => res.data),
  { enabled: true }
);

export const useLecture = createQueryHook(
  (id: number) => api.lectures.get(id).then(res => res.data),
  { enabled: true }
);

export const useCreateLecture = createMutationHook(
  (data: CreateLectureRequest) => api.lectures.create(data).then(res => res.data)
);

export const useUpdateLecture = createMutationHook(
  (id: number, data: Partial<CreateLectureRequest>) => 
    api.lectures.update(id, data).then(res => res.data)
);

export const useDeleteLecture = createMutationHook(
  (id: number) => api.lectures.delete(id).then(res => res.data)
);
