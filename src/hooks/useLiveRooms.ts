import { api } from '@/src/lib/api';
import type { LiveRoom, CreateLiveRoomRequest } from '@/src/types';
import { createQueryHook, createMutationHook } from './index';

// ============================================
// Live Rooms Hooks (Live Sessions)
// ============================================

export const useLiveRooms = createQueryHook(
  () => api.liveRooms.list().then(res => res.data),
  { enabled: true }
);

export const useLiveRoom = createQueryHook(
  (id: number) => api.liveRooms.get(id).then(res => res.data),
  { enabled: true }
);

export const useCreateLiveRoom = createMutationHook(
  (data: CreateLiveRoomRequest) => api.liveRooms.create(data).then(res => res.data)
);

export const useUpdateLiveRoom = createMutationHook(
  (id: number, data: Partial<CreateLiveRoomRequest>) => 
    api.liveRooms.update(id, data).then(res => res.data)
);

export const useDeleteLiveRoom = createMutationHook(
  (id: number) => api.liveRooms.delete(id).then(res => res.data)
);
