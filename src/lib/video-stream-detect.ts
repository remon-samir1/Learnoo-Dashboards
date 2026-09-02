/** HLS master or media playlist (not progressive MP4). */
export function isHlsStreamUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();
  if (lower.includes('.m3u8')) return true;
  try {
    const path = new URL(trimmed).pathname.toLowerCase();
    // Match /hls/ paths with playlist suffix (e.g. /hls/chapter/275/playlist)
    // and any path ending in /playlist or /playlist.m3u8
    if (path.includes('/hls/')) return true;
    if (path.endsWith('/playlist') || path.endsWith('/playlist.m3u8')) return true;
    return false;
  } catch {
    return false;
  }
}

/** Progressive file suitable for native `<video src>` (MP4-first). */
export function isMp4StreamUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith('data:')) return false;
  if (/\.(mp4|m4v|mov|webm|m4a|mkv)(\?|#|$)/i.test(trimmed)) return true;
  try {
    const path = new URL(trimmed).pathname.toLowerCase();
    // Learnoo storage/upload video files that are not HLS playlists are progressive video files
    if (
      (path.includes('/storage/') || path.includes('/uploads/')) &&
      !path.includes('/hls/') &&
      !path.endsWith('.m3u8') &&
      !path.endsWith('/playlist')
    ) {
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

/** Detect iOS Safari, iPadOS (including Mac-spoofing iPadOS with touch points), iPhone, iPod. */
export function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/i.test(ua)) return true;
  if (/Macintosh/i.test(ua) && typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1) return true;
  return false;
}
