import { useState, useCallback } from 'react';
import { api, ApiError } from '@/src/lib/api';
import type { Department, CreateDepartmentRequest } from '@/src/types';
import { createQueryHook, createMutationHook, MutationState } from './index';

// ============================================
// Departments Hooks (Subjects)
// ============================================

export const useDepartments = createQueryHook(
  () => api.departments.list().then(res => res.data),
  { enabled: true }
);

export const useDepartment = createQueryHook(
  (id: number) => api.departments.get(id).then(res => res.data),
  { enabled: true }
);

// Custom mutation hook with progress support for file uploads
export function useCreateDepartment() {
  const [state, setState] = useState<MutationState<Department>>({
    data: null,
    isLoading: false,
    error: null,
    isError: false,
    isSuccess: false,
  });
  const [progress, setProgress] = useState(0);

  const mutate = useCallback(async (data: CreateDepartmentRequest, onProgress?: (progress: number) => void) => {
    setState({ data: null, isLoading: true, error: null, isError: false, isSuccess: false });
    setProgress(0);

    try {
      const result = await api.departments.create(data, (p) => {
        setProgress(p);
        onProgress?.(p);
      });
      setState({ data: result.data, isLoading: false, error: null, isError: false, isSuccess: true });
      setProgress(100);
      return result.data;
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : 'An error occurred while creating the department';
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
export function useUpdateDepartment() {
  const [state, setState] = useState<MutationState<Department>>({
    data: null,
    isLoading: false,
    error: null,
    isError: false,
    isSuccess: false,
  });
  const [progress, setProgress] = useState(0);

  const mutate = useCallback(async (id: number, data: Partial<CreateDepartmentRequest>, onProgress?: (progress: number) => void) => {
    setState({ data: null, isLoading: true, error: null, isError: false, isSuccess: false });
    setProgress(0);

    try {
      const result = await api.departments.update(id, data, (p) => {
        setProgress(p);
        onProgress?.(p);
      });
      setState({ data: result.data, isLoading: false, error: null, isError: false, isSuccess: true });
      setProgress(100);
      return result.data;
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : 'An error occurred while updating the department';
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

export const useDeleteDepartment = createMutationHook(
  (id: number) => api.departments.delete(id).then(res => res.data)
);
