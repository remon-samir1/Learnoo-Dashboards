import type { AppRole } from '@/src/types/user-role';

/**
 * Decoded JWT payload (middle segment of the access token).
 * Claim names vary by issuer; only document fields used or commonly present.
 */
export interface JwtPayload {
  sub?: string | number;
  exp?: number;
  iat?: number;
  nbf?: number;
  jti?: string;
  role?: AppRole | string;
  email?: string;
}

/** Return shape of `getUserDataFromJWT()` — token + decoded claims. */
export interface JwtUserData {
  token: string;
  data: JwtPayload;
}
