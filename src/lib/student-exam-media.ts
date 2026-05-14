const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://api.learnoo.app').replace(/\/$/, '');

/** Resolve quiz / answer media URLs for student exam UI. */
export function resolveStudentExamMediaUrl(url: string | null | undefined): string | null {
  const u = url?.trim();
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  return `${API_BASE}${u.startsWith('/') ? u : `/${u}`}`;
}
