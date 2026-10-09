'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Bell } from 'lucide-react';
import { notificationsApi } from '@/src/lib/api';

export default function StaffNotificationLink({ href }: { href: string }) {
  const [unread, setUnread] = useState(0);
  const ar = useLocale() === 'ar';
  useEffect(() => {
    let active = true;
    const refresh = () => notificationsApi.list().then(result => {
      if (active) setUnread(result.meta.unread_count);
    }).catch(() => {});
    void refresh();
    const timer = setInterval(refresh, 30000);
    return () => { active = false; clearInterval(timer); };
  }, []);
  return <Link href={href} aria-label={ar ? `الإشعارات، ${unread} غير مقروء` : `Notifications, ${unread} unread`} className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100">
    <Bell className="size-5" />
    {unread > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-blue-600 px-1.5 text-xs text-white">{unread}</span>}
  </Link>;
}
