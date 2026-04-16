import { useState, useCallback } from 'react';
import { api, ApiError } from '@/src/lib/api';
import type { Student, CreateStudentRequest, StudentStatus } from '@/src/types';
import { createQueryHook, createMutationHook, MutationState } from './index';

// ============================================
// Students Hooks
// ============================================

export interface StudentsFilter {
  search?: string;
  status?: StudentStatus;
  university_id?: number | string;
  faculty_id?: number | string;
  center_id?: number | string;
  per_page?: number;
  page?: number;
}

// ============================================
// Query Hooks
// ============================================

export const useStudents = createQueryHook(
  (filter?: StudentsFilter) => api.students.list(filter),
  { enabled: true }
);

export const useStudent = createQueryHook(
  (id: string) => api.students.get(id),
  { enabled: true }
);

// ============================================
// Mutation Hooks with Progress Support
// ============================================

// Custom mutation hook with progress support for file uploads (create)
export function useCreateStudent() {
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
      const result = await api.students.create(data, (p) => setProgress(p));
      setState({ data: result.data, isLoading: false, error: null, isError: false, isSuccess: true });
      setProgress(100);
      return result.data;
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : 'An error occurred while creating the student';
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
export function useUpdateStudent() {
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
      const result = await api.students.update(id, data, (p) => setProgress(p));
      setState({ data: result.data, isLoading: false, error: null, isError: false, isSuccess: true });
      setProgress(100);
      return result.data;
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : 'An error occurred while updating the student';
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

export const useDeleteStudent = createMutationHook(
  (id: string) => api.students.delete(id)
);

export const useResetStudentPassword = createMutationHook(
  ({ studentId, password }: { studentId: string; password: string }) => 
    api.students.resetPassword(studentId, password)
);
