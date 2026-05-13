/**
 * Shared presentation helpers for community posts (admin + student).
 */

export function communityPostRelativeTime(
  dateString: string,
  t: (key: string, params?: Record<string, string | number>) => string,
  timeAgoKeyPrefix: string,
): string {
  const date = new Date(dateString);
  const now = new Date();
  if (Number.isNaN(date.getTime())) return '';

  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return t(`${timeAgoKeyPrefix}.justNow`);
  if (diffMins < 60) return t(`${timeAgoKeyPrefix}.minAgo`, { minutes: diffMins });
  if (diffHours < 24)
    return t(`${timeAgoKeyPrefix}.hourAgo`, { hours: diffHours, plural: diffHours > 1 ? 's' : '' });
  if (diffDays < 7)
    return t(`${timeAgoKeyPrefix}.dayAgo`, { days: diffDays, plural: diffDays > 1 ? 's' : '' });
  return date.toLocaleDateString();
}

export function communityPostTypeBadgeClasses(type: string): string {
  switch (type) {
    case 'question':
      return 'bg-[#DBEAFE] text-[#2563EB]';
    case 'summary':
      return 'bg-[#FEF3C7] text-[#D97706]';
    case 'post':
    default:
      return 'bg-[#E0E7FF] text-[#2137D6]';
  }
}
