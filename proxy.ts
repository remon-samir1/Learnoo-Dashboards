import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // const token = request.cookies.get('token')?.value;
  // const userRole = request.cookies.get('user_role')?.value;
  // const locale = request.cookies.get('locale')?.value || 'en';
  
  // const { pathname } = request.nextUrl;

  // // Public routes that don't require authentication
  // const publicRoutes = ['/login', '/forgot-password', '/create-account', '/'];
  // if (publicRoutes.includes(pathname)) {
  //   // If already logged in, redirect to appropriate dashboard
  //   if (token && userRole) {
  //     if (userRole === 'Admin') {
  //       return NextResponse.redirect(new URL('/dashboard', request.url));
  //     } else if (userRole === 'Doctor') {
  //       return NextResponse.redirect(new URL('/doctor/dashboard', request.url));
  //     }
  //   }
  //   return NextResponse.next();
  // }

  // // Check if user is authenticated
  // if (!token) {
  //   return NextResponse.redirect(new URL('/login', request.url));
  // }

  // // Role-based route protection
  // const adminRoutes = ['/dashboard', '/centers', '/community', '/departments', '/courses', 
  //   '/downloads', '/electronic-library', '/exams', '/feature-control', '/live-sessions', 
  //   '/notes-summaries', '/notifications', '/settings', '/students'];
  
  // const doctorRoutes = ['/doctor'];

  // const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
  // const isDoctorRoute = doctorRoutes.some(route => pathname.startsWith(route));

  // // Admin trying to access doctor routes
  // if (isDoctorRoute && userRole !== 'Doctor') {
  //   return NextResponse.redirect(new URL('/dashboard', request.url));
  // }

  // // Doctor trying to access admin routes
  // if (isAdminRoute && userRole !== 'Admin') {
  //   return NextResponse.redirect(new URL('/doctor/dashboard', request.url));
  // }

  // // Unknown role - redirect to login
  // if (!userRole || (userRole !== 'Admin' && userRole !== 'Doctor')) {
  //   const response = NextResponse.redirect(new URL('/login', request.url));
  //   response.cookies.delete('token');
  //   response.cookies.delete('user_role');
  //   response.cookies.delete('user_data');
  //   return response;
  // }

  // return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
