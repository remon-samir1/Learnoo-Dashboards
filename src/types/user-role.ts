import type { UserAttributes } from '@/src/types';

/** Application roles — sourced from `UserAttributes['role']` in `src/types/index.ts`. */
export type AppRole = UserAttributes['role'];

/**
 * All roles detected in the codebase (auth store, user model, admin UI).
 * Keep in sync with `UserAttributes['role']`.
 */
export const APP_ROLES: readonly AppRole[] = [
  'Admin',
  'Doctor',
  'Student',
  'Unknown',
  'Instructor',
] as const;

export function isAppRole(value: string | null | undefined): value is AppRole {
  if (!value) return false;
  return (APP_ROLES as readonly string[]).includes(value);
}

export function isStudentLikeRole(role: AppRole | null | undefined): boolean {
  return role === 'Student' || role === 'Unknown';
}

export function isAdminZoneRole(role: AppRole | null | undefined): boolean {
  return role === 'Admin' || role === 'Instructor';
}
