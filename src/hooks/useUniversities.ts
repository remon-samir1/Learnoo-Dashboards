import { useState, useCallback } from 'react';
import { api, ApiError } from '@/src/lib/api';
import type { University, CreateUniversityRequest } from '@/src/types';
import { createQueryHook, createMutationHook, MutationState } from './index';

// ============================================
// Universities Hooks
// ============================================

export const useUniversities = createQueryHook(
  () => api.universities.list().then(res => res.data),
  { enabled: true }
);

export const useUniversity = createQueryHook(
  (id: number) => api.universities.get(id).then(res => res.data),
  { enabled: true }
);

// Custom mutation hook with progress support for file uploads
export function useCreateUniversity() {
  const [state, setState] = useState<MutationState<University>>({
    data: null,
    isLoading: false,
    error: null,
    isError: false,
    isSuccess: false,
  });
  const [progress, setProgress] = useState(0);

  const mutate = useCallback(async (data: CreateUniversityRequest) => {
    setState({ data: null, isLoading: true, error: null, isError: false, isSuccess: false });
    setProgress(0);

    try {
      const result = await api.universities.create(data, (p) => setProgress(p));
      setState({ data: result.data, isLoading: false, error: null, isError: false, isSuccess: true });
      setProgress(100);
      return result.data;
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : 'An error occurred while creating the university';
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
export function useUpdateUniversity() {
  const [state, setState] = useState<MutationState<University>>({
    data: null,
    isLoading: false,
    error: null,
    isError: false,
    isSuccess: false,
  });
  const [progress, setProgress] = useState(0);

  const mutate = useCallback(async (id: number, data: Partial<CreateUniversityRequest>) => {
    setState({ data: null, isLoading: true, error: null, isError: false, isSuccess: false });
    setProgress(0);

    try {
      const result = await api.universities.update(id, data, (p) => setProgress(p));
      setState({ data: result.data, isLoading: false, error: null, isError: false, isSuccess: true });
      setProgress(100);
      return result.data;
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : 'An error occurred while updating the university';
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

export const useDeleteUniversity = createMutationHook(
  (id: number) => api.universities.delete(id)
);
