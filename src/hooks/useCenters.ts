import { api } from '@/src/lib/api';
import type { Center, CreateCenterRequest } from '@/src/types';
import { createQueryHook, createMutationHook } from './index';

// ============================================
// Centers Hooks
// ============================================

export const useCenters = createQueryHook(
  () => api.centers.list().then(res => res.data),
  { enabled: true }
);

export const useCenter = createQueryHook(
  (id: number) => api.centers.get(id).then(res => res.data),
  { enabled: true }
);

export const useCreateCenter = createMutationHook(
  (data: CreateCenterRequest) => api.centers.create(data).then(res => res.data)
);

export const useUpdateCenter = createMutationHook(
  (id: number, data: Partial<CreateCenterRequest>) => 
    api.centers.update(id, data).then(res => res.data)
);

export const useDeleteCenter = createMutationHook(
  (id: number) => api.centers.delete(id).then(res => res.data)
);
