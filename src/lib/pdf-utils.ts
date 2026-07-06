import type { User } from '@/src/types';
import type { JwtUserData } from '@/src/interfaces/jwt-user.interface';

/**
 * Extracts student code from user data (from JWT or full User object).
 */
export async function extractStudentCode(user: User | JwtUserData | null): string | null {
  if (!user) return null;

  // If it's a JwtUserData, we don't have rich student info
  if ('token' in user) {
    return null;
  }

  // If it's a User object
  if ('attributes' in user) {
    return user.attributes?.student_code ?? null;
  }

  return null;
}
