import type { User } from '@/src/types';
import type { WatermarkConfig } from '@/src/types/watermark-config';

type LooseUserAttrs = User['attributes'] & {
  student_code?: string | null;
};

/**
 * Watermark line for the student player — `config.text`, student code, phone (Admin toggles),
 * plus signed-in **user id** (`user.id`) for traceability. No email / full name unless backend adds keys.
 */
function appendUserId(user: User | null, line: string): string {
  const id = user?.id != null ? String(user.id).trim() : '';
  if (!id) return line;
  const trimmed = line.trim();
  if (!trimmed) return id;
  if (trimmed.includes(id)) return trimmed;
  return `${trimmed} · ${id}`;
}

export function buildWatermarkText(user: User | null, config: WatermarkConfig): string {
  let line: string;
  if (config.useStudentCode) {
    const attrs = (user?.attributes ?? {}) as LooseUserAttrs;
    const code = attrs.student_code != null ? String(attrs.student_code).trim() : '';
    const primary = code || '—';
    if (config.usePhoneNumber) {
      const phone = attrs.phone != null ? String(attrs.phone).trim() : '';
      line = phone ? `${primary} · ${phone}` : primary;
    } else {
      line = primary;
    }
  } else {
    line = config.text?.trim() || DEFAULT_FALLBACK_TEXT;
  }
  return line
}

const DEFAULT_FALLBACK_TEXT = 'Learnoo';
