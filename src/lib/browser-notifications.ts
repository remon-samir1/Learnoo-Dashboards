/**
 * Opt-in browser (desktop) notifications for the student area.
 *
 * Permission is only ever requested from an explicit user gesture (the toggle in the
 * notifications panel) — never on page load. The opt-in is remembered in localStorage so
 * the toggle survives reloads, and everything degrades silently when the browser has no
 * Notification API or the user denied it.
 */

const STORAGE_KEY = 'learnoo:student:browser-notifications';

export type BrowserNotificationPermission = 'default' | 'granted' | 'denied' | 'unsupported';

export function isBrowserNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getBrowserNotificationPermission(): BrowserNotificationPermission {
  if (!isBrowserNotificationSupported()) return 'unsupported';
  try {
    return Notification.permission as BrowserNotificationPermission;
  } catch {
    return 'unsupported';
  }
}

/** Whether the student opted in. Storage can throw (private mode), so never let it bubble. */
export function readBrowserNotificationPreference(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function writeBrowserNotificationPreference(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {
    // Storage unavailable — the toggle still works for this tab.
  }
}

/**
 * Requests permission. Call this only from a user gesture.
 * Resolves with the resulting permission; never throws.
 */
export async function requestBrowserNotificationPermission(): Promise<BrowserNotificationPermission> {
  if (!isBrowserNotificationSupported()) return 'unsupported';

  try {
    if (Notification.permission !== 'default') {
      return Notification.permission as BrowserNotificationPermission;
    }
    const result = await Notification.requestPermission();
    return result as BrowserNotificationPermission;
  } catch {
    return 'unsupported';
  }
}

/**
 * Shows a notification when the student opted in and the browser granted permission.
 * Returns `false` when nothing was shown. `onClick` focuses the tab before running.
 */
export function showBrowserNotification(options: {
  title: string;
  body?: string;
  tag?: string;
  onClick?: () => void;
}): boolean {
  if (!isBrowserNotificationSupported()) return false;
  if (!readBrowserNotificationPreference()) return false;

  try {
    if (Notification.permission !== 'granted') return false;

    const notification = new Notification(options.title, {
      body: options.body,
      tag: options.tag,
      icon: '/logo.svg',
    });

    notification.onclick = () => {
      try {
        window.focus();
      } catch {
        // Focusing can be blocked; the callback still runs.
      }
      options.onClick?.();
      notification.close();
    };

    return true;
  } catch {
    return false;
  }
}
