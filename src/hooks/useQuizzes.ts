import { useState, useCallback } from 'react';
import { api, ApiError } from '@/src/lib/api';
import type { Quiz, CreateQuizRequest, QuizQuestion, CreateQuizQuestionRequest, QuizAttempt } from '@/src/types';
import { createQueryHook, createMutationHook, MutationState } from './index';

// ============================================
// Quizzes & Exams Hooks
// ============================================

export const useQuizzes = createQueryHook(
  () => api.quizzes.list().then(res => res.data),
  { enabled: true }
);

export const useQuiz = createQueryHook(
  (id: number) => api.quizzes.get(id).then(res => res.data),
  { enabled: true }
);

export function useCreateQuiz() {
  const [state, setState] = useState<MutationState<Quiz>>({
    data: null,
    isLoading: false,
    error: null,
    isError: false,
    isSuccess: false,
  });
  const [progress, setProgress] = useState(0);

  const mutate = useCallback(async (data: CreateQuizRequest, onProgress?: (progress: number) => void) => {
    setState({ data: null, isLoading: true, error: null, isError: false, isSuccess: false });
    setProgress(0);

    try {
      const result = await api.quizzes.create(data, (p) => {
        setProgress(p);
        onProgress?.(p);
      });
      setState({ data: result.data, isLoading: false, error: null, isError: false, isSuccess: true });
      setProgress(100);
      return result.data;
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : 'An error occurred while creating the quiz';
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

export function useCreateQuizWithoutFiles() {
  const [state, setState] = useState<MutationState<Quiz>>({
    data: null,
    isLoading: false,
    error: null,
    isError: false,
    isSuccess: false,
  });

  const mutate = useCallback(async (data: CreateQuizRequest) => {
    setState({ data: null, isLoading: true, error: null, isError: false, isSuccess: false });

    try {
      const result = await api.quizzes.createWithoutFiles(data);
      setState({ data: result.data, isLoading: false, error: null, isError: false, isSuccess: true });
      return result.data;
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : 'An error occurred while creating the quiz';
      setState({ data: null, isLoading: false, error: message, isError: true, isSuccess: false });
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null, isError: false, isSuccess: false });
  }, []);

  return { ...state, mutate, reset };
}

export function useUpdateQuiz() {
  const [state, setState] = useState<MutationState<Quiz>>({
    data: null,
    isLoading: false,
    error: null,
    isError: false,
    isSuccess: false,
  });
  const [progress, setProgress] = useState(0);

  const mutate = useCallback(async (id: number, data: Partial<CreateQuizRequest>, onProgress?: (progress: number) => void) => {
    setState({ data: null, isLoading: true, error: null, isError: false, isSuccess: false });
    setProgress(0);

    try {
      const result = await api.quizzes.update(id, data, (p) => {
        setProgress(p);
        onProgress?.(p);
      });
      setState({ data: result.data, isLoading: false, error: null, isError: false, isSuccess: true });
      setProgress(100);
      return result.data;
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : 'An error occurred while updating the quiz';
      setState({ data: null, isLoading: false, error: message, isError: false, isSuccess: false });
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null, isError: false, isSuccess: false });
    setProgress(0);
  }, []);

  return { ...state, mutate, reset, progress };
}

export const useDeleteQuiz = createMutationHook(
  (id: number) => api.quizzes.delete(id).then(res => res.data)
);

// ============================================
// Quiz Questions Hooks
// ============================================

export const useQuizQuestions = createQueryHook(
  () => api.quizQuestions.list().then(res => res.data),
  { enabled: true }
);

export const useQuizQuestion = createQueryHook(
  (id: number) => api.quizQuestions.get(id).then(res => res.data),
  { enabled: true }
);

export const useCreateQuizQuestion = createMutationHook(
  (data: CreateQuizQuestionRequest) => api.quizQuestions.create(data).then(res => res.data)
);

export const useUpdateQuizQuestion = createMutationHook(
  (id: number, data: Partial<CreateQuizQuestionRequest>) => 
    api.quizQuestions.update(id, data).then(res => res.data)
);

export const useDeleteQuizQuestion = createMutationHook(
  (id: number) => api.quizQuestions.delete(id).then(res => res.data)
);

// ============================================
// Quiz Attempts Hooks
// ============================================

export const useQuizAttempts = createQueryHook(
  () => api.quizAttempts.list().then(res => res.data),
  { enabled: true }
);

export const useQuizAttempt = createQueryHook(
  (id: number) => api.quizAttempts.get(id).then(res => res.data),
  { enabled: true }
);

export const useStartQuizAttempt = createMutationHook(
  (data: any) => api.quizAttempts.start(data).then(res => res.data)
);

export const useSubmitQuizAttempt = createMutationHook(
  (id: number, data: any) => api.quizAttempts.submit(id, data).then(res => res.data)
);
