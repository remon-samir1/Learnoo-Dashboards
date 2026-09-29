/**
 * Student notifications (`GET /v1/notifications`), the same payload the mobile app reads
 * (`lib/features/home/data/models/notification.dart`).
 *
 * The envelope is a Laravel database-notification row: `id`, the notification class in
 * `type`, the notifiable (always the student) in `notifiable_type` / `notifiable_id`, and
 * the broadcast body in `data`.
 */

/**
 * Body of a notification. Only `title` / `message` are guaranteed; every other key is
 * optional because the backend composes `data` per notification class, so deep-link ids
 * are read defensively (see `src/lib/student-notification-target.ts`).
 */
export type StudentNotificationData = {
  title?: string | null;
  message?: string | null;
  type?: string | null;
  device?: string | null;
  ip_address?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
};

export type StudentNotification = {
  id: string;
  type: string;
  notifiable_type?: string | null;
  notifiable_id?: string | null;
  data: StudentNotificationData;
  read_at: string | null;
  created_at: string;
  updated_at?: string | null;
};

/** `meta` block returned alongside the notification list. */
export type StudentNotificationMeta = {
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
  unread_count?: number;
};

/**
 * `GET /v1/notifications` responds with `{ data: [...], meta }`, but some deployments nest
 * the paginator under `data`. Both shapes are normalized by `normalizeStudentNotifications`.
 */
export type StudentNotificationListResponse = {
  data?: StudentNotification[] | { data?: StudentNotification[]; meta?: StudentNotificationMeta } | null;
  meta?: StudentNotificationMeta | null;
  message?: string;
};

export type StudentNotificationCountResponse = {
  count?: number;
  data?: { count?: number } | null;
  message?: string;
};

/** UI grouping used by the notifications page filters. */
export type StudentNotificationCategory = 'all' | 'live' | 'course' | 'exam' | 'general';
