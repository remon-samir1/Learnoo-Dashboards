/**
 * Field labels and values for the audit snapshots in the staff activity log.
 *
 * The log used to render a fixed list of seven keys and, on an update, only
 * the ones that differed. An update that changed nothing outside that list —
 * which the API does send — filtered every row away and left the entry showing
 * its title and nothing else. So the keys come from the payload itself here,
 * and the caller decides what to do with the ones that did not change.
 */

type Labels = Record<string, readonly [string, string]>;

const FIELD_LABELS: Labels = {
  id: ['المعرّف', 'ID'],
  title: ['العنوان', 'Title'],
  video: ['ملف الفيديو', 'Video file'],
  lecture_id: ['رقم المحاضرة', 'Lecture ID'],
  course_id: ['رقم الدورة', 'Course ID'],
  status: ['حالة النشر', 'Publish status'],
  max_views: ['حد المشاهدات', 'View limit'],
  view_by_minute: ['ثانية احتساب المشاهدة', 'View threshold (seconds)'],
};

/** The order the known fields read best in; anything else follows, as it came. */
const FIELD_ORDER = Object.keys(FIELD_LABELS);

const PUBLISH_STATUS: Record<string, readonly [string, string]> = {
  '1': ['منشور', 'Published'],
  '0': ['مسودة', 'Draft'],
};

const EMPTY = '—';

function language(locale: string): 0 | 1 {
  return locale === 'ar' ? 0 : 1;
}

/** A key the backend added that we have no label for still reads as words. */
export function auditFieldLabel(key: string, locale: string): string {
  const known = FIELD_LABELS[key];
  if (known) return known[language(locale)];
  const words = key.replace(/[_-]+/g, ' ').trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : key;
}

/** Every key either snapshot carries, known ones first, in a stable order. */
export function auditFieldKeys(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
): string[] {
  const seen = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  const known = FIELD_ORDER.filter((key) => seen.has(key));
  const extra = [...seen].filter((key) => !FIELD_LABELS[key]).sort();
  return [...known, ...extra];
}

/** Display form for one snapshot value: a path keeps its file name, a status reads as a word. */
export function auditFieldValue(key: string, value: unknown, locale: string): string {
  if (value == null || value === '') return EMPTY;

  if (key === 'video' || key === 'path' || key === 'file') {
    const name = String(value).split(/[?#]/)[0].split('/').filter(Boolean).pop();
    return name || EMPTY;
  }

  if (key === 'status') {
    const label = PUBLISH_STATUS[String(value)];
    if (label) return label[language(locale)];
  }

  if (typeof value === 'boolean') {
    return value ? ['نعم', 'Yes'][language(locale)] : ['لا', 'No'][language(locale)];
  }

  if (typeof value === 'object') return JSON.stringify(value);

  return String(value);
}

/** `true` when the field is worth drawing attention to on an update. */
export function auditFieldChanged(
  key: string,
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
): boolean {
  if (!before || !after) return false;
  return JSON.stringify(before[key] ?? null) !== JSON.stringify(after[key] ?? null);
}
