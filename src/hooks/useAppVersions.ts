import { useState, useCallback } from 'react';
import { api, ApiError } from '@/src/lib/api';
import type { AppVersion, CreateAppVersionRequest } from '@/src/types';
import { createQueryHook, createMutationHook, MutationState } from './index';

// ============================================
// App Versions Hooks (OTA)
// ============================================

export const useAppVersions = createQueryHook(
  () => api.appVersions.list().then(res => res.data || []),
  { enabled: true }
);

// Custom mutation hook with progress support for APK uploads
export function useCreateAppVersion() {
  const [state, setState] = useState<MutationState<AppVersion>>({
    data: null,
    isLoading: false,
    error: null,
    isError: false,
    isSuccess: false,
  });
  const [progress, setProgress] = useState(0);

  const mutate = useCallback(async (data: CreateAppVersionRequest) => {
    setState({ data: null, isLoading: true, error: null, isError: false, isSuccess: false });
    setProgress(0);

    try {
      const result = await api.appVersions.create(data, (p) => setProgress(p));
      setState({ data: result.data, isLoading: false, error: null, isError: false, isSuccess: true });
      setProgress(100);
      return result.data;
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : 'An error occurred while uploading the APK';
      setState({ data: null, isLoading: false, error: message, isError: true, isSuccess: false });
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null, isError: false, isSuccess: false });
    setProgress(0);
  }, []);

  return { ...state, mutate, reset, progress };
}

export const useUpdateAppVersion = createMutationHook(
  ({ id, data }: { id: number; data: Partial<CreateAppVersionRequest> }) =>
    api.appVersions.update(id, data).then(res => res.data)
);

export const useDeleteAppVersion = createMutationHook(
  (id: number) => api.appVersions.delete(id).then(res => res.data)
);
