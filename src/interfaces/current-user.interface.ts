/**
 * Authenticated user from GET /v1/auth/me (student context).
 * All fields optional — API may omit or return null.
 */

export interface CurrentUserActivityStats {
  notes_created?: number | null;
  downloads?: number | null;
  live_attendance?: number | null;
  community_posts?: number | null;
}

export interface CurrentUserDeviceAccess {
  device?: string | null;
  last_ip?: string | null;
}

export interface CurrentUser {
  id?: string | null;
  student_code?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  role?: string | null;
  status_name?: string | null;
  status?: number | null;
  email?: string | null;
  phone?: string | number | null;
  image?: string | null;
  activity_stats?: CurrentUserActivityStats | null;
  device_access?: CurrentUserDeviceAccess | null;
}
