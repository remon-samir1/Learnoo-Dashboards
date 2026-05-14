/** HLS master or media playlist (not progressive MP4). */
export function isHlsStreamUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();
  if (lower.includes('.m3u8')) return true;
  try {
    const path = new URL(trimmed).pathname.toLowerCase();
    return path.includes('/hls/') && (path.includes('playlist') || path.includes('.m3u8'));
  } catch {
    return false;
  }
}

/** Progressive file suitable for native `<video src>` (MP4-first). */
export function isMp4StreamUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith('data:')) return false;
  return /\.(mp4|m4v)(\?|#|$)/i.test(trimmed);
}
