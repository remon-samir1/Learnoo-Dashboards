import type { JwtPayload, JwtUserData } from '@/src/interfaces/jwt-user.interface';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Middleware/proxy-safe JWT payload decode (no `cookies()` or other server-only APIs).
 */
export function decodeJwtPayload(token: string): JwtPayload | null {
  const clean = token.replace(/^Bearer\s+/i, '').trim();
  const parts = clean.split('.');
  if (parts.length < 2) return null;

  try {
    const segment = parts[1];
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = atob(padded);
    const parsed: unknown = JSON.parse(json);
    return isRecord(parsed) ? (parsed as JwtPayload) : null;
  } catch {
    return null;
  }
}

export function getJwtUserDataFromToken(
  rawToken: string | null | undefined,
): JwtUserData | null {
  if (!rawToken?.trim()) return null;

  const cleanToken = rawToken.replace(/^Bearer\s+/i, '').trim();
  const data = decodeJwtPayload(cleanToken);
  if (!data) return null;

  return { token: cleanToken, data };
}
