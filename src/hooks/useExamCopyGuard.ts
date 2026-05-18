'use client';

import { useEffect, type ClipboardEvent, type DragEvent, type MouseEvent } from 'react';

function isCopyShortcut(event: KeyboardEvent): boolean {
  if (!(event.ctrlKey || event.metaKey)) return false;
  const key = event.key.toLowerCase();
  return key === 'c' || key === 'x' || key === 'a' || key === 'u' || key === 'p' || key === 's';
}

/**
 * While active, blocks copy/cut/select/context menu and common keyboard shortcuts on the exam take flow.
 * Not foolproof (screenshots, devtools) — reduces casual copying of questions and answers.
 */
export function useExamCopyGuard(active: boolean) {
  useEffect(() => {
    if (!active || typeof document === 'undefined') return;

    const prevent = (event: Event) => {
      event.preventDefault();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (isCopyShortcut(event)) {
        event.preventDefault();
      }
    };

    const onDragStart = (event: Event) => {
      event.preventDefault();
    };

    document.addEventListener('copy', prevent);
    document.addEventListener('cut', prevent);
    document.addEventListener('contextmenu', prevent);
    document.addEventListener('selectstart', prevent);
    document.addEventListener('dragstart', onDragStart);
    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      document.removeEventListener('copy', prevent);
      document.removeEventListener('cut', prevent);
      document.removeEventListener('contextmenu', prevent);
      document.removeEventListener('selectstart', prevent);
      document.removeEventListener('dragstart', onDragStart);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [active]);
}

/** Props for a single exam content region (question card). */
export function examCopyGuardContentProps(active: boolean) {
  if (!active) {
    return {};
  }
  return {
    className: 'select-none',
    onCopy: (e: ClipboardEvent) => e.preventDefault(),
    onCut: (e: ClipboardEvent) => e.preventDefault(),
    onContextMenu: (e: MouseEvent) => e.preventDefault(),
    onDragStart: (e: DragEvent) => e.preventDefault(),
  } as const;
}
