import { resolveCommunityMediaUrl } from '@/src/lib/community-post-media';
import type { Course, Post, PostAttributes } from '@/src/types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

const POST_TYPES = new Set(['post', 'question', 'summary']);

/**
 * Raw `posts` array from GET /v1/course/:id (course details).
 */
export function pickCoursePostsRaw(course: Course | null | undefined): unknown {
  if (!course) return [];

  const root = course as unknown as Record<string, unknown>;
  if (Array.isArray(root.posts)) return root.posts;

  if (!course.attributes) return [];
  const attrs = course.attributes as unknown as Record<string, unknown>;
  return attrs.posts ?? [];
}

function normalizePostType(value: unknown): PostAttributes['type'] {
  const t = String(value ?? 'post').trim().toLowerCase();
  return POST_TYPES.has(t) ? (t as PostAttributes['type']) : 'post';
}

function normalizePostStatus(value: unknown): PostAttributes['status'] {
  const s = String(value ?? 'published').trim().toLowerCase();
  return s === 'draft' ? 'draft' : 'published';
}

/**
 * Normalizes JSON:API `posts` from the course details endpoint.
 */
export function normalizePostsFromCourse(raw: unknown): Post[] {
  if (!Array.isArray(raw)) return [];

  const posts: Post[] = [];

  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (!isRecord(item)) continue;

    const attrs = isRecord(item.attributes) ? item.attributes : item;
    const title = String(attrs.title ?? '').trim();
    const content = String(attrs.content ?? '').trim();
    if (!title && !content) continue;

    const imageRaw = attrs.image;
    const image =
      typeof imageRaw === 'string' && imageRaw.trim()
        ? resolveCommunityMediaUrl(imageRaw.trim())
        : null;

    const courseId =
      attrs.course_id != null && Number.isFinite(Number(attrs.course_id))
        ? Number(attrs.course_id)
        : undefined;

    const parentId =
      attrs.parent_id != null && attrs.parent_id !== '' && Number.isFinite(Number(attrs.parent_id))
        ? Number(attrs.parent_id)
        : null;

    const user = attrs.user;

    posts.push({
      id: item.id != null ? String(item.id) : `course-post-${i}`,
      type: typeof item.type === 'string' ? item.type : 'posts',
      attributes: {
        title,
        content,
        image,
        status: normalizePostStatus(attrs.status),
        type: normalizePostType(attrs.type),
        course_id: courseId,
        tags: Array.isArray(attrs.tags) ? attrs.tags.map((t) => String(t)) : [],
        reactions_count: Number(attrs.reactions_count ?? 0) || 0,
        user_reaction:
          attrs.user_reaction != null && String(attrs.user_reaction).trim() !== ''
            ? String(attrs.user_reaction)
            : null,
        parent_id: parentId,
        comments_count: Number(attrs.comments_count ?? 0) || 0,
        created_at: typeof attrs.created_at === 'string' ? attrs.created_at : null,
        updated_at: typeof attrs.updated_at === 'string' ? attrs.updated_at : null,
        ...(user != null ? { user: user as PostAttributes['user'] } : {}),
      },
    });
  }

  return posts;
}

export function normalizeCoursePosts(course: Course | null | undefined): Post[] {
  return normalizePostsFromCourse(pickCoursePostsRaw(course));
}
