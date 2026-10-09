/** Loose shapes for `chapter.attributes.discussions` from API (may be JSON:API or embedded). */

export type WatchDiscussionItem = {
  id?: string | number;
  attributes?: {
    content?: string;
    created_at?: string | null;
    moment?: number | null;
    type?: string | null;
    discussion_type?: string | null;
    parent_id?: number | null;
    replies?: WatchDiscussionItem[];
    image?: string | null;
    voice?: string | null;
    duration?: number | null;
    user?: {
      data?: {
        attributes?: {
          first_name?: string;
          last_name?: string;
          full_name?: string;
          role?: string;
        };
      };
    };
  };
  replies?: WatchDiscussionItem[];
};

export function normalizeDiscussions(raw: unknown): WatchDiscussionItem[] {
  if (!Array.isArray(raw)) return [];
  return raw as WatchDiscussionItem[];
}

export function buildDiscussionTree<T extends { id?: string | number; attributes?: { parent_id?: number | null; replies?: T[] }; replies?: T[] }>(flat: T[]): T[] {
  const map = new Map<string, T>();
  const roots: T[] = [];
  for (const item of flat) {
    if (item.id != null) map.set(String(item.id), { ...item, replies: [...(item.attributes?.replies ?? item.replies ?? [])] });
  }
  for (const item of map.values()) {
    const parent = item.attributes?.parent_id != null ? map.get(String(item.attributes.parent_id)) : undefined;
    if (parent) {
      if (!parent.replies?.some(reply => String(reply.id) === String(item.id))) parent.replies?.push(item);
    } else roots.push(item);
  }
  return roots;
}

export function discussionContent(d: WatchDiscussionItem): string {
  return d.attributes?.content?.trim() ?? '';
}

export function discussionCreatedAt(d: WatchDiscussionItem): string | null {
  const v = d.attributes?.created_at;
  return typeof v === 'string' && v.trim() ? v : null;
}

export function discussionMoment(d: WatchDiscussionItem): number | null {
  const m = d.attributes?.moment;
  if (m == null || Number.isNaN(Number(m))) return null;
  return Number(m);
}

export function discussionTypeLabel(d: WatchDiscussionItem): string | null {
  const t = d.attributes?.type;
  if (t == null || String(t).trim() === '') return null;
  return String(t).trim().toLowerCase();
}

export function discussionAuthorName(d: WatchDiscussionItem): string | null {
  const attrs = d.attributes?.user?.data?.attributes;
  if (!attrs) return null;
  const full = attrs.full_name?.trim();
  if (full) return full;
  const fn = attrs.first_name?.trim() ?? '';
  const ln = attrs.last_name?.trim() ?? '';
  const joined = `${fn} ${ln}`.trim();
  return joined || null;
}

export function discussionReplies(d: WatchDiscussionItem): WatchDiscussionItem[] {
  return d.replies ?? [];
}

export function discussionKey(d: WatchDiscussionItem, index: number): string {
  if (d.id != null) return String(d.id);
  return `d-${index}`;
}
