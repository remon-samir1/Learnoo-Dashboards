import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    || request.cookies.get('token')?.value
    || request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const endpoint = `${(process.env.NEXT_PUBLIC_API_URL || 'https://api.learnoo.app').replace(/\/$/, '')}/v1/ai-exam/usage`;

  try {
    const response = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json({ message: 'AI usage is unavailable' }, { status: response.status });
    }

    return NextResponse.json(await response.json(), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json({ message: 'AI usage is unavailable' }, { status: 503 });
  }
}
