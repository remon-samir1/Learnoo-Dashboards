/**
 * Classifies a note / summary attachment so the student UI can render images and
 * videos inline instead of falling back to a bare download link.
 *
 * The backend is inconsistent about what it sends: sometimes a `mime_type`, more
 * often only an `extension`, and occasionally nothing but the URL. All three are
 * consulted, in that order of trust.
 */

export type AttachmentMediaKind = 'image' | 'video' | 'file';

/** Extensions the browser can render with `<img>`. `jfif`/`heic`/`avif` included on purpose. */
const IMAGE_EXTENSIONS = new Set([
  'apng',
  'avif',
  'bmp',
  'gif',
  'heic',
  'heif',
  'ico',
  'jfif',
  'jpe',
  'jpeg',
  'jpg',
  'pjp',
  'pjpeg',
  'png',
  'svg',
  'tif',
  'tiff',
  'webp',
]);

/** Extensions the browser can render with `<video>` (or hls.js, for `m3u8`). */
const VIDEO_EXTENSIONS = new Set([
  '3gp',
  'avi',
  'm3u8',
  'm4v',
  'mkv',
  'mov',
  'mp4',
  'mpeg',
  'mpg',
  'ogg',
  'ogv',
  'webm',
]);

export interface AttachmentMediaSource {
  url?: string | null;
  name?: string | null;
  extension?: string | null;
  /** Some payloads carry the mime type under `mime_type`, `mime` or `type`. */
  mime_type?: string | null;
  mime?: string | null;
  type?: string | null;
}

/** Lower-cased extension of a path/name, without the dot, query string or hash. */
function extensionOf(value: string | null | undefined): string {
  if (!value) return '';
  let path = value.trim();
  if (!path) return '';
  // Strip query/hash before looking at the last dot — "photo.jfif?sig=x.png".
  try {
    path = new URL(path, 'https://placeholder.invalid').pathname;
  } catch {
    path = path.split('?')[0].split('#')[0];
  }
  const lastSegment = path.split('/').pop() ?? '';
  const dot = lastSegment.lastIndexOf('.');
  if (dot < 0) return '';
  return lastSegment.slice(dot + 1).toLowerCase();
}

function normalizeExtension(value: string | null | undefined): string {
  if (!value) return '';
  return value.trim().replace(/^\./, '').toLowerCase();
}

/**
 * Decides how an attachment should be presented: inline image, inline player, or
 * a plain file control. Anything not recognised stays a file — never guess.
 */
export function attachmentMediaKind(source: AttachmentMediaSource): AttachmentMediaKind {
  const mime = (source.mime_type ?? source.mime ?? source.type ?? '').trim().toLowerCase();
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime === 'application/vnd.apple.mpegurl' || mime === 'application/x-mpegurl') return 'video';

  const candidates = [
    normalizeExtension(source.extension),
    extensionOf(source.name),
    extensionOf(source.url),
  ].filter(Boolean);

  for (const ext of candidates) {
    if (IMAGE_EXTENSIONS.has(ext)) return 'image';
    if (VIDEO_EXTENSIONS.has(ext)) return 'video';
  }

  return 'file';
}

/** `true` when the browser needs hls.js rather than a plain `<video src>`. */
export function isHlsAttachment(source: AttachmentMediaSource): boolean {
  const mime = (source.mime_type ?? source.mime ?? source.type ?? '').trim().toLowerCase();
  if (mime === 'application/vnd.apple.mpegurl' || mime === 'application/x-mpegurl') return true;
  return (
    normalizeExtension(source.extension) === 'm3u8' ||
    extensionOf(source.name) === 'm3u8' ||
    extensionOf(source.url) === 'm3u8'
  );
}
