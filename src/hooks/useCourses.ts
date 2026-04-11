import { api } from '@/src/lib/api';
import type { Course, CreateCourseRequest, UpdateCourseRequest } from '@/src/types';
import { createQueryHook, createMutationHook } from './index';

// ============================================
// Courses Hooks
// ============================================

export const useCourses = createQueryHook(
  (params?: { category_id?: number }) => api.courses.list(params).then(res => res.data),
  { enabled: true }
);

export const useCourse = createQueryHook(
  (id: number) => api.courses.get(id).then(res => res.data),
  { enabled: true }
);

export const useCreateCourse = createMutationHook(
  (data: CreateCourseRequest) => api.courses.create(data).then(res => res.data)
);

export const useUpdateCourse = createMutationHook(
  (id: number, data: UpdateCourseRequest) => 
    api.courses.update(id, data).then(res => res.data)
);

export const useDeleteCourse = createMutationHook(
  (id: number) => api.courses.delete(id).then(res => res.data)
);
