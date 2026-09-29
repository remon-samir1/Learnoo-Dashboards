/**
 * Shared student-notification state.
 *
 * The bell in the header and the notifications page render from the same store, so marking
 * one item read on the page immediately drops the badge count in the header. The list is
 * seeded from the server render (`app/[locale]/student/layout.tsx`) and kept fresh by
 * `useStudentNotifications`, which owns the polling / realtime subscription.
 */

import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { notificationsApi, getApiErrorMessage } from '@/src/lib/api';
import {
  mergeStudentNotifications,
  normalizeStudentNotificationMeta,
  normalizeStudentNotifications,
  sortStudentNotifications,
} from '@/src/lib/student-notification-target';
import type { StudentNotification } from '@/src/types/student-notification';

interface NotificationState {
  notifications: StudentNotification[];
  /** Server-reported unread count when available, otherwise derived from the list. */
  unreadCount: number;
  isLoading: boolean;
  isMarkingAll: boolean;
  error: string | null;
  /** True once the list was seeded, so the first refresh does not re-announce everything. */
  hasSeeded: boolean;

  seed: (items: StudentNotification[]) => void;
  refresh: () => Promise<void>;
  receive: (item: StudentNotification) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

function countUnread(items: StudentNotification[]): number {
  return items.filter((item) => !item.read_at).length;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isMarkingAll: false,
  error: null,
  hasSeeded: false,

  seed: (items) => {
    const notifications = sortStudentNotifications(
      items.filter((item) => item && item.id != null).map((item) => ({ ...item, id: String(item.id) })),
    );

    set({
      notifications,
      unreadCount: countUnread(notifications),
      hasSeeded: true,
    });
  },

  refresh: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await notificationsApi.list();
      const incoming = normalizeStudentNotifications(response);
      const meta = normalizeStudentNotificationMeta(response);

      // A refetch is authoritative for the first page, but keep older rows already loaded.
      const notifications = mergeStudentNotifications(incoming, get().notifications);

      set({
        notifications,
        unreadCount:
          typeof meta?.unread_count === 'number' ? meta.unread_count : countUnread(notifications),
        isLoading: false,
        hasSeeded: true,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: getApiErrorMessage(error, 'Failed to fetch notifications'),
      });
    }
  },

  receive: (item) => {
    if (!item || item.id == null) return;

    const incoming: StudentNotification = { ...item, id: String(item.id) };
    const notifications = mergeStudentNotifications([incoming], get().notifications);

    set({ notifications, unreadCount: countUnread(notifications) });
  },

  markAsRead: async (id) => {
    const { notifications } = get();
    const target = notifications.find((item) => item.id === id);
    if (!target || target.read_at) return;

    const readAt = new Date().toISOString();
    const optimistic = notifications.map((item) =>
      item.id === id ? { ...item, read_at: readAt } : item,
    );

    set({ notifications: optimistic, unreadCount: countUnread(optimistic), error: null });

    try {
      await notificationsApi.markAsRead(id);
    } catch (error) {
      // Roll back so the badge keeps reflecting the server.
      const reverted = get().notifications.map((item) =>
        item.id === id ? { ...item, read_at: target.read_at } : item,
      );
      set({
        notifications: reverted,
        unreadCount: countUnread(reverted),
        error: getApiErrorMessage(error, 'Failed to mark the notification as read'),
      });
    }
  },

  markAllAsRead: async () => {
    const previous = get().notifications;
    if (countUnread(previous) === 0) return;

    const readAt = new Date().toISOString();
    const optimistic = previous.map((item) =>
      item.read_at ? item : { ...item, read_at: readAt },
    );

    set({ notifications: optimistic, unreadCount: 0, isMarkingAll: true, error: null });

    try {
      await notificationsApi.markAllAsRead();
      set({ isMarkingAll: false });
    } catch (error) {
      set({
        notifications: previous,
        unreadCount: countUnread(previous),
        isMarkingAll: false,
        error: getApiErrorMessage(error, 'Failed to mark all notifications as read'),
      });
    }
  },
}));

export function useNotifications() {
  return useNotificationStore(
    useShallow((state) => ({
      notifications: state.notifications,
      unreadCount: state.unreadCount,
      isLoading: state.isLoading,
      isMarkingAll: state.isMarkingAll,
      error: state.error,
      hasSeeded: state.hasSeeded,
    })),
  );
}

export function useNotificationActions() {
  return useNotificationStore(
    useShallow((state) => ({
      seed: state.seed,
      refresh: state.refresh,
      receive: state.receive,
      markAsRead: state.markAsRead,
      markAllAsRead: state.markAllAsRead,
    })),
  );
}
