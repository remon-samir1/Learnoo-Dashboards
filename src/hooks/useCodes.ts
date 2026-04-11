import { api } from '@/src/lib/api';
import type { Code, CreateCodeRequest, ActivateCodeRequest } from '@/src/types';
import { createQueryHook, createMutationHook } from './index';

// ============================================
// Codes Hooks
// ============================================

export const useCodes = createQueryHook(
  () => api.codes.list().then(res => res.data),
  { enabled: true }
);

export const useCode = createQueryHook(
  (id: number) => api.codes.get(id).then(res => res.data),
  { enabled: true }
);

export const useCreateCode = createMutationHook(
  (data: CreateCodeRequest) => api.codes.create(data).then(res => res.data)
);

export const useUpdateCode = createMutationHook(
  (id: number, data: Partial<CreateCodeRequest>) => 
    api.codes.update(id, data).then(res => res.data)
);

export const useDeleteCode = createMutationHook(
  (id: number) => api.codes.delete(id).then(res => res.data)
);

export const useActivateCode = createMutationHook(
  (data: ActivateCodeRequest) => api.codes.activate(data).then(res => res.data)
);
