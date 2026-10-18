"use client";

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { notificationHref } from '@/src/lib/notification-href';
import { toast } from 'sonner';
import api, { type PlatformNotification } from '@/src/lib/api';
import { useCourses } from '@/src/hooks/useCourses';

export default function PlatformNotifications({ canSend = false }: { canSend?: boolean }) {
  const ar = useLocale() === 'ar';
  const locale = useLocale();
  const pathname = usePathname();
  const { data: courses } = useCourses({ per_page: 500 }, { enabled: canSend });
  const [items, setItems] = useState<PlatformNotification[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sending, setSending] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [course, setCourse] = useState('');

  useEffect(() => {
    let active = true;
    const refresh = () => api.notifications.list(page).then(result => {
      if (!active) return;
      setItems(result.data);
      setLastPage(result.meta.last_page);
      setError(false);
    }).catch(() => active && setError(true)).finally(() => active && setLoading(false));
    void refresh();
    const timer = setInterval(refresh, 30000);
    return () => { active = false; clearInterval(timer); };
  }, [page]);

  return <div className="space-y-6 pb-12">
    <h1 className="text-2xl font-bold">{ar ? 'الإشعارات' : 'Notifications'}</h1>
    {canSend && <form className="space-y-4 rounded-2xl border bg-white p-6" onSubmit={async e => {
      e.preventDefault(); setSending(true);
      try {
        const result = await api.notifications.send({ title, message, course_id: course ? Number(course) : undefined });
        toast.success(ar ? `تم إرسال ${result.sent} إشعار` : `Sent ${result.sent} notifications`);
        setTitle(''); setMessage('');
      } catch { toast.error(ar ? 'تعذر الإرسال. تحقق من اختيار الدورة.' : 'Could not send. Check the selected course.'); }
      finally { setSending(false); }
    }}>
      <label className="block">{ar ? 'العنوان' : 'Title'}<input required maxLength={255} value={title} onChange={e => setTitle(e.target.value)} className="mt-2 w-full rounded-xl border p-3" /></label>
      <label className="block">{ar ? 'الرسالة' : 'Message'}<textarea required maxLength={2000} value={message} onChange={e => setMessage(e.target.value)} className="mt-2 w-full rounded-xl border p-3" /></label>
      <label className="block">{ar ? 'المستلمون' : 'Recipients'}<select value={course} onChange={e => setCourse(e.target.value)} className="mt-2 w-full rounded-xl border p-3">
        <option value="">{ar ? 'كل الطلاب (للإدارة فقط)' : 'All students (administration only)'}</option>
        {(courses ?? []).map(c => <option key={c.id} value={c.id}>{c.attributes.title}</option>)}
      </select></label>
      <button disabled={sending} className="rounded-xl bg-primary px-5 py-3 text-white disabled:opacity-50">{sending ? (ar ? 'جارٍ الإرسال…' : 'Sending…') : (ar ? 'إرسال' : 'Send')}</button>
    </form>}
    <button className="text-primary underline" onClick={async () => {
      await api.notifications.readAll(); setItems(prev => prev.map(item => ({ ...item, read_at: new Date().toISOString() })));
    }}>{ar ? 'تحديد الكل كمقروء' : 'Mark all as read'}</button>
    {error ? <p role="alert">{ar ? 'تعذر تحميل الإشعارات' : 'Could not load notifications'}</p> : loading ? <p>{ar ? 'جارٍ التحميل…' : 'Loading…'}</p> : !items.length ? <p>{ar ? 'لا توجد إشعارات' : 'No notifications'}</p> : items.map(item => <article key={item.id} className={`rounded-2xl border p-5 ${item.read_at ? 'bg-white' : 'bg-blue-50'}`}>
      <h2 className="font-bold">{item.data.title}</h2><p className="mt-2 whitespace-pre-wrap">{item.data.message}</p><time className="mt-2 block text-xs text-gray-500">{new Date(item.created_at).toLocaleString(ar ? 'ar' : 'en')}</time>
      {notificationHref(item.data, pathname, locale) && <Link href={notificationHref(item.data, pathname, locale)!} onClick={() => { void api.notifications.read(item.id); }} className="mt-2 block text-sm text-primary underline">{item.data.type === 'support-issue' ? (ar ? 'عرض الشكوى' : 'View complaint') : (ar ? 'فتح المحتوى' : 'Open content')}</Link>}
      {!item.read_at && <button className="mt-2 text-sm text-primary underline" onClick={async () => { await api.notifications.read(item.id); setItems(prev => prev.map(n => n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n)); }}>{ar ? 'تحديد كمقروء' : 'Mark as read'}</button>}
    </article>)}
    <div className="flex items-center gap-4"><button disabled={page <= 1} onClick={() => setPage(page - 1)}>{ar ? 'السابق' : 'Previous'}</button><span>{page} / {lastPage}</span><button disabled={page >= lastPage} onClick={() => setPage(page + 1)}>{ar ? 'التالي' : 'Next'}</button></div>
  </div>;
}
