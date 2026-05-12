import { api } from '@/src/lib/api';
import type { Note, CreateNoteRequest } from '@/src/types';
import { createQueryHook, createMutationHook } from './index';

// ============================================
// Notes Hooks (Notes & Summaries)
// ============================================

export const useNotes = createQueryHook(
  () => api.notes.list().then(res => res.data),
  { enabled: true }
);

export const useNote = createQueryHook(
  (id: number) => api.notes.get(id).then(res => res.data),
  { enabled: true }
);

export const useCreateNote = createMutationHook(
  (data: CreateNoteRequest) => api.notes.create(data).then(res => res.data)
);

export const useUpdateNote = createMutationHook(
  (id: number, data: CreateNoteRequest) => 
    api.notes.update(id, data).then(res => res.data)
);

export const useDeleteNote = createMutationHook(
  (id: number) => api.notes.delete(id).then(res => res.data)
);
