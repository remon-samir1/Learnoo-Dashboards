import { useState, useCallback } from 'react';
import { api, ApiError } from '@/src/lib/api';
import type { Student, CreateStudentRequest } from '@/src/types';
import { createQueryHook, createMutationHook, MutationState } from './index';

// ============================================
// Instructors Hooks
// ============================================

export interface InstructorsFilter {
  search?: string;
  university_id?: number | string;
  faculty_id?: number | string;
  center_id?: number | string;
  per_page?: number;
  page?: number;
}

// ============================================
// Query Hooks
// ============================================

export const useInstructors = createQueryHook(
  (filter?: InstructorsFilter) => api.instructors.list(filter),
  { enabled: true }
);

export const useInstructor = createQueryHook(
  (id: string) => api.instructors.get(id),
  { enabled: true }
);

// ============================================
// Mutation Hooks with Progress Support
// ============================================

// Custom mutation hook with progress support for file uploads (create)
export function useCreateInstructor() {
  const [state, setState] = useState<MutationState<Student>>({
    data: null,
    isLoading: false,
    error: null,
    isError: false,
    isSuccess: false,
  });
  const [progress, setProgress] = useState(0);

  const mutate = useCallback(async (data: CreateStudentRequest) => {
    setState({ data: null, isLoading: true, error: null, isError: false, isSuccess: false });
    setProgress(0);

    try {
      const result = await api.instructors.create(data, (p) => setProgress(p));
      setState({ data: result.data, isLoading: false, error: null, isError: false, isSuccess: true });
      setProgress(100);
      return result.data;
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : 'An error occurred while creating the instructor';
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
export function useUpdateInstructor() {
  const [state, setState] = useState<MutationState<Student>>({
    data: null,
    isLoading: false,
    error: null,
    isError: false,
    isSuccess: false,
  });
  const [progress, setProgress] = useState(0);

  const mutate = useCallback(async (id: string, data: Partial<CreateStudentRequest>) => {
    setState({ data: null, isLoading: true, error: null, isError: false, isSuccess: false });
    setProgress(0);

    try {
      const result = await api.instructors.update(id, data, (p) => setProgress(p));
      setState({ data: result.data, isLoading: false, error: null, isError: false, isSuccess: true });
      setProgress(100);
      return result.data;
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : 'An error occurred while updating the instructor';
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

export const useDeleteInstructor = createMutationHook(
  (id: string) => api.instructors.delete(id)
);
