'use server';

import { cookies } from 'next/headers';
import type { JwtUserData } from '@/src/interfaces/jwt-user.interface';
import { getJwtUserDataFromToken } from '@/src/lib/jwt-decode';

export async function getUserDataFromJWT(): Promise<JwtUserData | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get('token')?.value;
  if (!raw) return null;
  return getJwtUserDataFromToken(raw);
}

export default getUserDataFromJWT;
