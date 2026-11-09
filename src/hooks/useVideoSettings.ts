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

  // The save answers with the stored feature row, not the video settings
  // payload, so the fresh value comes from the refetch below rather than from
  // the mutation's own response.
  return useMutation<void, Error, UpdateVideoSettingsRequest>({
    mutationFn: async (data: UpdateVideoSettingsRequest) => {
      await api.videoSettings.update(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
