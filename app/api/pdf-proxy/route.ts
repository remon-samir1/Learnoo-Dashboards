import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const pdfUrl = req.nextUrl.searchParams.get('url');

  if (!pdfUrl) {
    return new Response('Missing PDF URL', { status: 400 });
  }

  const response = await fetch(pdfUrl);

  if (!response.ok) {
    return new Response('Failed to fetch PDF', {
      status: response.status,
    });
  }

  const pdfBuffer = await response.arrayBuffer();

  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Cache-Control': 'no-store',
    },
  });
}