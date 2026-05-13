import type { CurrentUser } from "@/src/interfaces/current-user.interface";

/**
 * Normalize `/auth/me` payload or a flat `CurrentUser` into a single attributes object.
 */
export function getUserAttributes(user: unknown): CurrentUser {
  if (!user || typeof user !== "object") {
    return {};
  }

  const u = user as Record<string, unknown>;

  if (
    "full_name" in u ||
    "email" in u ||
    "first_name" in u ||
    "student_code" in u
  ) {
    return u as CurrentUser;
  }

  const data = u.data;
  if (!data || typeof data !== "object") {
    return {};
  }

  const d = data as Record<string, unknown>;
  const attrs = d.attributes;
  if (!attrs || typeof attrs !== "object") {
    return {};
  }

  const flat = attrs as CurrentUser;
  const topId = typeof d.id === "string" ? d.id : undefined;

  return {
    ...flat,
    id: flat.id ?? topId ?? null,
  };
}

/**
 * Two-letter initials for avatars. If `full_name` is missing or empty, returns `"ST"`.
 */
export function getUserInitials(fullName?: string | null): string {
  const raw = fullName?.trim();
  if (!raw) return "ST";

  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0]?.[0];
    const b = parts[1]?.[0];
    if (a && b) return `${a}${b}`.toUpperCase();
  }

  const single = parts[0] ?? raw;
  if (single.length >= 2) {
    return single.slice(0, 2).toUpperCase();
  }
  if (single.length === 1) {
    return `${single}T`.toUpperCase();
  }

  return "ST";
}
