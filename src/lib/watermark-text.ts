import type { User } from '@/src/types';
import type { WatermarkConfig } from '@/src/types/watermark-config';

type LooseUserAttrs = User['attributes'] & {
  student_code?: string | null;
};

/**
 * Watermark line for the student player — `config.text`, student code, phone (Admin toggles),
 * plus signed-in **student code** (`student_code`) for traceability. No email / full name unless backend adds keys.
 */
function appendStudentCode(user: User | null, line: string): string {
  const attrs = (user?.attributes ?? {}) as LooseUserAttrs;
  const code = attrs.student_code != null ? String(attrs.student_code).trim() : '';
  if (!code) return line;
  const trimmed = line.trim();
  if (!trimmed) return code;
  if (trimmed.includes(code)) return trimmed;
  return `${trimmed} · ${code}`;
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

  // Append student code for traceability (matches PDF watermark behavior)
  return appendStudentCode(user, line);
}

const DEFAULT_FALLBACK_TEXT = 'Learnoo';
