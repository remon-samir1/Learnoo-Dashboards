import { NextRequest, NextResponse } from 'next/server';
import { learnooApiBaseUrl, rewriteLearnooHlsPlaylistBody } from '@/src/lib/learnoo-hls-proxy';

export const dynamic = 'force-dynamic';

function joinUpstreamPath(segments: string[]): string {
  return segments.map((s) => decodeURIComponent(s)).join('/');
}

function isLikelyM3u8Playlist(pathJoined: string, contentType: string): boolean {
  const ct = contentType.toLowerCase();
  if (ct.includes('mpegurl') || ct.includes('m3u')) return true;
  const p = pathJoined.toLowerCase();
  return p.endsWith('playlist') || p.endsWith('/playlist') || p.includes('.m3u8');
}


export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await ctx.params;
  if (!segments?.length) {
    return new NextResponse('Not Found', { status: 404 });
  }
  if (segments.some((s) => s.includes('..'))) {
    return new NextResponse('Bad Request', { status: 400 });
  }

  const pathJoined = joinUpstreamPath(segments);

  const queryToken = req.nextUrl.searchParams.get('token') || req.nextUrl.searchParams.get('auth');
  const incomingAuth =
    req.headers.get('authorization') ??
    req.headers.get('Authorization') ??
    req.headers.get('AUTHORIZATION');
  const incomingCookie = req.headers.get('cookie') ?? req.headers.get('Cookie');
  const range = req.headers.get('range');

  // Resolve raw Bearer token from header, query param, or cookies.
  // Query param token is critical for iOS AVPlayer (mediaserverd) which doesn't share browser cookies.
  let rawToken: string | null = null;
  if (incomingAuth) {
    const m = incomingAuth.trim().match(/^Bearer\s+(.+)$/i);
    if (m && m[1]) rawToken = m[1].trim();
    else rawToken = incomingAuth.trim();
  }
  if (!rawToken && queryToken) {
    rawToken = queryToken.trim();
  }
  if (!rawToken) {
    const tokenFromCookie = req.cookies.get('token')?.value;
    if (tokenFromCookie && tokenFromCookie.trim()) {
      rawToken = tokenFromCookie.trim();
    } else if (incomingCookie) {
      const match = incomingCookie.match(/(?:^|;\s*)token=([^;]+)/);
      if (match && match[1]) {
        rawToken = decodeURIComponent(match[1].trim());
      }
    }
  }

  // Strip token from upstream search params
  const upstreamSearchParams = new URLSearchParams(req.nextUrl.search);
  upstreamSearchParams.delete('token');
  upstreamSearchParams.delete('auth');
  const searchStr = upstreamSearchParams.toString();
  const search = searchStr ? `?${searchStr}` : '';
  const upstreamUrl = `${learnooApiBaseUrl()}/${pathJoined}${search}`;

  const outgoing = new Headers();
  if (rawToken) {
    const authHeader = rawToken.toLowerCase().startsWith('bearer ') ? rawToken : `Bearer ${rawToken}`;
    outgoing.set('Authorization', authHeader);
  }
  if (incomingCookie) outgoing.set('Cookie', incomingCookie);
  if (range) outgoing.set('Range', range);

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, { headers: outgoing, redirect: 'follow' });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[learnoo-origin-proxy] upstream fetch failed', { path: pathJoined, message: msg });
    return new NextResponse('Upstream fetch failed', { status: 502 });
  }

  const contentType = upstream.headers.get('content-type') || '';
  const shouldRewriteBody =
    upstream.ok && !range && isLikelyM3u8Playlist(pathJoined, contentType);

  if (shouldRewriteBody) {
    const text = await upstream.text();
    const rewritten = rewriteLearnooHlsPlaylistBody(text, rawToken);
    const out = new NextResponse(rewritten, {
      status: upstream.status,
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges, *',
      },
    });
    const cc = upstream.headers.get('cache-control');
    if (cc) out.headers.set('Cache-Control', cc);
    return out;
  }

  const outHeaders = new Headers();
  for (const name of [
    'content-type',
    'content-length',
    'accept-ranges',
    'content-range',
    'cache-control',
  ] as const) {
    const v = upstream.headers.get(name);
    if (v) outHeaders.set(name, v);
  }
  outHeaders.set('Access-Control-Allow-Origin', '*');
  outHeaders.set('Access-Control-Allow-Headers', '*');
  outHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  outHeaders.set('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges, *');
  return new NextResponse(upstream.body, { status: upstream.status, headers: outHeaders });
}

export async function HEAD(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return GET(req, ctx);
}

/** CORS preflight — iOS Safari may send OPTIONS before HLS sub-resource requests. */
export async function OPTIONS(req: NextRequest) {
  const reqHeaders =
    req.headers.get('access-control-request-headers') ||
    'Authorization, Range, Content-Type, Origin, X-Playback-Session-Id';
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': reqHeaders,
      'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges, *',
      'Access-Control-Max-Age': '86400',
    },
  });
}
