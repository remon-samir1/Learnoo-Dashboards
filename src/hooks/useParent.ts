import { api } from '@/src/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse } from '@/src/types';
import type {
  ParentDashboardResponse,
  ProgressResponse,
  WeeklyStatsResponse,
  AlertItem,
  FeedbackItem,
  ActivityItem,
  LinkedStudent,
} from '@/src/types/parent.types';

// ============================================
// Parent Portal Hooks (powered by React Query v5)
// ============================================

export function useLinkedStudents() {
  return useQuery({
    queryKey: ['parent', 'linkedStudents'],
    queryFn: () => api.parent.linkedStudents(),
    staleTime: 60 * 1000,
  });
}

export function useLinkStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (student_code: string) => api.parent.linkStudent(student_code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parent', 'linkedStudents'] });
    },
  });
}

export function useStudentDashboard(id: string | number, options?: { enabled?: boolean }) {
  return useQuery<ApiResponse<ParentDashboardResponse>>({
    queryKey: ['parent', 'studentDashboard', String(id)],
    queryFn: () => api.parent.studentDashboard(id),
    enabled: Boolean(id) && options?.enabled !== false,
    staleTime: 30 * 1000,
  });
}

export function useStudentProgress(id: string | number, options?: { enabled?: boolean }) {
  return useQuery<ApiResponse<ProgressResponse>>({
    queryKey: ['parent', 'studentProgress', String(id)],
    queryFn: () => api.parent.studentProgress(id),
    enabled: Boolean(id) && options?.enabled !== false,
    staleTime: 30 * 1000,
  });
}

export function useStudentWeeklyStats(id: string | number, options?: { enabled?: boolean }) {
  return useQuery<ApiResponse<WeeklyStatsResponse>>({
    queryKey: ['parent', 'studentWeeklyStats', String(id)],
    queryFn: () => api.parent.studentWeeklyStats(id),
    enabled: Boolean(id) && options?.enabled !== false,
    staleTime: 30 * 1000,
  });
}

export function useStudentAlerts(id: string | number, options?: { enabled?: boolean }) {
  return useQuery<ApiResponse<AlertItem[]>>({
    queryKey: ['parent', 'studentAlerts', String(id)],
    queryFn: () => api.parent.studentAlerts(id),
    enabled: Boolean(id) && options?.enabled !== false,
    staleTime: 30 * 1000,
  });
}

export function useStudentFeedback(id: string | number, options?: { enabled?: boolean }) {
  return useQuery<ApiResponse<FeedbackItem[]>>({
    queryKey: ['parent', 'studentFeedback', String(id)],
    queryFn: () => api.parent.studentFeedback(id),
    enabled: Boolean(id) && options?.enabled !== false,
    staleTime: 30 * 1000,
  });
}

export function useStudentActivity(id: string | number, options?: { enabled?: boolean }) {
  return useQuery<ApiResponse<ActivityItem[]>>({
    queryKey: ['parent', 'studentActivity', String(id)],
    queryFn: () => api.parent.studentActivity(id),
    enabled: Boolean(id) && options?.enabled !== false,
    staleTime: 30 * 1000,
  });
}