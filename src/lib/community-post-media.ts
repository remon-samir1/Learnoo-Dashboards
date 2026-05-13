/**
 * Resolve community post images for display.
 * API may return full URLs, relative paths (must be prefixed with API origin), or alternate keys.
 */

import type { PostAttributes } from '@/src/types';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://api.learnoo.app').replace(/\/$/, '');

export function resolveCommunityMediaUrl(url: string | null | undefined): string | null {
  const u = url?.trim();
  if (!u) return null;
  if (/^data:/i.test(u)) return u;
  if (/^https?:\/\//i.test(u)) return u;
  return `${API_BASE}${u.startsWith('/') ? u : `/${u}`}`;
}

function firstNonEmptyString(...values: unknown[]): string | null {
  for (const v of values) {
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return null;
}

/**
 * Picks a displayable image URL from post attributes (supports common API shapes).
 */
export function pickPostImageUrl(attrs: PostAttributes | Record<string, unknown>): string | null {
  const a = attrs as Record<string, unknown>;

  const direct = firstNonEmptyString(
    a.image,
    a.image_url,
    a.imageUrl,
    a.thumbnail,
    a.thumbnail_url,
    a.cover_image,
    a.coverImage,
    a.media_url,
    a.mediaUrl,
  );
  if (direct) return resolveCommunityMediaUrl(direct);

  const att = a.attachment;
  if (typeof att === 'string' && att.trim()) return resolveCommunityMediaUrl(att.trim());

  if (att && typeof att === 'object' && !Array.isArray(att)) {
    const rec = att as Record<string, unknown>;
    const nested = firstNonEmptyString(rec.url, rec.path, rec.src, rec.href);
    if (nested) return resolveCommunityMediaUrl(nested);
  }

  if (Array.isArray(att)) {
    for (const item of att) {
      if (item && typeof item === 'object') {
        const rec = item as Record<string, unknown>;
        const nested = firstNonEmptyString(rec.url, rec.path, rec.src);
        if (nested) return resolveCommunityMediaUrl(nested);
      }
      if (typeof item === 'string' && item.trim()) return resolveCommunityMediaUrl(item.trim());
    }
  }

  const attachments = a.attachments;
  if (Array.isArray(attachments)) {
    for (const item of attachments) {
      if (item && typeof item === 'object') {
        const rec = item as Record<string, unknown>;
        const nested = firstNonEmptyString(rec.url, rec.path, rec.src);
        if (nested) return resolveCommunityMediaUrl(nested);
      }
    }
  }

  return null;
}
