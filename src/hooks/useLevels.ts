import { api } from '@/src/lib/api';
import type { Level } from '@/src/types';
import { createQueryHook, createMutationHook } from './index';

// ============================================
// Levels Hooks
// ============================================

export const useLevels = createQueryHook(
  () => api.levels.list().then(res => res.data),
  { enabled: true }
);

export const useLevel = createQueryHook(
  (id: number) => api.levels.get(id).then(res => res.data),
  { enabled: true }
);

export const useCreateLevel = createMutationHook(
  (data: { name: string; description: string }) => api.levels.create(data).then(res => res.data)
);

export const useUpdateLevel = createMutationHook(
  (id: number, data: { name: string; description: string }) => 
    api.levels.update(id, data).then(res => res.data)
);

export const useDeleteLevel = createMutationHook(
  (id: number) => api.levels.delete(id).then(res => res.data)
);
