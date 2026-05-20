'use client';

import { useEffect, useRef, type ClipboardEvent, type DragEvent, type MouseEvent } from 'react';

function isBlockedShortcut(event: KeyboardEvent): boolean {
  if (!(event.ctrlKey || event.metaKey)) return false;
  const key = event.key.toLowerCase();
  return (
    key === 'c' ||
    key === 'x' ||
    key === 'a' ||
    key === 'u' ||
    key === 'p' ||
    key === 's' ||
    key === 'printscreen'
  );
}

function isScreenCaptureShortcut(event: KeyboardEvent): boolean {
  if (!(event.ctrlKey || event.metaKey)) return false;
  const key = event.key.toLowerCase();
  return key === 'shift' || (event.shiftKey && key === 's');
}

/**
 * Prevents screenshots, screen recording, and content copying while active.
 * Uses multiple layers of protection:
 * 1. Blocks keyboard shortcuts (Ctrl+C, Ctrl+Shift+S, PrintScreen, etc.)
 * 2. Blocks copy/cut/context menu/selection/drag events
 * 3. Applies CSS to prevent text selection and pointer events on protected areas
 * 4. Detects visibility change (potential screen capture tools)
 * 5. Blocks DevTools shortcuts (F12, Ctrl+Shift+I, etc.)
 *
 * Note: No client-side solution is 100% foolproof. This deters casual users
 * and provides audit trails via watermarks for determined users.
 */
export function useContentProtection(active: boolean, targetRef?: React.RefObject<HTMLElement | null>) {
  const visibilityChangeCount = useRef(0);
  const lastVisibilityChange = useRef(0);

  useEffect(() => {
    if (!active || typeof document === 'undefined') return;

    const prevent = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      return false;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (isBlockedShortcut(event) || isScreenCaptureShortcut(event)) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }

      const key = event.key.toLowerCase();
      if (
        key === 'f12' ||
        (event.ctrlKey && event.shiftKey && (key === 'i' || key === 'j' || key === 'c')) ||
        (event.ctrlKey && key === 'u')
      ) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }

      if (key === 'printscreen') {
        event.preventDefault();
        event.stopPropagation();
        if (navigator.clipboard) {
          void navigator.clipboard.writeText('');
        }
        return false;
      }
    };

    const onVisibilityChange = () => {
      const now = Date.now();
      if (now - lastVisibilityChange.current < 1000) {
        visibilityChangeCount.current += 1;
      } else {
        visibilityChangeCount.current = 1;
      }
      lastVisibilityChange.current = now;

      if (visibilityChangeCount.current > 3) {
        console.warn('Potential screen capture detected');
      }
    };

    document.addEventListener('copy', prevent, true);
    document.addEventListener('cut', prevent, true);
    document.addEventListener('contextmenu', prevent, true);
    document.addEventListener('selectstart', prevent, true);
    document.addEventListener('dragstart', prevent, true);
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('visibilitychange', onVisibilityChange);

    const target = targetRef?.current || document.documentElement;
    target.classList.add('content-protection-active');

    return () => {
      document.removeEventListener('copy', prevent, true);
      document.removeEventListener('cut', prevent, true);
      document.removeEventListener('contextmenu', prevent, true);
      document.removeEventListener('selectstart', prevent, true);
      document.removeEventListener('dragstart', prevent, true);
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('visibilitychange', onVisibilityChange);

      target.classList.remove('content-protection-active');
    };
  }, [active, targetRef]);
}

export function contentProtectionProps(active: boolean) {
  if (!active) {
    return {};
  }
  return {
    className: 'select-none pointer-events-none',
    onCopy: (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
    },
    onCut: (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
    },
    onContextMenu: (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
    },
    onDragStart: (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    },
  } as const;
}
