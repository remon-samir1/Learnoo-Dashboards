import { api } from '@/src/lib/api';
import type { Department, CreateDepartmentRequest } from '@/src/types';
import { createQueryHook, createMutationHook } from './index';

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

export const useCreateDepartment = createMutationHook(
  (data: CreateDepartmentRequest) => api.departments.create(data).then(res => res.data)
);

export const useUpdateDepartment = createMutationHook(
  (id: number, data: CreateDepartmentRequest) => 
    api.departments.update(id, data).then(res => res.data)
);

export const useDeleteDepartment = createMutationHook(
  (id: number) => api.departments.delete(id).then(res => res.data)
);
