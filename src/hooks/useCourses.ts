import { useState, useCallback } from 'react';
import { api, ApiError } from '@/src/lib/api';
import type { Course, CreateCourseRequest, UpdateCourseRequest } from '@/src/types';
import { createQueryHook, createMutationHook, MutationState } from './index';

// ============================================
// Courses Hooks
// ============================================

/** Static filter for student course lists: `GET /v1/course?activated=1` (activated enrollments only). Lock vs unlock still comes from each course’s `is_locked` (or equivalent) in the payload. */
export const STUDENT_COURSES_LIST_PARAMS: { activated: number } = { activated: 1 };

export const useCourses = createQueryHook(
  (params?: { category_id?: number; activated?: number }) =>
    api.courses.list(params).then((res) => res.data),
  { enabled: true }
);

export const useCourse = createQueryHook(
  (id: number) => api.courses.get(id).then(res => res.data),
  { enabled: true }
);

// ============================================
// Mutation Hooks with Progress Support
// ============================================

// Custom mutation hook with progress support for file uploads (create)
export function useCreateCourse() {
  const [state, setState] = useState<MutationState<Course>>({
    data: null,
    isLoading: false,
    error: null,
    isError: false,
    isSuccess: false,
  });
  const [progress, setProgress] = useState(0);

  const mutate = useCallback(async (data: CreateCourseRequest, onProgress?: (progress: number) => void) => {
    setState({ data: null, isLoading: true, error: null, isError: false, isSuccess: false });
    setProgress(0);

    try {
      const result = await api.courses.create(data, (p) => {
        setProgress(p);
        onProgress?.(p);
      });
      setState({ data: result.data, isLoading: false, error: null, isError: false, isSuccess: true });
      setProgress(100);
      return result.data;
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : 'An error occurred while creating the course';
      setState({ data: null, isLoading: false, error: message, isError: true, isSuccess: false });
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null, isError: false, isSuccess: false });
    setProgress(0);
  }, []);

  return { ...state, mutate, reset, progress };
}

// Custom mutation hook with progress support for file uploads (update)
export function useUpdateCourse() {
  const [state, setState] = useState<MutationState<Course>>({
    data: null,
    isLoading: false,
    error: null,
    isError: false,
    isSuccess: false,
  });
  const [progress, setProgress] = useState(0);

  const mutate = useCallback(async (id: number, data: UpdateCourseRequest, onProgress?: (progress: number) => void) => {
    setState({ data: null, isLoading: true, error: null, isError: false, isSuccess: false });
    setProgress(0);

    try {
      const result = await api.courses.update(id, data, (p) => {
        setProgress(p);
        onProgress?.(p);
      });
      setState({ data: result.data, isLoading: false, error: null, isError: false, isSuccess: true });
      setProgress(100);
      return result.data;
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : 'An error occurred while updating the course';
      setState({ data: null, isLoading: false, error: message, isError: true, isSuccess: false });
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null, isError: false, isSuccess: false });
    setProgress(0);
  }, []);

  return { ...state, mutate, reset, progress };
}

export const useDeleteCourse = createMutationHook(
  (id: number) => api.courses.delete(id).then(res => res.data)
);
