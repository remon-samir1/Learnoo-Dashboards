import { isStudentAcademicProfileComplete } from '@/src/lib/student-profile-completeness';
import type { User } from '@/src/types';
import { isAppRole, isStudentLikeRole } from '@/src/types/user-role';

/**
 * Student app entry: only known missing academic details trigger profile completion.
 * Only applies after the user is authenticated (login/register).
 */
export function getStudentDashboardHref(
  locale: string,
  user: User | null | undefined,
): string {
  if (user?.attributes && ['university', 'faculty', 'centers'].every(key => key in user.attributes) && !isStudentAcademicProfileComplete(user.attributes)) {
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
  if (r === 'Super Admin') return '/dashboard';
  if (r === 'Admin') return '/departments';
  if (r === 'Instructor' || r === 'Doctor') return '/doctor/dashboard';
  if (r === 'Support') return '/support/issues';
  if (r === 'Parent') return '/parent/dashboard';
  if (isAppRole(r) && isStudentLikeRole(r)) {
    return getStudentDashboardHref(locale, user ?? null);
  }
  return '/login';
}
