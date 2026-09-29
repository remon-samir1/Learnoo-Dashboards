"use client";

/**
 * Keeps the student notification store fresh and raises browser notifications.
 *
 * Mounted once, from `StudentLayoutShell`, so there is a single poller / subscription for
 * the whole student area. Everything else (the bell panel, the notifications page) just
 * reads `useNotifications()`.
 *
 * Realtime: the backend only broadcasts on the public `global` Reverb channel, which is
 * not per-student, so its payload is never trusted as this student's notification — it is
 * used purely as a signal to refetch `GET /v1/notifications`, which is scoped to the
 * authenticated user. Polling covers the case where the socket is unreachable.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { getPusherClient } from '@/src/lib/pusher.client';
import {
  getBrowserNotificationPermission,
  isBrowserNotificationSupported,
  readBrowserNotificationPreference,
  requestBrowserNotificationPermission,
  showBrowserNotification,
  writeBrowserNotificationPreference,
  type BrowserNotificationPermission,
} from '@/src/lib/browser-notifications';
import { resolveStudentNotificationHref } from '@/src/lib/student-notification-target';
import {
  useNotificationActions,
  useNotificationStore,
} from '@/src/stores/notificationStore';
import type { StudentNotification } from '@/src/types/student-notification';

/** How often the list is refetched while the tab is visible. */
const POLL_INTERVAL_MS = 60_000;

/** Public channel the backend already broadcasts on (see `components/student/Navbar.tsx` history). */
const GLOBAL_CHANNEL = 'global';

export function useStudentNotificationsRuntime(initialNotifications: StudentNotification[]) {
  const locale = useLocale();
  const router = useRouter();
  const { seed, refresh } = useNotificationActions();

  const seededRef = useRef(false);
  const announcedRef = useRef<Set<string> | null>(null);

  // Seed from the server render so the bell has a count before the first fetch.
  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    seed(initialNotifications);
  }, [initialNotifications, seed]);

  // Poll while the tab is visible, and refetch as soon as it becomes visible again.
  useEffect(() => {
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      void refresh();
    };

    // The layout already fetched the list for this page load; only fetch straight away
    // when that seed did not happen (e.g. the server request failed).
    if (!useNotificationStore.getState().hasSeeded) tick();

    const interval = setInterval(tick, POLL_INTERVAL_MS);
    document.addEventListener('visibilitychange', tick);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [refresh]);

  // Realtime nudge: any broadcast on the public channel triggers a scoped refetch.
  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(GLOBAL_CHANNEL);

    channel.bind_global((eventName: string) => {
      if (typeof eventName === 'string' && eventName.startsWith('pusher_internal')) return;
      void refresh();
    });

    return () => {
      channel.unbind_global();
      pusher.unsubscribe(GLOBAL_CHANNEL);
    };
  }, [refresh]);

  // Raise a browser notification for unread items that appear after the first load.
  useEffect(() => {
    // Baseline: everything already known at mount is "old" and is never announced.
    if (announcedRef.current === null) {
      announcedRef.current = new Set(
        useNotificationStore.getState().notifications.map((item) => item.id),
      );
    }

    const seen = announcedRef.current;

    return useNotificationStore.subscribe((state, previous) => {
      if (state.notifications === previous.notifications) return;

      for (const item of state.notifications) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        if (item.read_at) continue;

        const title = item.data?.title?.trim() || item.data?.message?.trim() || '';
        if (!title) continue;

        const href = resolveStudentNotificationHref(item, locale);

        showBrowserNotification({
          title,
          body: item.data?.message?.trim() || undefined,
          tag: item.id,
          onClick: () => router.push(href ?? `/${locale}/student/notifications`),
        });
      }
    });
  }, [locale, router]);
}

export type UseBrowserNotificationToggle = {
  isSupported: boolean;
  permission: BrowserNotificationPermission;
  isEnabled: boolean;
  /** True when the browser blocked notifications, so the toggle should read as unavailable. */
  isBlocked: boolean;
  toggle: () => Promise<void>;
};

/**
 * Drives the opt-in toggle. Permission is requested from the click that turns it on and
 * never on mount, per the browser's user-gesture requirement.
 */
export function useBrowserNotificationToggle(): UseBrowserNotificationToggle {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<BrowserNotificationPermission>('default');
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    // Read-only: this inspects the stored preference, it does not prompt.
    const supported = isBrowserNotificationSupported();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsSupported(supported);
    setPermission(getBrowserNotificationPermission());
    setIsEnabled(supported && readBrowserNotificationPreference());
  }, []);

  const toggle = useCallback(async () => {
    if (!isSupported) return;

    if (isEnabled) {
      writeBrowserNotificationPreference(false);
      setIsEnabled(false);
      return;
    }

    const result = await requestBrowserNotificationPermission();
    setPermission(result);

    const granted = result === 'granted';
    writeBrowserNotificationPreference(granted);
    setIsEnabled(granted);
  }, [isEnabled, isSupported]);

  return {
    isSupported,
    permission,
    isEnabled,
    isBlocked: isSupported && permission === 'denied',
    toggle,
  };
}
