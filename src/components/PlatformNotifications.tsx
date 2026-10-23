"use client";

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { notificationHref } from '@/src/lib/notification-href';
import { toast } from 'sonner';
import api, { type NotificationFilters, type NotificationOptions, type PlatformNotification } from '@/src/lib/api';

export default function PlatformNotifications({ canSend = false }: { canSend?: boolean }) {
  const locale = useLocale();
  const ar = locale === 'ar';
  const pathname = usePathname();
  const instructor = pathname.startsWith('/doctor/');
  const sendForm = canSend && pathname.endsWith('/add');
  const inboxHref = instructor ? '/doctor/notifications' : '/notifications';
  const [items, setItems] = useState<PlatformNotification[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sending, setSending] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [course, setCourse] = useState('');
  const [courseSearch, setCourseSearch] = useState('');
  const [draft, setDraft] = useState<NotificationFilters>({});
  const [filters, setFilters] = useState<NotificationFilters>({});
  const [options, setOptions] = useState<NotificationOptions>({ courses: [], departments: [] });
  const [optionsError, setOptionsError] = useState(false);
  const [total, setTotal] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const courses = options.courses;
  const matchingCourses = courses.filter(c => c.sendable && c.title.toLocaleLowerCase().includes(courseSearch.trim().toLocaleLowerCase()));
  const filterCourses = courses.filter(c => !draft.department_id || c.department_ids.includes(Number(draft.department_id)));
  const kinds = [
    ['announcement', 'رسائل يدوية', 'Manual announcements'], ['activation', 'تفعيل وإلغاء تفعيل المحتوى', 'Content access'],
    ['account', 'الحسابات والأجهزة', 'Accounts and devices'], ['course', 'المواد', 'Courses'], ['lecture', 'المحاضرات', 'Lectures'],
    ['lesson', 'الدروس', 'Lessons'], ['exam', 'الامتحانات', 'Exams'], ['live', 'البث المباشر', 'Live sessions'],
    ['note', 'الملاحظات', 'Notes'], ['library', 'المكتبة', 'Library'], ['timetable', 'الجداول', 'Timetables'],
    ['community', 'المجتمع', 'Community'], ['discussion', 'المناقشات', 'Discussions'], ['support-issue', 'الدعم', 'Support'], ['feedback', 'رسائل أولياء الأمور', 'Guardian messages'], ['general', 'عام', 'General'],
  ];

  useEffect(() => {
    let active = true;
    api.notifications.options().then(result => { if (active) { setOptions(result); setOptionsError(false); } })
      .catch(() => active && setOptionsError(true));
    return () => { active = false; };
  }, [refresh]);

  useEffect(() => {
    if (sendForm) return;
    let active = true;
    const load = () => api.notifications.list(page, filters).then(result => {
      if (!active) return;
      setItems(result.data);
      setLastPage(result.meta.last_page);
      setTotal(result.meta.total);
      setError(false);
    }).catch(() => active && setError(true)).finally(() => active && setLoading(false));
    void load();
    const timer = setInterval(load, 30000);
    return () => { active = false; clearInterval(timer); };
  }, [page, filters, sendForm, refresh]);

  return <div className="min-w-0 space-y-6 pb-12">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-bold">{sendForm ? (ar ? 'إرسال إشعار' : 'Send notification') : (ar ? 'الإشعارات' : 'Notifications')}</h1>
      {canSend && <Link href={sendForm ? inboxHref : `${inboxHref}/add`} className="text-primary underline">{sendForm ? (ar ? 'العودة إلى الإشعارات' : 'Back to notifications') : (ar ? 'إرسال إشعار' : 'Send notification')}</Link>}
    </div>
    {optionsError && <p role="alert">{ar ? 'تعذر تحميل خيارات المواد والفِرَق. أعد تحميل الصفحة للمحاولة.' : 'Could not load course and year options. Reload the page to retry.'}</p>}
    {sendForm && <form className="space-y-4 rounded-2xl border bg-white p-6" onSubmit={async e => {
      e.preventDefault(); setSending(true);
      try {
        const result = await api.notifications.send({ title, message, course_id: course ? Number(course) : undefined });
        if (!result.sent) {
          toast.warning(ar ? 'لا يوجد طلاب مفعّل لهم المحتوى المحدد. لم يتم إرسال إشعارات.' : 'No students have access to the selected content. No notifications were sent.');
          return;
        }
        toast.success(ar ? `تم إرسال ${result.sent} إشعار` : `Sent ${result.sent} notifications`);
        setTitle(''); setMessage(''); setRefresh(n => n + 1);
      } catch { toast.error(ar ? 'تعذر الإرسال. تحقق من اختيار الدورة.' : 'Could not send. Check the selected course.'); }
      finally { setSending(false); }
    }}>
      <label className="block">{ar ? 'العنوان' : 'Title'}<input required maxLength={255} value={title} onChange={e => setTitle(e.target.value)} className="mt-2 w-full rounded-xl border p-3" /></label>
      <label className="block">{ar ? 'الرسالة' : 'Message'}<textarea required maxLength={2000} value={message} onChange={e => setMessage(e.target.value)} className="mt-2 w-full rounded-xl border p-3" /></label>
      <label className="block">{ar ? 'البحث عن مادة' : 'Search courses'}<input type="search" value={courseSearch} onChange={e => setCourseSearch(e.target.value)} className="mt-2 w-full rounded-xl border p-3" /></label>
      <label className="block">{ar ? 'المستلمون' : 'Recipients'}<select required={instructor} value={course} onChange={e => setCourse(e.target.value)} className="mt-2 w-full min-w-0 rounded-xl border p-3">
        <option value="">{instructor ? (ar ? 'اختر مادة' : 'Select a course') : (ar ? 'كل الطلاب (للإدارة فقط)' : 'All students (administration only)')}</option>
        {courses.filter(c => c.sendable && (String(c.id) === course || matchingCourses.includes(c))).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
      </select></label>
      {courseSearch.trim() && !matchingCourses.length && <p role="status" className="text-sm text-gray-500">{ar ? 'لا توجد مواد مطابقة للبحث' : 'No matching courses'}</p>}
      <button disabled={sending || optionsError} className="rounded-xl bg-primary px-5 py-3 text-white disabled:opacity-50">{sending ? (ar ? 'جارٍ الإرسال…' : 'Sending…') : (ar ? 'إرسال' : 'Send')}</button>
    </form>}
    {!sendForm && <>
      <form className="space-y-4 rounded-2xl border bg-white p-5" onSubmit={e => { e.preventDefault(); setPage(1); setLoading(true); setFilters({ ...draft }); }}>
        <h2 className="font-semibold">{ar ? 'البحث وفلترة الإشعارات الواردة' : 'Search and filter received notifications'}</h2>
        <label className="block">{ar ? 'البحث في الإشعارات (العنوان أو الرسالة)' : 'Search notifications (title or message)'}<input type="search" maxLength={255} value={draft.search ?? ''} onChange={e => setDraft({ ...draft, search: e.target.value })} className="mt-2 w-full rounded-xl border p-3" /></label>
        <details><summary className="cursor-pointer text-primary">{ar ? 'فلاتر البحث' : 'Search filters'}</summary>
          <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="min-w-0">{ar ? 'نوع الإشعار' : 'Notification type'}<select value={draft.type ?? ''} onChange={e => setDraft({ ...draft, type: e.target.value })} className="mt-2 w-full rounded-xl border p-3">
              <option value="">{ar ? 'كل الأنواع' : 'All types'}</option>{kinds.map(k => <option key={k[0]} value={k[0]}>{k[ar ? 1 : 2]}</option>)}
            </select></label>
            <label className="min-w-0">{ar ? 'الفرقة الدراسية' : 'Academic year'}<select value={draft.department_id ?? ''} onChange={e => setDraft({ ...draft, department_id: e.target.value, course_id: '' })} className="mt-2 w-full rounded-xl border p-3">
              <option value="">{ar ? 'كل الفِرَق' : 'All years'}</option>{options.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select></label>
            <label className="min-w-0">{ar ? 'المادة' : 'Course'}<select value={draft.course_id ?? ''} onChange={e => setDraft({ ...draft, course_id: e.target.value })} className="mt-2 w-full rounded-xl border p-3">
              <option value="">{ar ? 'كل المواد' : 'All courses'}</option>{filterCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select></label>
            <label>{ar ? 'حالة القراءة' : 'Read status'}<select value={draft.status ?? ''} onChange={e => setDraft({ ...draft, status: e.target.value })} className="mt-2 w-full rounded-xl border p-3">
              <option value="">{ar ? 'الكل' : 'All'}</option><option value="unread">{ar ? 'غير مقروء' : 'Unread'}</option><option value="read">{ar ? 'مقروء' : 'Read'}</option>
            </select></label>
            <label className="min-w-0">{ar ? 'من تاريخ' : 'From date'}<input type="date" value={draft.from ?? ''} max={draft.to || undefined} onChange={e => setDraft({ ...draft, from: e.target.value })} className="mt-2 w-full min-w-0 rounded-xl border p-3" /></label>
            <label className="min-w-0">{ar ? 'إلى تاريخ' : 'To date'}<input type="date" value={draft.to ?? ''} min={draft.from || undefined} onChange={e => setDraft({ ...draft, to: e.target.value })} className="mt-2 w-full min-w-0 rounded-xl border p-3" /></label>
          </div>
        </details>
        <div className="flex flex-wrap gap-3"><button className="rounded-xl bg-primary px-5 py-2 text-white">{ar ? 'بحث وتطبيق' : 'Search and apply'}</button><button type="button" className="rounded-xl border px-5 py-2" onClick={() => { setDraft({}); setFilters({}); setPage(1); setLoading(true); }}>{ar ? 'مسح الفلاتر' : 'Reset filters'}</button></div>
        {Object.entries(filters).some(([, value]) => value) && <p className="text-sm text-gray-600" role="status">{ar ? 'الفلاتر النشطة: ' : 'Active filters: '}{[
          filters.search, kinds.find(k => k[0] === filters.type)?.[ar ? 1 : 2], options.departments.find(d => String(d.id) === filters.department_id)?.name,
          courses.find(c => String(c.id) === filters.course_id)?.title, filters.status ? (filters.status === 'read' ? (ar ? 'مقروء' : 'Read') : (ar ? 'غير مقروء' : 'Unread')) : '', filters.from, filters.to,
        ].filter(Boolean).join(' · ')}</p>}
      </form>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite">{ar ? `النتائج: ${total}` : `Results: ${total}`}</p>
        <button className="text-primary underline" onClick={async () => {
          try { await api.notifications.readAll(); setRefresh(n => n + 1); }
          catch { toast.error(ar ? 'تعذر تحديد الإشعارات كمقروءة' : 'Could not mark notifications as read'); }
        }}>{ar ? 'تحديد كل الوارد كمقروء' : 'Mark entire inbox as read'}</button>
      </div>
      {error ? <div role="alert"><p>{ar ? 'تعذر تحميل الإشعارات' : 'Could not load notifications'}</p><button className="text-primary underline" onClick={() => { setLoading(true); setRefresh(n => n + 1); }}>{ar ? 'إعادة المحاولة' : 'Retry'}</button></div> : loading ? <p role="status">{ar ? 'جارٍ التحميل…' : 'Loading…'}</p> : !items.length ? <p>{ar ? 'لا توجد إشعارات مطابقة' : 'No matching notifications'}</p> : items.map(item => <article key={item.id} className={`break-words rounded-2xl border p-5 ${item.read_at ? 'bg-white' : 'bg-blue-50'}`}>
        <h2 className="font-bold">{item.data.title}</h2><p className="mt-2 whitespace-pre-wrap">{item.data.message}</p><time className="mt-2 block text-xs text-gray-500">{new Date(item.created_at).toLocaleString(ar ? 'ar' : 'en')}</time>
        {item.data.actor_name && <p className="mt-2 text-xs text-gray-500">{ar ? 'بواسطة' : 'By'}: {item.data.actor_name}</p>}
        {notificationHref(item.data, pathname, locale) && <Link href={notificationHref(item.data, pathname, locale)!} onClick={() => { void api.notifications.read(item.id); }} className="mt-2 block text-sm text-primary underline">{item.data.type === 'support-issue' ? (ar ? 'عرض الشكوى' : 'View complaint') : (ar ? 'فتح المحتوى' : 'Open content')}</Link>}
        {!item.read_at && <button className="mt-2 text-sm text-primary underline" onClick={async () => {
            try { await api.notifications.read(item.id); setRefresh(n => n + 1); }
            catch { toast.error(ar ? 'تعذر تحديد الإشعار كمقروء' : 'Could not mark notification as read'); }
          }}>{ar ? 'تحديد كمقروء' : 'Mark as read'}</button>}
      </article>)}
      <div className="flex items-center gap-4"><button disabled={loading || page <= 1} onClick={() => { setLoading(true); setPage(page - 1); }}>{ar ? 'السابق' : 'Previous'}</button><span>{page} / {lastPage}</span><button disabled={loading || page >= lastPage} onClick={() => { setLoading(true); setPage(page + 1); }}>{ar ? 'التالي' : 'Next'}</button></div>
    </>}
  </div>;
}
