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

/**
 * Threads a discussion list, whatever shape it arrives in.
 *
 * The chapter payload the student page reads lists every level as its own row
 * carrying a `parent_id`, while the list endpoint behind the staff pages
 * returns the roots only and hangs the thread under `attributes.replies`. The
 * UI reads `replies`, so both have to end up there: the nested rows are
 * registered as nodes of their own (a reply to a reply used to keep its
 * children in `attributes.replies`, where nothing rendered them), and a row
 * naming a parent is attached to it even when that parent arrived nested.
 */
export function buildDiscussionTree<T extends { id?: string | number; attributes?: { parent_id?: number | null; replies?: T[] }; replies?: T[] }>(flat: T[]): T[] {
  type Node = T & { replies: T[] };

  const map = new Map<string, Node>();
  /** Ids already sitting in some node's `replies`, so they are not also roots. */
  const attached = new Set<string>();

  const nestedReplies = (item: T): T[] => item.attributes?.replies ?? item.replies ?? [];
  const toNode = (item: T): Node => ({ ...item, replies: [] }) as Node;

  // The rows the caller passed in are authoritative: a nested copy of one of
  // them may be a stub, so it must not replace the row itself.
  for (const item of flat) {
    if (item.id != null && !map.has(String(item.id))) map.set(String(item.id), toNode(item));
  }

  const walked = new Set<string>();
  const linkNested = (item: T): void => {
    const key = item.id != null ? String(item.id) : null;
    // A payload that nests a row inside itself would otherwise recurse forever.
    if (key != null) {
      if (walked.has(key)) return;
      walked.add(key);
    }

    const parent = key != null ? map.get(key) : undefined;
    for (const child of nestedReplies(item)) {
      if (child.id == null) continue;
      const childKey = String(child.id);
      if (!map.has(childKey)) map.set(childKey, toNode(child));
      const childNode = map.get(childKey)!;

      if (parent && parent !== childNode && !parent.replies.some(reply => String(reply.id) === childKey)) {
        parent.replies.push(childNode);
        attached.add(childKey);
      }

      linkNested(child);
    }
  };
  for (const item of flat) linkNested(item);

  const roots: Node[] = [];
  for (const node of map.values()) {
    const parentId = node.attributes?.parent_id;
    const parent = parentId != null ? map.get(String(parentId)) : undefined;

    if (parent && parent !== node) {
      if (!parent.replies.some(reply => String(reply.id) === String(node.id))) parent.replies.push(node);
      attached.add(String(node.id));
    } else if (!attached.has(String(node.id))) {
      roots.push(node);
    }
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
