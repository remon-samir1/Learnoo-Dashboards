import type { NextRequest } from 'next/server';
import type { JwtUserData } from '@/src/interfaces/jwt-user.interface';
import { getJwtUserDataFromToken } from '@/src/lib/jwt-decode';
import { isAppRole, type AppRole } from '@/src/types/user-role';

/**
 * Read and decode the JWT from request cookies (proxy / edge safe).
 * Same payload as `getUserDataFromJWT()` in `lib/server.utils.ts`, without `cookies()`.
 */
export function getJwtUserDataFromRequest(
  request: NextRequest,
): JwtUserData | null {
  const raw = request.cookies.get('token')?.value;
  if (!raw) return null;
  return getJwtUserDataFromToken(raw);
}

/**
 * Resolve role from cookies + JWT (proxy / edge safe).
 * Priority: `user_role` cookie → `user_data` JSON → JWT `role` claim.
 */
export function getRoleFromRequest(request: NextRequest): AppRole | null {
  const cookieRole = request.cookies.get('user_role')?.value;
  if (isAppRole(cookieRole)) return cookieRole;

  const userDataRaw = request.cookies.get('user_data')?.value;
  if (userDataRaw) {
    try {
      const parsed = JSON.parse(userDataRaw) as {
        attributes?: { role?: string };
      };
      if (isAppRole(parsed.attributes?.role)) {
        return parsed.attributes.role;
      }
    } catch {
      /* ignore malformed cookie */
    }
  }

  const jwtRole = getJwtUserDataFromRequest(request)?.data?.role;
  if (typeof jwtRole === 'string' && isAppRole(jwtRole)) {
    return jwtRole;
  }

  return null;
}
