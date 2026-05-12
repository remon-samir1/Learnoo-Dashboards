import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const userRole = request.cookies.get('user_role')?.value;
  const locale = request.cookies.get('locale')?.value || 'en';
  
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/forgot-password', '/create-account', '/'];
  if (publicRoutes.includes(pathname)) {
<<<<<<< HEAD
    // If already logged in, redirect to dashboard
    if (token && (userRole === 'Admin' || userRole === 'Instructor')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
=======
    // If already logged in, redirect to appropriate dashboard
    if (token && userRole) {
      if (userRole === 'Admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } else if (userRole === 'Doctor') {
        return NextResponse.redirect(new URL('/doctor/dashboard', request.url));
      }
>>>>>>> origin/master
    }
    return NextResponse.next();
  }

  // Check if user is authenticated
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Role-based route protection
<<<<<<< HEAD
  const adminRoutes = ['/dashboard', '/centers', '/community', '/departments', '/courses',
    '/downloads', '/electronic-library', '/exams', '/feature-control', '/live-sessions',
    '/notes-summaries', '/notifications', '/settings', '/students'];

  // Routes restricted to Admin only (Instructors cannot access)
  const adminOnlyRoutes = ['/downloads', '/notifications', '/ota-upload', '/feature-control', '/students', '/instructors'];
  const adminOnlySettings = ['/settings/general', '/settings/branding', '/settings/notifications', '/settings/language', '/settings/terms', '/settings/watermark'];

  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
  const isAdminOnlyRoute = adminOnlyRoutes.some(route => pathname.startsWith(route)) ||
    adminOnlySettings.some(route => pathname.startsWith(route));

  // Only Admin and Instructor can access admin routes
  if (isAdminRoute && userRole !== 'Admin' && userRole !== 'Instructor') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Instructors cannot access admin-only routes
  if (isAdminOnlyRoute && userRole === 'Instructor') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Unknown role - redirect to login (Admin and Instructor are valid roles)
  if (!userRole || (userRole !== 'Admin' && userRole !== 'Instructor')) {
=======
  const adminRoutes = ['/dashboard', '/centers', '/community', '/departments', '/courses', 
    '/downloads', '/electronic-library', '/exams', '/feature-control', '/live-sessions', 
    '/notes-summaries', '/notifications', '/settings', '/students'];
  
  const doctorRoutes = ['/doctor'];

  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
  const isDoctorRoute = doctorRoutes.some(route => pathname.startsWith(route));

  // Admin trying to access doctor routes
  if (isDoctorRoute && userRole !== 'Doctor') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Doctor trying to access admin routes
  if (isAdminRoute && userRole !== 'Admin') {
    return NextResponse.redirect(new URL('/doctor/dashboard', request.url));
  }

  // Unknown role - redirect to login
  if (!userRole || (userRole !== 'Admin' && userRole !== 'Doctor')) {
>>>>>>> origin/master
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
