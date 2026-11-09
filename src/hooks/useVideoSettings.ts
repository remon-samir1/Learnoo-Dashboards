import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/src/lib/api';
import { parseSleepPerMinute } from '@/src/lib/video-settings';
import type { UpdateVideoSettingsRequest } from '@/src/types/video-settings';

const QUERY_KEY = 'videoSettings';

/** Minutes the lecture video keeps the phone screen awake, or `null` when the API has no value yet. */
export function useVideoSettings() {
  return useQuery<number | null>({
    queryKey: [QUERY_KEY],
    queryFn: async () => parseSleepPerMinute(await api.videoSettings.get()),
  });
}

export function useUpdateVideoSettings() {
  const queryClient = useQueryClient();

  return useMutation<number | null, Error, UpdateVideoSettingsRequest>({
    mutationFn: async (data: UpdateVideoSettingsRequest) =>
      parseSleepPerMinute(await api.videoSettings.update(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
