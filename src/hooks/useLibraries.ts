import { api } from '@/src/lib/api';
import type { Library, CreateLibraryRequest, UpdateLibraryRequest } from '@/src/types';
import { createQueryHook, createMutationHook } from './index';

// ============================================
// Libraries Hooks (Electronic Library)
// ============================================

export const useLibraries = createQueryHook(
  () => api.libraries.list().then(res => res.data),
  { enabled: true }
);

export const useLibrary = createQueryHook(
  (id: number) => api.libraries.get(id).then(res => res.data),
  { enabled: true }
);

export const useCreateLibrary = createMutationHook(
  (data: CreateLibraryRequest) => api.libraries.create(data).then(res => res.data)
);

export const useUpdateLibrary = createMutationHook(
  (id: number, data: UpdateLibraryRequest) => 
    api.libraries.update(id, data).then(res => res.data)
);

export const useDeleteLibrary = createMutationHook(
  (id: number) => api.libraries.delete(id).then(res => res.data)
);
