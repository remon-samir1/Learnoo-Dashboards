/** Loose shapes for `chapter.attributes.discussions` from API (may be JSON:API or embedded). */

export type WatchDiscussionItem = {
  id?: string | number;
  attributes?: {
    content?: string;
    created_at?: string | null;
    moment?: number | null;
    type?: string | null;
    user?: {
      data?: {
        attributes?: {
          first_name?: string;
          last_name?: string;
          full_name?: string;
        };
      };
    };
  };
};

export function normalizeDiscussions(raw: unknown): WatchDiscussionItem[] {
  if (!Array.isArray(raw)) return [];
  return raw as WatchDiscussionItem[];
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

export function discussionKey(d: WatchDiscussionItem, index: number): string {
  if (d.id != null) return String(d.id);
  return `d-${index}`;
}
