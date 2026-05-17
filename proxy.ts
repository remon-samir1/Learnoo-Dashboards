import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  getStudentDashboardHref,
  parseUserFromCookie,
} from '@/src/lib/auth-post-login-redirect';

export function proxy(request: NextRequest) {
  
  const token = request.cookies.get('token')?.value;
  const userRole = request.cookies.get('user_role')?.value;
  const locale = request.cookies.get('locale')?.value || 'en';
 
  const { pathname } = request.nextUrl;

  // Profile completion after register/login (token required; role may still be "Unknown")
  const onboardingRoutes = ['/select-university', '/select-center', '/select-faculty'];

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/forgot-password', '/create-account', '/'];
  if (publicRoutes.includes(pathname)) {
    // If already logged in, redirect to appropriate dashboard
    if (token && userRole) {
      if (userRole === 'Admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } else if (userRole === 'Doctor') {
        return NextResponse.redirect(new URL('/doctor/dashboard', request.url));
      } else if (userRole === 'Student' || userRole === 'Unknown') {
        const user = parseUserFromCookie(request.cookies.get('user_data')?.value);
        const href = getStudentDashboardHref(locale, user);
        return NextResponse.redirect(new URL(href, request.url));
      }
    }
    return NextResponse.next();
  }

  if (onboardingRoutes.includes(pathname)) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // Check if user is authenticated
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Role-based route protection
  const adminRoutes = ['/dashboard', '/centers', '/community', '/departments', '/courses', 
    '/downloads', '/electronic-library', '/exams', '/feature-control', '/live-sessions', 
    '/notes-summaries', '/notifications', '/settings', '/students'];
  
  const doctorRoutes = ['/doctor'];

  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
  const isDoctorRoute = doctorRoutes.some(route => pathname.startsWith(route));
  const isStudentRoute =
    pathname === '/student' || /^\/(ar|en)\/student(\/|$)/.test(pathname);

  // "Unknown" is common right after register; treat as student for app routes
  if (userRole === 'Unknown') {
    if (isStudentRoute) {
      const user = parseUserFromCookie(request.cookies.get('user_data')?.value);
      const targetHref = getStudentDashboardHref(locale, user);
      const isCompleteProfilePage = pathname.includes('/student/complete-profile');

      if (!isCompleteProfilePage && targetHref.endsWith('/complete-profile')) {
        return NextResponse.redirect(new URL(targetHref, request.url));
      }

      return NextResponse.next();
    }
    if (onboardingRoutes.includes(pathname)) {
      return NextResponse.next();
    }
    if (isAdminRoute || isDoctorRoute) {
      const user = parseUserFromCookie(request.cookies.get('user_data')?.value);
      const href = getStudentDashboardHref(locale, user);
      return NextResponse.redirect(new URL(href, request.url));
    }
    return NextResponse.next();
  }

  if (pathname === '/student') {
    const user = parseUserFromCookie(request.cookies.get('user_data')?.value);
    const href = getStudentDashboardHref(locale, user);
    return NextResponse.redirect(new URL(href, request.url));
  }

  if (isStudentRoute) {
    if (userRole === 'Student' || userRole === 'Unknown') {
      const user = parseUserFromCookie(request.cookies.get('user_data')?.value);
      const targetHref = getStudentDashboardHref(locale, user);
      const isCompleteProfilePage = pathname.includes('/student/complete-profile');

      if (!isCompleteProfilePage && targetHref.endsWith('/complete-profile')) {
        return NextResponse.redirect(new URL(targetHref, request.url));
      }

      return NextResponse.next();
    }
    if (userRole === 'Admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    if (userRole === 'Doctor') {
      return NextResponse.redirect(new URL('/doctor/dashboard', request.url));
    }
  }

  // Admin trying to access doctor routes
  if (isDoctorRoute && userRole !== 'Doctor') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Doctor trying to access admin routes
  if (isAdminRoute && userRole !== 'Admin') {
    return NextResponse.redirect(new URL('/doctor/dashboard', request.url));
  }

  // Unsupported role — clear session and send to login
  if (!userRole || (userRole !== 'Admin' && userRole !== 'Doctor' && userRole !== 'Student')) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    response.cookies.delete('user_role');
    response.cookies.delete('user_data');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
