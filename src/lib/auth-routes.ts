import type { NextRequest } from 'next/server';
import {
  getPostAuthHref,
  getStudentDashboardHref,
  parseUserFromCookie,
} from '@/src/lib/auth-post-login-redirect';
import { getRoleFromRequest } from '@/src/lib/proxy-auth';
import type { User } from '@/src/types';
import { APP_LOCALES, type AppLocale } from '@/src/lib/app-locales';
import {
  ADMIN_ROUTE_PREFIXES,
  AUTH_ROUTE_PREFIXES,
  DOCTOR_ROUTE_PREFIX,
  ONBOARDING_ROUTE_PREFIXES,
  ROLE_TO_DASHBOARD,
  ROUTE_ZONE_TO_ROLES,
} from '@/src/lib/role-route-config';
import { APP_ROLES, type AppRole, isAppRole } from '@/src/types/user-role';

export type RouteZone =
  | 'auth'
  | 'onboarding'
  | 'admin'
  | 'doctor'
  | 'student'
  | 'locale-root'
  | 'unknown';

/** @deprecated Use `ROLE_TO_DASHBOARD` from `role-route-config`. */
export const ROLE_DASHBOARD_PATH = ROLE_TO_DASHBOARD;

/** @deprecated Use `ROUTE_ZONE_TO_ROLES` from `role-route-config`. */
export const ROUTE_ZONE_ROLES = ROUTE_ZONE_TO_ROLES;

export {
  ADMIN_ROUTE_PREFIXES,
  AUTH_ROUTE_PREFIXES,
  DOCTOR_ROUTE_PREFIX,
  ONBOARDING_ROUTE_PREFIXES,
  ROLE_TO_DASHBOARD,
  ROUTE_ZONE_TO_ROLES,
};

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

  const mapped = ROLE_TO_DASHBOARD[role];
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

  const allowed = ROUTE_ZONE_TO_ROLES[zone];
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

/**
 * Proxy-safe auth resolution (reads `NextRequest.cookies`).
 * Mirrors `getUserDataFromJWT()` which uses `cookies()` from `next/headers`.
 */
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
  const role = getRoleFromRequest(request);

  return { token, role, locale, user };
}

export function isSupportedRole(role: string | null | undefined): role is AppRole {
  return isAppRole(role ?? undefined);
}

export { APP_ROLES, getPostAuthHref };
