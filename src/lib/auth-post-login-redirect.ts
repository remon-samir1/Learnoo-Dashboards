import { isStudentAcademicProfileComplete } from '@/src/lib/student-profile-completeness';
import type { User } from '@/src/types';
import { isAppRole, isStudentLikeRole } from '@/src/types/user-role';

/**
 * Student app entry: dashboard or complete-profile when university/faculty are missing.
 * Only applies after the user is authenticated (login/register).
 */
export function getStudentDashboardHref(
  locale: string,
  user: User | null | undefined,
): string {
  if (!isStudentAcademicProfileComplete(user?.attributes ?? null)) {
    return `/${locale}/student/complete-profile`;
  }
  return `/${locale}/student`;
}

export function parseUserFromCookie(value: string | undefined): User | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as User;
  } catch {
    return null;
  }
}

/**
 * Where to send the user after login/register once `token` + user cookies are set.
 */
export function getPostAuthHref(
  locale: string,
  role: string | null | undefined,
  user?: User | null,
): string {
  const r = role?.trim();
  if (r === 'Admin') return '/dashboard';
  if (r === 'Instructor' || r === 'Doctor') return '/doctor/dashboard';
  if (isAppRole(r) && isStudentLikeRole(r)) {
    return getStudentDashboardHref(locale, user ?? null);
  }
  return '/login';
}
