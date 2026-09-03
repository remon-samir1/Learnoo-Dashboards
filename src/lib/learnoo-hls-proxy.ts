/** Same-origin proxy path; must match `app/api/learnoo-origin/[...path]/route.ts`. */
export const LEARNOO_API_PROXY_PREFIX = '/api/learnoo-origin';

export function learnooApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL || 'https://api.learnoo.app').replace(/\/$/, '');
}

export function appendTokenToUrl(url: string, _token?: string | null): string {
  return url;
}

/**
 * Rewrite absolute Learnoo API URLs inside M3U8 text (variants, keys, segments) so the browser
 * loads them same-origin. Covers `#EXT-X-KEY` URI="https://api…/hls/key/…" and segment URLs.
 */
export function rewriteLearnooHlsPlaylistBody(body: string, _token?: string | null): string {
  const api = learnooApiBaseUrl();
  let host: string;
  try {
    host = new URL(api).host.replace(/\./g, '\\.');
  } catch {
    return body;
  }
  const re = new RegExp(`https?://${host}/`, 'g');
  return body.replace(re, `${LEARNOO_API_PROXY_PREFIX}/`);
}

/**
 * Map API media paths to the same-origin proxy to bypass CORS restrictions
 * and allow crossOrigin="anonymous" on the <video> element (needed for screenshots).
 * Matches both `https://api…/hls/` and `https://api…/storage/`.
 */
export function toProxiedLearnooHlsUrl(apiPlaylistUrl: string, _token?: string | null): string {
  const trimmed = apiPlaylistUrl.trim();
  try {
    const u = new URL(trimmed);
    const base = new URL(learnooApiBaseUrl());
    if (u.hostname !== base.hostname) return trimmed;
    if (!u.pathname.startsWith('/hls/') && !u.pathname.startsWith('/storage/')) return trimmed;

    return `${LEARNOO_API_PROXY_PREFIX}${u.pathname}${u.search}`;
  } catch {
    return trimmed;
  }
}
