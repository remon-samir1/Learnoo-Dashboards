/** Same-origin proxy path; must match `app/api/learnoo-origin/[...path]/route.ts`. */
export const LEARNOO_API_PROXY_PREFIX = '/api/learnoo-origin';

export function learnooApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL || 'https://api.learnoo.app').replace(/\/$/, '');
}

/**
 * Rewrite absolute Learnoo API URLs inside M3U8 text (variants, keys, segments) so the browser
 * loads them same-origin. Covers `#EXT-X-KEY` URI="https://api…/hls/key/…" and segment URLs.
 */
export function rewriteLearnooHlsPlaylistBody(body: string): string {
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
 * Map `https://api…/hls/chapter/…/playlist` → `/api/learnoo-origin/hls/chapter/…/playlist`.
 */
export function toProxiedLearnooHlsUrl(apiPlaylistUrl: string): string {
  const trimmed = apiPlaylistUrl.trim();
  try {
    const u = new URL(trimmed);
    const base = new URL(learnooApiBaseUrl());
    if (u.hostname !== base.hostname || !u.pathname.startsWith('/hls/')) return trimmed;
    return `${LEARNOO_API_PROXY_PREFIX}${u.pathname}${u.search}`;
  } catch {
    return trimmed;
  }
}
