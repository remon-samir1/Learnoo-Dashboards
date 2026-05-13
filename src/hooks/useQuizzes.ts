import { api } from '@/src/lib/api';
import type { Quiz, CreateQuizRequest, QuizQuestion, CreateQuizQuestionRequest, QuizAttempt, FinishQuizAttemptRequest, FinishQuizAttemptResponse } from '@/src/types';
import { createQueryHook, createMutationHook } from './index';

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

export const useCreateQuiz = createMutationHook(
  (data: CreateQuizRequest) => api.quizzes.create(data).then(res => res.data)
);

export const useUpdateQuiz = createMutationHook(
  (id: number, data: Partial<CreateQuizRequest>) => 
    api.quizzes.update(id, data).then(res => res.data)
);

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
  (id: number | string, data: FinishQuizAttemptRequest) =>
    api.quizAttempts.submit(id, data) as Promise<FinishQuizAttemptResponse>
);
