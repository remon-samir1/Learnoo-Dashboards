import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getJwtUserDataFromToken } from '@/src/lib/jwt-decode';
import { normalizePlatformFeatureList } from '@/src/services/student/platform-feature.service';
import { parseWatermarkConfigFromFeatures } from '@/src/lib/watermark-from-features';
import { addWatermarkToPdf } from '@/src/lib/server-pdf-watermark';
import type { WatermarkContentType } from '@/src/types/watermark-config';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://api.learnoo.app').replace(/\/$/, '');

export async function GET(req: NextRequest) {
  const pdfUrl = req.nextUrl.searchParams.get('url');
  const contentTypeParam = req.nextUrl.searchParams.get('contentType');

  // Validate contentType against allowed values
  const validContentTypes: WatermarkContentType[] = ['chapters', 'library', 'liveStreams', 'videos', 'files', 'exams'];
  const contentType: WatermarkContentType = (
    contentTypeParam && validContentTypes.includes(contentTypeParam as WatermarkContentType)
      ? contentTypeParam as WatermarkContentType
      : 'library'
  );

  if (!pdfUrl) {
    return new Response('Missing PDF URL', { status: 400 });
  }

  try {
    const response = await fetch(pdfUrl);

    if (!response.ok) {
      return new Response('Failed to fetch PDF', {
        status: response.status,
      });
    }

    let pdfBuffer = await response.arrayBuffer();

    // Apply watermark if enabled
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('token')?.value;

      if (token) {
        // Get user data from JWT
        const userData = getJwtUserDataFromToken(token);

        // Fetch platform features to check if watermark is enabled
        const featuresRes = await fetch(`${API_BASE}/v1/feature`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          cache: 'no-store',
        });

        if (featuresRes.ok) {
          const featuresJson = await featuresRes.json();
          const features = normalizePlatformFeatureList(featuresJson);

          // Parse watermark config for the specified content type
          const watermarkConfig = parseWatermarkConfigFromFeatures(features, contentType);

          console.log('[PDF Proxy] watermarkConfig:', JSON.stringify(watermarkConfig));

          if (watermarkConfig.enabled) {
            // Fetch full user data for student code and phone
            try {
              const userRes = await fetch(`${API_BASE}/v1/auth/me`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                  Accept: 'application/json',
                },
                cache: 'no-store',
              });

              if (userRes.ok) {
                const userJson = await userRes.json();
                const user = userJson?.data;
                // Extract student code from user attributes
                const studentCode = String(user?.attributes?.student_code ?? '').trim() || undefined;
                // Apply watermark
                pdfBuffer = await addWatermarkToPdf(pdfBuffer, watermarkConfig, user, studentCode);
              } else {
                // Apply watermark without user-specific info
                pdfBuffer = await addWatermarkToPdf(pdfBuffer, watermarkConfig, null);
              }
            } catch (userError) {
              console.error('Failed to fetch user profile for watermark:', userError);
              // Continue without user-specific watermark info
              pdfBuffer = await addWatermarkToPdf(pdfBuffer, watermarkConfig, null);
            }
          }
        }
      }
    } catch (watermarkError) {
      console.error('Failed to apply PDF watermark:', watermarkError);
      // Continue with original PDF if watermarking fails
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
