import { NextRequest, NextResponse } from 'next/server';

export function GET(request: NextRequest) {
  const reason = request.nextUrl.searchParams.get('reason') === 'device-changed' ? 'device-changed' : 'expired';
  const response = NextResponse.redirect(new URL(`/login?session=${reason}`, request.url));
  for (const name of ['token', 'user_role', 'user_data', 'auth_flow']) response.cookies.delete(name);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
