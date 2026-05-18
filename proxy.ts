import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  getDashboardForRole,
  getPostAuthHref,
  getRouteZone,
  getStudentProfileGateRedirect,
  normalizePathname,
  resolveProxyAuth,
  roleCanAccessZone,
  isSupportedRole,
} from '@/src/lib/auth-routes';

const AUTH_COOKIE_NAMES = ['token', 'user_role', 'user_data'] as const;

function redirectTo(request: NextRequest, href: string) {
  return NextResponse.redirect(new URL(href, request.url));
}

function clearSessionAndRedirectToLogin(request: NextRequest) {
  const response = redirectTo(request, '/login');
  for (const name of AUTH_COOKIE_NAMES) {
    response.cookies.delete(name);
  }
  return response;
}

export function proxy(request: NextRequest) {
  const pathname = normalizePathname(request.nextUrl.pathname);
  const zone = getRouteZone(pathname);
  const auth = resolveProxyAuth(request);

  // --- Auth / marketing entry (login, register, home) ---
  if (zone === 'auth') {
    if (!auth.token) {
      return NextResponse.next();
    }
    if (!auth.role || !isSupportedRole(auth.role)) {
      return clearSessionAndRedirectToLogin(request);
    }
    return redirectTo(
      request,
      getPostAuthHref(auth.locale, auth.role, auth.user),
    );
  }

  // --- Onboarding (token required; any authenticated role may pass) ---
  if (zone === 'onboarding') {
    if (!auth.token) {
      return redirectTo(request, '/login');
    }
    return NextResponse.next();
  }

  // --- Protected zones ---
  if (!auth.token) {
    return redirectTo(request, '/login');
  }

  if (!auth.role || !isSupportedRole(auth.role)) {
    return clearSessionAndRedirectToLogin(request);
  }

  // Legacy shortcut → locale-aware student home
  if (pathname === '/student') {
    return redirectTo(
      request,
      getDashboardForRole(auth.locale, auth.role, auth.user),
    );
  }

  if (zone === 'locale-root') {
    return redirectTo(
      request,
      getDashboardForRole(auth.locale, auth.role, auth.user),
    );
  }

  if (roleCanAccessZone(auth.role, zone)) {
    if (zone === 'student') {
      const profileGate = getStudentProfileGateRedirect(
        pathname,
        auth.locale,
        auth.user,
      );
      if (profileGate) {
        return redirectTo(request, profileGate);
      }
    }
    return NextResponse.next();
  }

  // Wrong role for this area → own dashboard
  if (zone !== 'unknown') {
    return redirectTo(
      request,
      getDashboardForRole(auth.locale, auth.role, auth.user),
    );
  }

  // Unclassified path: allow if authenticated (static assets already excluded by matcher)
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Skip API, Next internals, static files, images, favicon, public folder.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};
