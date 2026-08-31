import { api } from '@/src/lib/api';
import type { LiveRoom, CreateLiveRoomRequest } from '@/src/types';
import { createQueryHook, createMutationHook } from './index';

// ============================================
// Live Rooms Hooks (Live Sessions)
// ============================================

export const useLiveRooms = createQueryHook(
  async (params?: { page?: number; search?: string; per_page?: number }) => {
    if (params?.page) {
      const res = await api.liveRooms.list(params);
      return res.data;
    }

    const firstPage = await api.liveRooms.list({ ...params, page: 1, per_page: 100 });
    let allRooms = [...(firstPage.data || [])];
    const lastPage = firstPage.meta?.last_page || 1;

    if (lastPage > 1) {
      const pagePromises = [];
      for (let p = 2; p <= lastPage; p++) {
        pagePromises.push(api.liveRooms.list({ ...params, page: p, per_page: 100 }));
      }
      const restPages = await Promise.all(pagePromises);
      for (const pageRes of restPages) {
        if (pageRes.data) {
          allRooms.push(...pageRes.data);
        }
      }
    }

    return allRooms;
  },
  { enabled: true }
);

export const usePaginatedLiveRooms = createQueryHook(
  (params?: { page?: number; search?: string; per_page?: number }) => api.liveRooms.list(params),
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
