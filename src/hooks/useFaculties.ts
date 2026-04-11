import { api } from '@/src/lib/api';
import type { Faculty, CreateFacultyRequest } from '@/src/types';
import { createQueryHook, createMutationHook } from './index';

// ============================================
// Faculties Hooks
// ============================================

export const useFaculties = createQueryHook(
  () => api.faculties.list().then(res => res.data),
  { enabled: true }
);

export const useFaculty = createQueryHook(
  (id: number) => api.faculties.get(id).then(res => res.data),
  { enabled: true }
);

export const useCreateFaculty = createMutationHook(
  (data: CreateFacultyRequest) => api.faculties.create(data).then(res => res.data)
);

export const useUpdateFaculty = createMutationHook(
  (id: number, data: CreateFacultyRequest) => 
    api.faculties.update(id, data).then(res => res.data)
);

export const useDeleteFaculty = createMutationHook(
  (id: number) => api.faculties.delete(id).then(res => res.data)
);
