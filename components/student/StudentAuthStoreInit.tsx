'use client';

import { useLayoutEffect } from 'react';
import { initializeAuthStore } from '@/src/stores/authStore';

/**
 * Student shell never mounted admin/doctor sidebars that call `initializeAuthStore()`.
 * Hydrate Zustand `user`/`token` from cookies so client features (e.g. video static overlay) work.
 */
export function StudentAuthStoreInit() {
  useLayoutEffect(() => {
    initializeAuthStore();
  }, []);
  return null;
}
