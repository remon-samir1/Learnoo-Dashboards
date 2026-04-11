// ============================================
// Shared Hook Types & Utilities
// ============================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { ApiError } from '@/src/lib/api';

export interface QueryState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  isError: boolean;
}

export interface MutationState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  isError: boolean;
  isSuccess: boolean;
}

export type QueryOptions = {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  refetchInterval?: number;
  initialData?: unknown;
};

// ============================================
// Base Query Hook Factory
// ============================================

export function createQueryHook<T, P extends unknown[] = []>(
  fetcher: (...params: P) => Promise<T>,
  defaultOptions: QueryOptions = {}
) {
  return function useQuery(params: P, options: QueryOptions = {}) {
    const mergedOptions = { ...defaultOptions, ...options };
    const [state, setState] = useState<QueryState<T>>({
      data: mergedOptions.initialData as T | null,
      isLoading: mergedOptions.enabled !== false,
      error: null,
      isError: false,
    });

    const paramsRef = useRef(params);
    const isMountedRef = useRef(true);

    const execute = useCallback(async () => {
      if (mergedOptions.enabled === false) return;

      setState((prev) => ({ ...prev, isLoading: true, error: null, isError: false }));

      try {
        const data = await fetcher(...paramsRef.current);
        if (isMountedRef.current) {
          setState({ data, isLoading: false, error: null, isError: false });
        }
        return data;
      } catch (error) {
        if (isMountedRef.current) {
          const message = error instanceof ApiError 
            ? error.message 
            : 'An error occurred while fetching data';
          setState({ data: null, isLoading: false, error: message, isError: true });
        }
        throw error;
      }
    }, []);

    const refetch = useCallback(() => {
      paramsRef.current = params;
      return execute();
    }, [params]);

    const serializedParams = JSON.stringify(params);

    useEffect(() => {
      isMountedRef.current = true;
      paramsRef.current = params;
      execute();

      return () => {
        isMountedRef.current = false;
      };
    }, [serializedParams, mergedOptions.enabled]);

    // Refetch on window focus
    useEffect(() => {
      if (!mergedOptions.refetchOnWindowFocus) return;

      const handleFocus = () => {
        if (document.visibilityState === 'visible') {
          refetch();
        }
      };

      document.addEventListener('visibilitychange', handleFocus);
      return () => document.removeEventListener('visibilitychange', handleFocus);
    }, [refetch, mergedOptions.refetchOnWindowFocus]);

    // Refetch interval
    useEffect(() => {
      if (!mergedOptions.refetchInterval) return;

      const interval = setInterval(refetch, mergedOptions.refetchInterval);
      return () => clearInterval(interval);
    }, [refetch, mergedOptions.refetchInterval]);

    return { ...state, refetch };
  };
}

// ============================================
// Base Mutation Hook Factory
// ============================================

export function createMutationHook<T, P extends unknown[] = []>(
  mutator: (...params: P) => Promise<T>
) {
  return function useMutation() {
    const [state, setState] = useState<MutationState<T>>({
      data: null,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: false,
    });

    const mutate = useCallback(async (...params: P) => {
      setState({ data: null, isLoading: true, error: null, isError: false, isSuccess: false });

      try {
        const data = await mutator(...params);
        setState({ data, isLoading: false, error: null, isError: false, isSuccess: true });
        return data;
      } catch (error) {
        const message = error instanceof ApiError 
          ? error.message 
          : 'An error occurred while processing the request';
        setState({ data: null, isLoading: false, error: message, isError: true, isSuccess: false });
        throw error;
      }
    }, []);

    const reset = useCallback(() => {
      setState({ data: null, isLoading: false, error: null, isError: false, isSuccess: false });
    }, []);

    return { ...state, mutate, reset };
  };
}

// ============================================
// Re-export all API-specific hooks
// ============================================

export * from './useAuth';
export * from './useCenters';
export * from './useCourses';
export * from './useStudents';
export * from './useDashboard';
export * from './useDepartments';
export * from './useFaculties';
export * from './useUniversities';
export * from './useLevels';
export * from './useLibraries';
export * from './useLectures';
export * from './useChapters';
export * from './useQuizzes';
export * from './usePosts';
export * from './useCodes';
export * from './useLiveRooms';
export * from './useNotes';
