/**
 * Role label keys for the discussion badges.
 *
 * The badge used to be rendered as ``t(`badges.${role}`)`` straight off the
 * API, so a role the `discussions.badges` namespace had no entry for printed
 * the raw key path instead of a label (an `Instructor` reply showed
 * `DISCUSSIONS.BADGES.INSTRUCTOR`). The API spells roles in title case
 * ("Instructor", "Super Admin"), while the message keys are camelCase, so the
 * lookup goes through this map and falls back to the student badge rather than
 * passing an unknown string to `t`.
 */

const ROLE_BADGE_KEYS: Record<string, string> = {
  student: 'student',
  instructor: 'instructor',
  doctor: 'doctor',
  admin: 'admin',
  'super admin': 'superAdmin',
  owner: 'superAdmin',
  support: 'support',
  parent: 'parent',
};

/** The `discussions.badges` key for an API role name, never an unknown key. */
export function discussionRoleBadgeKey(role: unknown): string {
  const normalized = typeof role === 'string' ? role.trim().toLowerCase() : '';
  return ROLE_BADGE_KEYS[normalized] ?? 'student';
}
