/** Same-origin proxy path; must match `app/api/learnoo-origin/[...path]/route.ts`. */
export const LEARNOO_API_PROXY_PREFIX = '/api/learnoo-origin';

export function learnooApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL || 'https://api.learnoo.app').replace(/\/$/, '');
}

function appendTokenToUrl(url: string, token: string): string {
  if (!token || !url.trim()) return url;
  if (url.includes('token=')) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}token=${encodeURIComponent(token)}`;
}

/**
 * Rewrite absolute Learnoo API URLs inside M3U8 text (variants, keys, segments) so the browser
 * loads them same-origin. Covers `#EXT-X-KEY` URI="https://api…/hls/key/…" and segment URLs.
 * Also appends token to URLs so iOS AVPlayer background daemon (mediaserverd) can authenticate
 * AES-128 key and segment requests without browser cookies.
 */
export function rewriteLearnooHlsPlaylistBody(body: string, token?: string | null): string {
  const api = learnooApiBaseUrl();
  let host: string;
  try {
    host = new URL(api).host.replace(/\./g, '\\.');
  } catch {
    return body;
  }
  const re = new RegExp(`https?://${host}/`, 'g');
  let rewritten = body.replace(re, `${LEARNOO_API_PROXY_PREFIX}/`);

  if (token && token.trim()) {
    const cleanToken = token.trim();

    // 1. Rewrite #EXT-X-KEY URI="..." attributes
    rewritten = rewritten.replace(
      /(#EXT-X-KEY:[^\r\n]*?URI=")([^"]+)(")/gi,
      (_, prefix, uri, suffix) => {
        return `${prefix}${appendTokenToUrl(uri, cleanToken)}${suffix}`;
      }
    );

    // 2. Rewrite non-comment lines (variant playlists or segments)
    const lines = rewritten.split('\n');
    const updatedLines = lines.map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        return line;
      }
      return appendTokenToUrl(trimmed, cleanToken);
    });
    rewritten = updatedLines.join('\n');
  }

  return rewritten;
}

/**
 * Map API media paths to the same-origin proxy to bypass CORS restrictions
 * and allow crossOrigin="anonymous" on the <video> element (needed for screenshots).
 * Matches both `https://api…/hls/` and `https://api…/storage/`.
 */
export function toProxiedLearnooHlsUrl(apiPlaylistUrl: string, token?: string | null): string {
  const trimmed = apiPlaylistUrl.trim();
  try {
    const u = new URL(trimmed);
    const base = new URL(learnooApiBaseUrl());
    if (u.hostname !== base.hostname) return trimmed;
    if (!u.pathname.startsWith('/hls/') && !u.pathname.startsWith('/storage/')) return trimmed;

    let target = `${LEARNOO_API_PROXY_PREFIX}${u.pathname}${u.search}`;
    if (token && token.trim() && !target.includes('token=')) {
      const sep = target.includes('?') ? '&' : '?';
      target = `${target}${sep}token=${encodeURIComponent(token.trim())}`;
    }
    return target;
  } catch {
    return trimmed;
  }
}
