import { useState, useCallback } from 'react';
import { api, ApiError } from '@/src/lib/api';
import { createQueryHook, createMutationHook, MutationState } from './index';
import type { Library, CreateLibraryRequest, UpdateLibraryRequest } from '@/src/types';

// ============================================
// Libraries Query Hooks
// ============================================

export const useLibraries = createQueryHook(
  () => api.libraries.list().then(res => res.data),
  { enabled: true }
);

export const useLibrary = createQueryHook(
  (id: number) => api.libraries.get(id).then(res => res.data),
  { enabled: true }
);

// ============================================
// Mutation Hooks with Progress Support
// ============================================

// Custom mutation hook with progress support for file uploads (create)
export function useCreateLibrary() {
  const [state, setState] = useState<MutationState<Library>>({
    data: null,
    isLoading: false,
    error: null,
    isError: false,
    isSuccess: false,
  });
  const [progress, setProgress] = useState(0);

  const mutate = useCallback(async (data: CreateLibraryRequest) => {
    setState({ data: null, isLoading: true, error: null, isError: false, isSuccess: false });
    setProgress(0);

    try {
      const result = await api.libraries.create(data, (p) => setProgress(p));
      setState({ data: result.data, isLoading: false, error: null, isError: false, isSuccess: true });
      setProgress(100);
      return result.data;
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : 'An error occurred while creating the library item';
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
export function useUpdateLibrary() {
  const [state, setState] = useState<MutationState<Library>>({
    data: null,
    isLoading: false,
    error: null,
    isError: false,
    isSuccess: false,
  });
  const [progress, setProgress] = useState(0);

  const mutate = useCallback(async (id: number, data: UpdateLibraryRequest) => {
    setState({ data: null, isLoading: true, error: null, isError: false, isSuccess: false });
    setProgress(0);

    try {
      const result = await api.libraries.update(id, data, (p) => setProgress(p));
      setState({ data: result.data, isLoading: false, error: null, isError: false, isSuccess: true });
      setProgress(100);
      return result.data;
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : 'An error occurred while updating the library item';
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

export const useDeleteLibrary = createMutationHook(
  (id: number) => api.libraries.delete(id).then(res => res.data)
);
