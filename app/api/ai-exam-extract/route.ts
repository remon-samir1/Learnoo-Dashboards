import { NextRequest, NextResponse } from 'next/server';
import { parseGeneratedExamQuestions } from '@/src/lib/exam-ai';

export const dynamic = 'force-dynamic';

const MAX_PDF_SIZE_BYTES = 15 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 60_000;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '')
    || request.cookies.get('token')?.value
    || request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const endpoint = process.env.AI_EXAM_EXTRACT_URL;
  if (!endpoint) {
    return NextResponse.json({ message: 'AI extraction is not configured' }, { status: 503 });
  }

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

    if (!(file instanceof File)) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ message: 'Only PDF files are supported' }, { status: 415 });
    }

    if (file.size <= 0 || file.size > MAX_PDF_SIZE_BYTES) {
      return NextResponse.json({ message: 'PDF file size is invalid' }, { status: 413 });
    }

    const parsedCount = count === null || count === '' ? null : Number(count);
    if (parsedCount !== null && (!Number.isInteger(parsedCount) || parsedCount < 1)) {
      return NextResponse.json({ message: 'Question count is invalid' }, { status: 422 });
    }

    const outboundFormData = new FormData();
    outboundFormData.append('file', file, file.name);
    if (parsedCount !== null) outboundFormData.append('count', String(parsedCount));

    const backendResponse = await fetch(endpointUrl, {
      method: 'POST',
      body: outboundFormData,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: 'AI extraction service rejected the request' },
        { status: backendResponse.status >= 400 && backendResponse.status < 600 ? backendResponse.status : 502 }
      );
    }

    const result: unknown = await backendResponse.json().catch(() => null);
    parseGeneratedExamQuestions(result);
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
