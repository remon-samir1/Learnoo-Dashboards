import { NextRequest, NextResponse } from 'next/server';
import { parseGeneratedExamQuestions } from '@/src/lib/exam-ai';

export const dynamic = 'force-dynamic';

const MAX_PDF_SIZE_BYTES = 15 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 190_000;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '')
    || request.cookies.get('token')?.value
    || request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const customEndpoint = process.env.AI_EXAM_EXTRACT_URL;
  const endpoint = customEndpoint || `${(process.env.NEXT_PUBLIC_API_URL || 'https://api.learnoo.app').replace(/\/$/, '')}/v1/ai-exam`;

  let endpointUrl: URL;
  try {
    endpointUrl = new URL(endpoint);
  } catch {
    return NextResponse.json({ message: 'AI extraction is not configured' }, { status: 503 });
  }

  if (endpointUrl.protocol !== 'https:') {
    return NextResponse.json({ message: 'AI extraction requires a secure endpoint' }, { status: 503 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const count = formData.get('count');
    const language = formData.get('language') || 'auto';
    if (!['auto', 'ar', 'en'].includes(String(language))) return NextResponse.json({ message: 'Question language is invalid' }, { status: 422 });

    if (!(file instanceof File)) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ message: 'Only PDF files are supported' }, { status: 415 });
    }

    if (file.size <= 0 || file.size > MAX_PDF_SIZE_BYTES) {
      return NextResponse.json({ message: 'PDF file size is invalid' }, { status: 413 });
    }

    const parsedCount = Number(count);
    if (!Number.isInteger(parsedCount) || parsedCount < 1 || parsedCount > 100) {
      return NextResponse.json({ message: 'Question count is invalid' }, { status: 422 });
    }

    const outboundFormData = new FormData();
    outboundFormData.append('file', file, file.name);
    outboundFormData.append(customEndpoint ? 'count' : 'questions_count', String(parsedCount));
    outboundFormData.append('language', String(language));

    const backendResponse = await fetch(endpointUrl, {
      method: 'POST',
      body: outboundFormData,
      headers: customEndpoint ? undefined : { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: 'AI extraction service rejected the request' },
        { status: backendResponse.status >= 400 && backendResponse.status < 600 ? backendResponse.status : 502 }
      );
    }

    const payload = await backendResponse.json();
    if (!customEndpoint && backendResponse.status === 202) {
      if (typeof payload.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.id)) {
        throw new Error('INVALID_AI_RESPONSE');
      }
      return NextResponse.json({ id: payload.id, status: payload.status }, { status: 202 });
    }
    const result: unknown = customEndpoint ? payload : [{ output: payload.questions }];
    parseGeneratedExamQuestions(result, parsedCount);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      return NextResponse.json({ message: 'AI extraction timed out' }, { status: 504 });
    }

    if (error instanceof Error && error.message === 'INVALID_AI_RESPONSE') {
      return NextResponse.json({ message: 'AI extraction returned an invalid response' }, { status: 502 });
    }

    return NextResponse.json({ message: 'AI extraction failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    || request.cookies.get('token')?.value
    || request.cookies.get('auth_token')?.value;
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const id = request.nextUrl.searchParams.get('id');
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ message: 'Invalid request ID' }, { status: 400 });
  }

  try {
    const endpoint = `${(process.env.NEXT_PUBLIC_API_URL || 'https://api.learnoo.app').replace(/\/$/, '')}/v1/ai-exam/${id}`;
    if (new URL(endpoint).protocol !== 'https:') {
      return NextResponse.json({ message: 'AI extraction requires a secure endpoint' }, { status: 503 });
    }
    const response = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
    const payload = await response.json();
    if (!response.ok) {
      return NextResponse.json({ message: payload.message || 'AI extraction failed' }, { status: response.status });
    }
    if (response.status === 202) {
      return NextResponse.json({ status: payload.status }, { status: 202, headers: { 'Cache-Control': 'no-store' } });
    }
    const result = [{ output: payload.questions }];
    parseGeneratedExamQuestions(result, payload.requested_count);
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ message: 'AI extraction status is unavailable' }, { status: 502 });
  }
}
