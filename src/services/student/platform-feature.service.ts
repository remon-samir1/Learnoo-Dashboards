import getUserDataFromJWT from '@/lib/server.utils';
import type { PlatformFeature } from '@/src/types';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://api.learnoo.app').replace(/\/$/, '');

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : null;
}

/**
 * Normalizes `/v1/feature` payloads (array, JSON:API list, or nested `data`) into `PlatformFeature[]`.
 */
export function normalizePlatformFeatureList(payload: unknown): PlatformFeature[] {
  const unwrap = (x: unknown): unknown => {
    const r = asRecord(x);
    if (!r) return x;
    if (Array.isArray(r.data)) return r.data;
    const inner = asRecord(r.data);
    if (inner && Array.isArray(inner.data)) return inner.data;
    return x;
  };

  const raw = unwrap(payload);
  if (!Array.isArray(raw)) return [];

  const out: PlatformFeature[] = [];
  for (const row of raw) {
    const o = asRecord(row);
    if (!o) continue;
    const attrs = asRecord(o.attributes) ?? o;
    const key = attrs.key != null ? String(attrs.key) : '';
    const value = attrs.value != null ? String(attrs.value) : '';
    const id = o.id != null ? String(o.id) : key || String(out.length);
    const type = o.type != null ? String(o.type) : 'platform-feature';
    if (!key) continue;
    out.push({
      id,
      type,
      attributes: { key, value, group: String(attrs.group ?? ''), type: String(attrs.type ?? '') },
    });
  }
  return out;
}

/** Server-side: same auth pattern as `chapter.service` / `getChapterById`. */
export async function getStudentPlatformFeatures(): Promise<PlatformFeature[]> {
  const userData = await getUserDataFromJWT();
  const token = userData?.token;
  if (!token) return [];

  try {
    const res = await fetch(`${API_BASE}/v1/feature`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
    const json: unknown = await res.json().catch(() => null);
    if (!res.ok) return [];
    const r = asRecord(json);
    const data = r?.data ?? json;
    return normalizePlatformFeatureList(data);
  } catch {
    return [];
  }
}
