import { preActivationApi, PreActivationUploadRequest } from '@/src/lib/api';
import { createQueryHook, createMutationHook } from './index';

// ============================================
// Pre-activation Hooks
// ============================================

export const usePreActivations = (courseId?: number) =>
  createQueryHook(() => preActivationApi.list(courseId), { enabled: true })();

export const useUploadPreActivation = () =>
  createMutationHook((data: PreActivationUploadRequest) =>
    preActivationApi.upload(data)
  )();

export const useDeletePreActivation = () =>
  createMutationHook((id: number) => preActivationApi.delete(id))();
