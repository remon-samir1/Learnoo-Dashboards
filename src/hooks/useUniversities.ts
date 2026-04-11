import { api } from '@/src/lib/api';
import type { University, CreateUniversityRequest } from '@/src/types';
import { createQueryHook, createMutationHook } from './index';

// ============================================
// Universities Hooks
// ============================================

export const useUniversities = createQueryHook(
  () => api.universities.list().then(res => res.data),
  { enabled: true }
);

export const useUniversity = createQueryHook(
  (id: number) => api.universities.get(id).then(res => res.data),
  { enabled: true }
);

export const useCreateUniversity = createMutationHook(
  (data: CreateUniversityRequest) => api.universities.create(data).then(res => res.data)
);

export const useUpdateUniversity = createMutationHook(
  (id: number, data: CreateUniversityRequest) => 
    api.universities.update(id, data).then(res => res.data)
);

export const useDeleteUniversity = createMutationHook(
  (id: number) => api.universities.delete(id).then(res => res.data)
);
