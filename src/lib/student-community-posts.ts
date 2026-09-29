/**
 * Shared rules for the student community feed.
 *
 * Comments are stored in the same `/v1/post` collection as posts — a reply is
 * just a post carrying a parent reference (`commentsApi.list` reads them with
 * `?parent_id=`). A plain `GET /v1/post` therefore returns posts *and*
 * replies, so every screen that lists posts has to drop the replies itself,
 * keep only published rows, and scope what is left to the student's courses.
 */

import { isWithinStudentCourses, readRecordCourseIds } from '@/src/lib/student-course-scope';

type LoosePostAttributes = Record<string, unknown> | null | undefined;

/** Any row shaped like a JSON:API post (`{ id, attributes }`) or a flat post. */
export type CommunityPostRow = {
  id?: string | number;
  attributes?: Record<string, unknown>;
  [key: string]: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

/** Merge root + `attributes` so a field is found wherever the API put it. */
export function communityPostAttrs(post: unknown): Record<string, unknown> {
  if (!isRecord(post)) return {};
  const attrs = isRecord(post.attributes) ? post.attributes : {};
  return { ...post, ...attrs };
}

function hasParentReference(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === 'number') return Number.isFinite(value) && value !== 0;
  if (typeof value === 'string') {
    const s = value.trim();
    return s !== '' && s !== '0' && s.toLowerCase() !== 'null';
  }
  if (isRecord(value)) {
    if (value.data != null) return hasParentReference(value.data);
    return value.id != null && hasParentReference(value.id);
  }
  return false;
}

/**
 * A reply/comment rather than a post. The API has used several names for the
 * parent reference over time, so all of them are checked — rendering a reply
 * as a full post is what this guards against.
 */
export function isCommunityCommentRow(post: unknown): boolean {
  const attrs = communityPostAttrs(post);
  if (
    hasParentReference(attrs.parent_id) ||
    hasParentReference(attrs.parent) ||
    hasParentReference(attrs.parent_post_id)
  ) {
    return true;
  }
  const kind = typeof attrs.type === 'string' ? attrs.type.trim().toLowerCase() : '';
  if (kind === 'comment' || kind === 'comments' || kind === 'reply') return true;
  return attrs.is_comment === true;
}

export function isCommunityPublishedRow(post: unknown): boolean {
  const status = communityPostAttrs(post).status;
  if (status == null) return true;
  return String(status).trim().toLowerCase() !== 'draft';
}

/** Top-level published post — never a reply, never a draft. */
export function isTopLevelPublishedCommunityPost(post: unknown): boolean {
  return !isCommunityCommentRow(post) && isCommunityPublishedRow(post);
}

/** Course ids the post was published under. */
export function readCommunityPostCourseIds(post: unknown): string[] {
  return readRecordCourseIds(communityPostAttrs(post) as LoosePostAttributes);
}

/** Keep only posts published under one of the student's own courses. */
export function isCommunityPostInStudentCourses(
  post: unknown,
  enrolledCourseIds: ReadonlySet<string>,
): boolean {
  return isWithinStudentCourses(readCommunityPostCourseIds(post), enrolledCourseIds);
}

/**
 * Course names to show on a post card: the titles the posts endpoint inlines
 * under `courses`, falling back to the student's own course list by id.
 */
export function readCommunityPostCourseNames(
  post: unknown,
  courseTitleById: Readonly<Record<string, string>> = {},
): string[] {
  const attrs = communityPostAttrs(post);
  const names = new Set<string>();

  const inline = attrs.courses;
  const list = Array.isArray(inline)
    ? inline
    : isRecord(inline) && Array.isArray(inline.data)
      ? inline.data
      : [];
  for (const course of list) {
    if (!isRecord(course)) continue;
    const courseAttrs = isRecord(course.attributes) ? course.attributes : course;
    const title = courseAttrs.title ?? courseAttrs.name;
    if (typeof title === 'string' && title.trim()) names.add(title.trim());
  }

  if (names.size === 0) {
    for (const id of readCommunityPostCourseIds(post)) {
      const title = courseTitleById[id];
      if (title?.trim()) names.add(title.trim());
    }
  }

  return Array.from(names);
}

/** Newest first, by `created_at`. */
export function sortCommunityPostsNewestFirst<T>(posts: readonly T[]): T[] {
  return [...posts].sort((a, b) => {
    const ta = new Date(String(communityPostAttrs(a).created_at ?? 0)).getTime();
    const tb = new Date(String(communityPostAttrs(b).created_at ?? 0)).getTime();
    return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
  });
}
