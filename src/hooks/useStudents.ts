import { api } from '@/src/lib/api';
import type { Student, CreateStudentRequest } from '@/src/types';
import { createQueryHook, createMutationHook } from './index';

// ============================================
// Students Hooks
// ============================================

export interface StudentsFilter {
  search?: string;
  status?: string;
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
// Mutation Hooks
// ============================================

export const useCreateStudent = createMutationHook(
  (data: CreateStudentRequest) => api.students.create(data)
);

export const useUpdateStudent = createMutationHook(
  (id: string, data: Partial<CreateStudentRequest>) => 
    api.students.update(id, data)
);

export const useDeleteStudent = createMutationHook(
  (id: string) => api.students.delete(id)
);
