'use client';

import { useEffect, useRef } from 'react';

interface UseExamCheatingGuardOptions {
  onLeave?: () => void;
  onTabSwitch?: () => void;
  active?: boolean;
}

/**
 * Monitors exam session for "cheating" attempts or page leave.
 * Auto-submits or warns when the user tries to navigate away or close the tab.
 */
export function useExamCheatingGuard({
  onLeave,
  onTabSwitch,
  active = true,
}: UseExamCheatingGuardOptions) {
  const onLeaveRef = useRef(onLeave);
  const onTabSwitchRef = useRef(onTabSwitch);

  useEffect(() => {
    onLeaveRef.current = onLeave;
  }, [onLeave]);

  useEffect(() => {
    onTabSwitchRef.current = onTabSwitch;
  }, [onTabSwitch]);

  useEffect(() => {
    if (!active) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Trigger the leave callback (usually for auto-submission)
      if (onLeaveRef.current) {
        onLeaveRef.current();
      }
      
      // Standard browser warning (caller can still opt-out if they want to block navigation)
      // Note: Modern browsers often ignore the message and show a generic one.
      e.preventDefault();
      // e.returnValue = ''; // Some browsers require this
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (onTabSwitchRef.current) {
          onTabSwitchRef.current();
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [active]);
}
