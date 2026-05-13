import type { Library } from '@/src/types';

/** Human-readable file size from API `size` string (bytes). */
export function formatLibraryAttachmentSize(sizeRaw: string | undefined): string {
  const n = Number.parseInt(String(sizeRaw ?? ''), 10);
  if (!Number.isFinite(n) || n < 0) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function isStudentLibraryPublished(lib: Library): boolean {
  return lib.attributes.is_publish !== false;
}

export function librarySearchHaystack(lib: Library): string {
  const a = lib.attributes;
  return [a.title, a.description, String(a.course_id ?? ''), a.material_type].join(' ').toLowerCase();
}
