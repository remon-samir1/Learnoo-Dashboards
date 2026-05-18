import type { NextRequest } from 'next/server';
import {
  getPostAuthHref,
  getStudentDashboardHref,
  parseUserFromCookie,
} from '@/src/lib/auth-post-login-redirect';
import { getJwtUserDataFromToken } from '@/src/lib/jwt-decode';
import type { User } from '@/src/types';
import { APP_LOCALES, type AppLocale } from '@/src/lib/app-locales';
import { APP_ROLES, type AppRole, isAppRole } from '@/src/types/user-role';

export type RouteZone =
  | 'auth'
  | 'onboarding'
  | 'admin'
  | 'doctor'
  | 'student'
  | 'locale-root'
  | 'unknown';

/**
 * Role → default dashboard (student paths are locale-aware; use `getDashboardForRole`).
 */
export const ROLE_DASHBOARD_PATH: Record<AppRole, string | 'student'> = {
  Admin: '/dashboard',
  Instructor: '/dashboard',
  Doctor: '/doctor/dashboard',
  Student: 'student',
  Unknown: 'student',
};

/**
 * Route zone → roles allowed to access it.
 */
export const ROUTE_ZONE_ROLES: Record<
  Exclude<RouteZone, 'auth' | 'unknown'>,
  readonly AppRole[]
> = {
  onboarding: ['Student', 'Unknown'],
  admin: ['Admin', 'Instructor'],
  doctor: ['Doctor'],
  student: ['Student', 'Unknown'],
  'locale-root': ['Student', 'Unknown'],
};

/** Auth pages (unauthenticated or redirect if already signed in). */
export const AUTH_ROUTE_PREFIXES = [
  '/login',
  '/create-account',
  '/forgot-password',
  '/reset-password',
  '/verification-code',
] as const;

/** Post-register / profile onboarding (token required). */
export const ONBOARDING_ROUTE_PREFIXES = [
  '/select-university',
  '/select-center',
  '/select-faculty',
] as const;

/**
 * Admin app routes — derived from `app/(admin)/*` (URL has no `/admin` prefix).
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

export const DOCTOR_ROUTE_PREFIX = '/doctor';

export type ProxyAuthContext = {
  token: string | null;
  role: AppRole | null;
  locale: AppLocale;
  user: User | null;
};

export function normalizePathname(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  return pathname.length > 1 && pathname.endsWith('/')
    ? pathname.slice(0, -1)
    : pathname;
}

export function parseLocaleFromPath(pathname: string): AppLocale | null {
  const segment = pathname.split('/').filter(Boolean)[0];
  if (segment && (APP_LOCALES as readonly string[]).includes(segment)) {
    return segment as AppLocale;
  }
  return null;
}

export function stripLocalePrefix(pathname: string): {
  locale: AppLocale | null;
  pathWithoutLocale: string;
} {
  const normalized = normalizePathname(pathname);
  const locale = parseLocaleFromPath(normalized);
  if (!locale) {
    return { locale: null, pathWithoutLocale: normalized };
  }
  const segments = normalized.split('/').filter(Boolean);
  const rest = segments.slice(1);
  const pathWithoutLocale =
    rest.length === 0 ? '/' : `/${rest.join('/')}`;
  return { locale, pathWithoutLocale: normalizePathname(pathWithoutLocale) };
}

export function matchesRoutePrefix(
  pathname: string,
  prefixes: readonly string[],
): boolean {
  const p = normalizePathname(pathname);
  return prefixes.some((prefix) => p === prefix || p.startsWith(`${prefix}/`));
}

export function getRouteZone(pathname: string): RouteZone {
  const normalized = normalizePathname(pathname);

  if (normalized === '/' || matchesRoutePrefix(normalized, AUTH_ROUTE_PREFIXES)) {
    return 'auth';
  }

  if (matchesRoutePrefix(normalized, ONBOARDING_ROUTE_PREFIXES)) {
    return 'onboarding';
  }

  const { pathWithoutLocale } = stripLocalePrefix(normalized);

  if (
    pathWithoutLocale === '/student' ||
    pathWithoutLocale.startsWith('/student/')
  ) {
    return 'student';
  }

  if (
    normalized === DOCTOR_ROUTE_PREFIX ||
    normalized.startsWith(`${DOCTOR_ROUTE_PREFIX}/`)
  ) {
    return 'doctor';
  }

  if (matchesRoutePrefix(normalized, ADMIN_ROUTE_PREFIXES)) {
    return 'admin';
  }

  const locale = parseLocaleFromPath(normalized);
  if (locale && pathWithoutLocale === '/') {
    return 'locale-root';
  }

  return 'unknown';
}

export function getDashboardForRole(
  locale: AppLocale,
  role: AppRole | null | undefined,
  user: User | null | undefined,
): string {
  if (!role || !isAppRole(role)) return '/login';

  const mapped = ROLE_DASHBOARD_PATH[role];
  if (mapped === 'student') {
    return getStudentDashboardHref(locale, user ?? null);
  }
  return mapped;
}

export function roleCanAccessZone(
  role: AppRole | null | undefined,
  zone: RouteZone,
): boolean {
  if (!role || !isAppRole(role)) return false;

  if (zone === 'auth' || zone === 'unknown') return false;

  const allowed = ROUTE_ZONE_ROLES[zone];
  return (allowed as readonly string[]).includes(role);
}

/** Redirect student away from app until profile is complete (except on complete-profile page). */
export function getStudentProfileGateRedirect(
  pathname: string,
  locale: AppLocale,
  user: User | null,
): string | null {
  const targetHref = getStudentDashboardHref(locale, user);
  const onCompleteProfile = pathname.includes('/student/complete-profile');
  if (!onCompleteProfile && targetHref.endsWith('/complete-profile')) {
    return targetHref;
  }
  return null;
}

export function resolveProxyAuth(request: NextRequest): ProxyAuthContext {
  const rawToken = request.cookies.get('token')?.value ?? null;
  const token = rawToken?.replace(/^Bearer\s+/i, '').trim() || null;
  const cookieLocale = request.cookies.get('locale')?.value;
  const locale: AppLocale = (APP_LOCALES as readonly string[]).includes(
    cookieLocale ?? '',
  )
    ? (cookieLocale as AppLocale)
    : 'en';

  const user = parseUserFromCookie(request.cookies.get('user_data')?.value);

  let role: AppRole | null = null;
  const cookieRole = request.cookies.get('user_role')?.value;
  if (isAppRole(cookieRole)) {
    role = cookieRole;
  } else if (isAppRole(user?.attributes?.role)) {
    role = user!.attributes.role;
  } else if (token) {
    const jwtRole = getJwtUserDataFromToken(token)?.data?.role;
    if (typeof jwtRole === 'string' && isAppRole(jwtRole)) {
      role = jwtRole;
    }
  }

  return { token, role, locale, user };
}

export function isSupportedRole(role: string | null | undefined): role is AppRole {
  return isAppRole(role ?? undefined);
}

export { APP_ROLES, getPostAuthHref };
