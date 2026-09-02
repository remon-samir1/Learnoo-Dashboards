import { NextRequest, NextResponse } from 'next/server';
import { learnooApiBaseUrl, rewriteLearnooHlsPlaylistBody } from '@/src/lib/learnoo-hls-proxy';

export const dynamic = 'force-dynamic';

const PROXY_LOG = '[learnoo-origin-proxy]';

function joinUpstreamPath(segments: string[]): string {
  return segments.map((s) => decodeURIComponent(s)).join('/');
}

function classifyRequest(pathJoined: string): 'playlist' | 'key' | 'segment' | 'other' {
  const p = pathJoined.toLowerCase();
  if (p.includes('/hls/key/') || p.endsWith('.key')) return 'key';
  if (p.includes('/hls/segment/') || p.endsWith('.ts')) return 'segment';
  if (p.includes('/hls/') && (p.includes('playlist') || p.includes('.m3u8'))) return 'playlist';
  return 'other';
}

function isLikelyM3u8Playlist(pathJoined: string, contentType: string): boolean {
  const ct = contentType.toLowerCase();
  if (ct.includes('mpegurl') || ct.includes('m3u')) return true;
  const p = pathJoined.toLowerCase();
  return p.endsWith('playlist') || p.endsWith('/playlist') || p.includes('.m3u8');
}

function isLikelyEncryptionKey(pathJoined: string, contentType: string): boolean {
  const p = pathJoined.toLowerCase();
  if (p.includes('/hls/key/') || p.endsWith('.key')) return true;
  const ct = contentType.toLowerCase();
  return ct.includes('octet-stream') && p.includes('/key/');
}

/** Safe log line for Authorization (never log full token). */
function describeAuthorizationHeader(value: string | null): {
  present: boolean;
  scheme?: string;
  tokenLen?: number;
  preview?: string;
} {
  if (!value || !value.trim()) return { present: false };
  const m = value.trim().match(/^(\S+)\s+(.+)$/);
  if (!m) return { present: true, preview: `opaque len=${value.length}` };
  const scheme = m[1];
  const token = m[2];
  return {
    present: true,
    scheme,
    tokenLen: token.length,
  };
}

function describeCookieHeader(value: string | null): { present: boolean; nameCount?: number; names?: string[] } {
  if (!value?.trim()) return { present: false };
  const names = value
    .split(';')
    .map((part) => part.split('=')[0]?.trim())
    .filter(Boolean);
  return { present: true, nameCount: names.length, names: names.slice(0, 12) };
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

  const kind = classifyRequest(pathJoined);

  const incomingAuthDesc = describeAuthorizationHeader(incomingAuth);
  const outgoingAuthDesc = describeAuthorizationHeader(outgoing.get('Authorization'));
  const incomingCookieDesc = describeCookieHeader(incomingCookie);

  console.info(PROXY_LOG, 'incoming', {
    kind,
    path: pathJoined,
    search: search || '(empty)',
    queryTokenPresent: Boolean(queryToken),
    incomingAuthorization: incomingAuthDesc,
    resolvedAuthorization: outgoingAuthDesc,
    incomingCookie: incomingCookieDesc,
    upstreamUrl,
  });

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, { headers: outgoing, redirect: 'follow' });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.info(PROXY_LOG, 'upstream fetch threw', { upstreamUrl, message: msg });
    return new NextResponse(`Upstream fetch failed: ${msg}`, { status: 502 });
  }

  const contentType = upstream.headers.get('content-type') || '';
  const shouldRewriteBody =
    upstream.ok && !range && isLikelyM3u8Playlist(pathJoined, contentType);

  console.info(PROXY_LOG, 'outgoing + upstream response', {
    kind,
    upstreamUrl,
    forwardedAuthorization: outgoingAuthDesc,
    forwardedCookiePresent: Boolean(incomingCookie),
    upstreamStatus: upstream.status,
    upstreamContentType: contentType || '(none)',
    responseKind: shouldRewriteBody
      ? 'playlist-rewrite'
      : isLikelyEncryptionKey(pathJoined, contentType)
        ? 'key-binary'
        : 'passthrough',
  });

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
    'access-control-allow-origin',
    'access-control-allow-headers',
    'access-control-allow-methods',
  ] as const) {
    const v = upstream.headers.get(name);
    if (v) outHeaders.set(name, v);
  }
  if (!outHeaders.has('access-control-allow-origin')) {
    outHeaders.set('Access-Control-Allow-Origin', '*');
  }
  return new NextResponse(upstream.body, { status: upstream.status, headers: outHeaders });
}

/** CORS preflight — iOS Safari may send OPTIONS before HLS sub-resource requests. */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Range, Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
