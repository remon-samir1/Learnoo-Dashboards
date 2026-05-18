import type { AppRole } from '@/src/types/user-role';

/**
 * Role → default dashboard entry.
 * Use `student` for locale-aware paths (`/{locale}/student` or complete-profile).
 */
export const ROLE_TO_DASHBOARD: Record<AppRole, string | 'student'> = {
  Admin: '/dashboard',
  Instructor: '/doctor/dashboard',
  Doctor: '/doctor/dashboard',
  Student: 'student',
  Unknown: 'student',
};

/**
 * Protected route zones → roles allowed to access that zone.
 * Resolved by `getRouteZone()` in `auth-routes.ts`.
 */
export const ROUTE_ZONE_TO_ROLES = {
  onboarding: ['Student', 'Unknown'],
  admin: ['Admin'],
  doctor: ['Doctor', 'Instructor'],
  student: ['Student', 'Unknown'],
  'locale-root': ['Student', 'Unknown'],
} as const satisfies Record<string, readonly AppRole[]>;

/** Auth pages — signed-in users are redirected to their dashboard. */
export const AUTH_ROUTE_PREFIXES = [
  '/login',
  '/create-account',
  '/forgot-password',
  '/reset-password',
  '/verification-code',
] as const;

/** Post-register onboarding (token required). */
export const ONBOARDING_ROUTE_PREFIXES = [
  '/select-university',
  '/select-center',
  '/select-faculty',
] as const;

/**
 * Admin app routes — from `app/(admin)/*` (no `/admin` URL prefix).
 */
export const ADMIN_ROUTE_PREFIXES = [
  '/activation',
  '/centers',
  '/chapters',
  '/community',
  '/content-manager',
  '/courses',
  '/dashboard',
  '/departments',
  '/downloads',
  '/electronic-library',
  '/exams',
  '/faculties',
  '/feature-control',
  '/instructors',
  '/lectures',
  '/levels',
  '/live-sessions',
  '/notes-summaries',
  '/notifications',
  '/ota-upload',
  '/settings',
  '/students',
  '/universities',
] as const;

export const DOCTOR_ROUTE_PREFIX = '/doctor' as const;
