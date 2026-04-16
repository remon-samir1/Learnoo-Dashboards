import { useState, useCallback } from 'react';
import { api, ApiError } from '@/src/lib/api';
import type { Chapter, CreateChapterRequest, UpdateChapterRequest } from '@/src/types';
import { createQueryHook, createMutationHook, MutationState } from './index';

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

// ============================================
// Mutation Hooks with Progress Support
// ============================================

// Custom mutation hook with progress support for file uploads (create)
export function useCreateChapter() {
  const [state, setState] = useState<MutationState<Chapter>>({
    data: null,
    isLoading: false,
    error: null,
    isError: false,
    isSuccess: false,
  });
  const [progress, setProgress] = useState(0);

  const mutate = useCallback(async (data: CreateChapterRequest) => {
    setState({ data: null, isLoading: true, error: null, isError: false, isSuccess: false });
    setProgress(0);

    try {
      const result = await api.chapters.create(data, (p) => setProgress(p));
      setState({ data: result.data, isLoading: false, error: null, isError: false, isSuccess: true });
      setProgress(100);
      return result.data;
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : 'An error occurred while creating the chapter';
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
export function useUpdateChapter() {
  const [state, setState] = useState<MutationState<Chapter>>({
    data: null,
    isLoading: false,
    error: null,
    isError: false,
    isSuccess: false,
  });
  const [progress, setProgress] = useState(0);

  const mutate = useCallback(async (id: number, data: UpdateChapterRequest) => {
    setState({ data: null, isLoading: true, error: null, isError: false, isSuccess: false });
    setProgress(0);

    try {
      const result = await api.chapters.update(id, data, (p) => setProgress(p));
      setState({ data: result.data, isLoading: false, error: null, isError: false, isSuccess: true });
      setProgress(100);
      return result.data;
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : 'An error occurred while updating the chapter';
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

export const useDeleteChapter = createMutationHook(
  (id: number) => api.chapters.delete(id).then(res => res.data)
);

// Hook for copying a chapter
export const useCopyChapter = createMutationHook(
  (id: number, lectureId?: number) => api.chapters.copy(id, lectureId).then(res => res.data)
);
