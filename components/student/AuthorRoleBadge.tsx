'use client';

import { useTranslations } from 'next-intl';

const roles: Record<string, string> = {
  Student: 'student',
  Instructor: 'instructor',
  Admin: 'admin',
  'Super Admin': 'owner',
  Support: 'support',
  Parent: 'parent',
};

export function AuthorRoleBadge({ role, dark = false }: { role?: string; dark?: boolean }) {
  const t = useTranslations('common.authorRoles');
  const key = role && Object.hasOwn(roles, role) ? roles[role] : undefined;
  if (!key) return null;

  return (
    <span className={`inline-flex shrink-0 whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold ${dark
      ? 'border-slate-600 bg-slate-800 text-slate-200'
      : 'border-slate-200 bg-slate-100 text-slate-700'}`}>
      {t(key)}
    </span>
  );
}
