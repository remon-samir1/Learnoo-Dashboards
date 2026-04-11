import { api } from '@/src/lib/api';
import type { DashboardStats, ActivityData, RecentActivityItem } from '@/src/types';
import { createQueryHook } from './index';

// ============================================
// Dashboard Hooks
// ============================================

export const useDashboardStats = createQueryHook(
  () => api.dashboard.getStats(),
  { enabled: true, refetchInterval: 60000 } // Refetch every minute
);

export const useActivityData = createQueryHook(
  (period?: string) => api.dashboard.getActivity({ period }),
  { enabled: true }
);

export const useRecentActivity = createQueryHook(
  (limit?: number) => api.dashboard.getRecentActivity({ limit }),
  { enabled: true, refetchInterval: 30000 } // Refetch every 30 seconds
);

