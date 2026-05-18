import { resolveCommunityMediaUrl } from '@/src/lib/community-post-media';
import type { Course, SocialLink } from '@/src/types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function linkIsActive(status: unknown): boolean {
  if (status === false || status === 0 || status === '0') return false;
  return true;
}

const DEFAULT_LINK_COLOR = '#16A34A';

/**
 * Raw `social-links` array from GET /v1/course/:id (course details).
 */
export function pickCourseSocialLinksRaw(course: Course | null | undefined): unknown {
  if (!course) return [];

  const root = course as unknown as Record<string, unknown>;
  const onRoot = root['social-links'] ?? root.social_links;
  if (Array.isArray(onRoot)) return onRoot;

  if (!course.attributes) return [];
  const attrs = course.attributes as unknown as Record<string, unknown>;
  return attrs['social-links'] ?? attrs.social_links ?? [];
}

/**
 * Normalizes flat `social-links` objects from the course details endpoint.
 */
export function normalizeSocialLinksFromCourse(raw: unknown): SocialLink[] {
  if (!Array.isArray(raw)) return [];

  const links: SocialLink[] = [];

  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (!isRecord(item)) continue;

    const attrs = isRecord(item.attributes) ? item.attributes : item;
    if (!linkIsActive(attrs.status)) continue;

    const title = String(attrs.title ?? '').trim();
    if (!title) continue;

    const href = String(attrs.link ?? attrs.url ?? '').trim();
    const pivot = isRecord(attrs.pivot) ? attrs.pivot : null;
    const courseIdFromPivot =
      pivot?.course_id != null && Number.isFinite(Number(pivot.course_id))
        ? Number(pivot.course_id)
        : undefined;
    const courseIdDirect =
      attrs.course_id != null && Number.isFinite(Number(attrs.course_id))
        ? Number(attrs.course_id)
        : undefined;

    const colorRaw = attrs.color;
    const color =
      colorRaw != null && String(colorRaw).trim() !== '' && String(colorRaw).trim() !== 'null'
        ? String(colorRaw).trim()
        : DEFAULT_LINK_COLOR;

    const iconPath = typeof attrs.icon === 'string' ? attrs.icon.trim() : '';
    const icon = iconPath ? resolveCommunityMediaUrl(iconPath) : null;

    links.push({
      id: item.id != null ? String(item.id) : `course-social-${i}`,
      type: typeof item.type === 'string' ? item.type : 'social-links',
      attributes: {
        course_id: courseIdFromPivot ?? courseIdDirect,
        icon,
        link: href,
        title,
        subtitle: String(attrs.subtitle ?? '').trim(),
        color,
        status: true,
        created_at: typeof attrs.created_at === 'string' ? attrs.created_at : null,
        updated_at: typeof attrs.updated_at === 'string' ? attrs.updated_at : null,
      },
    });
  }

  return links;
}

export function normalizeCourseSocialLinks(course: Course | null | undefined): SocialLink[] {
  return normalizeSocialLinksFromCourse(pickCourseSocialLinksRaw(course));
}
