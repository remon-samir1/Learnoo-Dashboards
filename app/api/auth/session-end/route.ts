import { NextRequest, NextResponse } from 'next/server';

export function GET(request: NextRequest) {
  const requested = request.nextUrl.searchParams.get('reason');
  const reason = requested === 'inactive' || requested === 'device-changed' ? requested : 'expired';
  const response = new NextResponse(null, { status: 307, headers: { Location: `/login?session=${reason}` } });
  for (const name of ['token', 'user_role', 'user_data', 'auth_flow']) response.cookies.delete(name);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
