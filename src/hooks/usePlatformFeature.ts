import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/src/lib/api';
import type { PlatformFeature, UpdatePlatformFeatureRequest } from '@/src/types';

const QUERY_KEY = 'platformFeature';

export function usePlatformFeature() {
  return useQuery<PlatformFeature[]>({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      const response = await api.platformFeature.get();
      return response.data;
    },
  });
}

export function useUpdatePlatformFeature() {
  const queryClient = useQueryClient();

  return useMutation<PlatformFeature, Error, UpdatePlatformFeatureRequest>({
    mutationFn: async (data: UpdatePlatformFeatureRequest) => {
      const response = await api.platformFeature.storeOrUpdate(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
