import { NextRequest } from 'next/server';
import { parseWatermarkConfigFromFeatures } from '@/src/lib/watermark-from-features';
import { addWatermarkToPdf } from '@/src/lib/server-pdf-watermark';
import type { User } from '@/src/types';
import type { WatermarkContentType } from '@/src/types/watermark-config';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://api.learnoo.app').replace(/\/$/, '');

export async function GET(req: NextRequest) {
  const source = req.nextUrl.searchParams.get('source');

  if (!source) {
    return new Response('Missing PDF source', { status: 400 });
  }

  try {
    const sourceUrl = new URL(source);
    const apiUrl = new URL(API_BASE);
    const key = process.env.PDF_PROXY_KEY;

    if (sourceUrl.origin !== apiUrl.origin || !sourceUrl.pathname.startsWith('/v1/attachment/')) {
      return new Response('Invalid PDF source', { status: 400 });
    }

    if (!key) {
      return new Response('PDF protection is unavailable', { status: 503 });
    }

    const response = await fetch(sourceUrl, {
      headers: { 'X-PDF-Proxy-Key': key },
      cache: 'no-store',
    });

    if (!response.ok) {
      return new Response('Failed to fetch PDF', {
        status: response.status,
      });
    }

    const features = response.headers.get('X-PDF-Watermark-Features');
    const viewer = response.headers.get('X-PDF-Viewer');
    const contentType = response.headers.get('X-PDF-Content-Type') as WatermarkContentType | null;

    if (!features || !viewer || !contentType) {
      return new Response('PDF protection is unavailable', { status: 503 });
    }

    let pdfBuffer = await response.arrayBuffer();
    const watermarkConfig = parseWatermarkConfigFromFeatures(
      JSON.parse(Buffer.from(features, 'base64').toString()),
      contentType,
    );

    if (watermarkConfig.enabled) {
      const user = { attributes: JSON.parse(Buffer.from(viewer, 'base64').toString()) } as User;
      const studentCode = String(user.attributes?.student_code ?? '').trim() || undefined;
      pdfBuffer = await addWatermarkToPdf(pdfBuffer, watermarkConfig, user, studentCode);
    }

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Content-Disposition': 'inline; filename="document.pdf"',
        'X-Frame-Options': 'SAMEORIGIN',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('PDF proxy error:', error);
    return new Response('Internal error', { status: 500 });
  }
}
