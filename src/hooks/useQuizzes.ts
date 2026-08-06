'use client';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { api } from '@/src/lib/api';
import type {
  ApiListResponse,
  CreateQuizQuestionRequest,
  CreateQuizRequest,
  FinishQuizAttemptRequest,
  FinishQuizAttemptResponse,
  Quiz,
  QuizAttempt,
  QuizListParams,
  QuizQuestion,
  StartQuizAttemptRequest,
} from '@/src/types';

export const quizKeys = {
  all: ['quizzes'] as const,
  lists: () => [...quizKeys.all, 'list'] as const,
  list: (params: QuizListParams = {}) => [
    ...quizKeys.lists(),
    { page: params.page ?? 1, title: params.title?.trim() || undefined },
  ] as const,
  details: () => [...quizKeys.all, 'detail'] as const,
  detail: (id: number) => [...quizKeys.details(), id] as const,
  questions: () => [...quizKeys.all, 'questions'] as const,
  question: (id: number) => [...quizKeys.questions(), id] as const,
  attempts: () => [...quizKeys.all, 'attempts'] as const,
  attempt: (id: number) => [...quizKeys.attempts(), id] as const,
};

type QueryControl<T> = Pick<UseQueryOptions<T>, 'enabled' | 'initialData'>;

export function useQuizList(params: QuizListParams = {}, options: QueryControl<ApiListResponse<Quiz>> = {}) {
  return useQuery({
    queryKey: quizKeys.list(params),
    queryFn: () => api.quizzes.list(params),
    placeholderData: keepPreviousData,
    ...options,
  });
}

/** Backward-compatible unpaginated data shape used by activation screens. */
export function useQuizzes(params: QuizListParams = {}) {
  const query = useQuizList(params);
  return { ...query, data: query.data?.data };
}

export function useQuiz(id: number, options: QueryControl<Quiz> = {}) {
  return useQuery({
    queryKey: quizKeys.detail(id),
    queryFn: () => api.quizzes.get(id).then((response) => response.data),
    enabled: Number.isFinite(id) && id > 0 && options.enabled !== false,
    initialData: options.initialData,
  });
}

export function useCreateQuiz() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: CreateQuizRequest | FormData) => api.quizzes.create(data).then((response) => response.data),
    onSuccess: async (quiz) => {
      queryClient.setQueryData(quizKeys.detail(Number(quiz.id)), quiz);
      await queryClient.invalidateQueries({ queryKey: quizKeys.lists() });
    },
  });
  const mutateAsync = mutation.mutateAsync;
  return {
    ...mutation,
    mutate: mutateAsync,
    mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error?.message ?? null,
  };
}

export function useUpdateQuiz() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateQuizRequest> | FormData }) =>
      api.quizzes.update(id, data).then((response) => response.data),
    onSuccess: async (quiz, variables) => {
      queryClient.setQueryData(quizKeys.detail(variables.id), quiz);
      await queryClient.invalidateQueries({ queryKey: quizKeys.lists() });
    },
  });
  const mutateAsync = (id: number, data: Partial<CreateQuizRequest> | FormData) =>
    mutation.mutateAsync({ id, data });
  return {
    ...mutation,
    mutate: mutateAsync,
    mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error?.message ?? null,
  };
}

export function useDeleteQuiz() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (id: number) => api.quizzes.delete(id).then((response) => response.data),
    onSuccess: async (_data, id) => {
      queryClient.removeQueries({ queryKey: quizKeys.detail(id) });
      await queryClient.invalidateQueries({ queryKey: quizKeys.lists() });
    },
  });
  const mutateAsync = mutation.mutateAsync;
  return {
    ...mutation,
    mutate: mutateAsync,
    mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error?.message ?? null,
  };
}

export function useQuizQuestions() {
  return useQuery({
    queryKey: quizKeys.questions(),
    queryFn: () => api.quizQuestions.list().then((response) => response.data),
  });
}

export function useQuizQuestion(id: number) {
  return useQuery({
    queryKey: quizKeys.question(id),
    queryFn: () => api.quizQuestions.get(id).then((response) => response.data),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useCreateQuizQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateQuizQuestionRequest) =>
      api.quizQuestions.create(data).then((response) => response.data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: quizKeys.questions() });
      await queryClient.invalidateQueries({ queryKey: quizKeys.details() });
    },
  });
}

export function useUpdateQuizQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateQuizQuestionRequest> }) =>
      api.quizQuestions.update(id, data).then((response) => response.data),
    onSuccess: async (question: QuizQuestion, variables) => {
      queryClient.setQueryData(quizKeys.question(variables.id), question);
      await queryClient.invalidateQueries({ queryKey: quizKeys.questions() });
      await queryClient.invalidateQueries({ queryKey: quizKeys.details() });
    },
  });
}

export function useDeleteQuizQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.quizQuestions.delete(id).then((response) => response.data),
    onSuccess: async (_data, id) => {
      queryClient.removeQueries({ queryKey: quizKeys.question(id) });
      await queryClient.invalidateQueries({ queryKey: quizKeys.questions() });
      await queryClient.invalidateQueries({ queryKey: quizKeys.details() });
    },
  });
}

/**
 * The current API contract exposes only a global attempt list. This hook remains for
 * student-owned attempt history. Admin/Doctor result pages must not use it to fetch
 * every user's attempts and filter authorization-sensitive data in the browser.
 */
export function useQuizAttempts() {
  return useQuery<QuizAttempt[]>({
    queryKey: quizKeys.attempts(),
    queryFn: () => api.quizAttempts.list().then((response) => response.data),
  });
}

export function useQuizAttempt(id: number) {
  return useQuery({
    queryKey: quizKeys.attempt(id),
    queryFn: () => api.quizAttempts.get(id).then((response) => response.data),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useStartQuizAttempt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: StartQuizAttemptRequest) =>
      api.quizAttempts.start(data).then((response) => response.data),
    onSuccess: async (attempt) => {
      queryClient.setQueryData(quizKeys.attempt(Number(attempt.id)), attempt);
      await queryClient.invalidateQueries({ queryKey: quizKeys.attempts() });
    },
  });
}

export function useSubmitQuizAttempt() {
  const queryClient = useQueryClient();
  return useMutation<
    FinishQuizAttemptResponse,
    Error,
    { id: number | string; data: FinishQuizAttemptRequest }
  >({
    mutationFn: ({ id, data }) => api.quizAttempts.submit(id, data),
    onSuccess: async (_response, variables) => {
      queryClient.removeQueries({ queryKey: quizKeys.attempt(Number(variables.id)) });
      await queryClient.invalidateQueries({ queryKey: quizKeys.attempts() });
      await queryClient.invalidateQueries({ queryKey: quizKeys.details() });
    },
  });
}
