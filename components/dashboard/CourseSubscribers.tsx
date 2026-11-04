'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import { coursesApi } from '@/src/lib/api';

export default function CourseSubscribers({ courseId, title, onRemoved }: { courseId: number; title: string; onRemoved: () => void }) {
  const ar = useLocale() === 'ar';
  const [list, setList] = useState<Awaited<ReturnType<typeof coursesApi.subscribers>> | null>(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [all, setAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    coursesApi.subscribers(courseId, page).then(result => {
      if (!active) return;
      if (page > result.last_page) { setPage(result.last_page); return; }
      setList(result);
    }).catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [courseId, page, revision]);

  const count = all ? (list?.total || 0) + (list?.pending_count || 0) : selected.length;
  async function remove() {
    if (!count || !window.confirm(ar
      ? `إلغاء ${count} تفعيل من «${title}»؟ ${all ? 'يشمل ذلك أرقام التفعيل المسبق المعلقة. ' : ''}ستبقى الحسابات والمشاهدات والتقدم محفوظة عند إعادة التفعيل.`
      : `Remove ${count} subscriptions to “${title}”? ${all ? 'This includes pending pre-activation numbers. ' : ''}Accounts, viewing history and progress will be kept for reactivation.`)) return;
    setBusy(true);
    try {
      const result = await coursesApi.removeSubscribers(courseId, all ? { all: true } : { student_ids: selected });
      setSelected([]);
      setAll(false);
      setRevision(value => value + 1);
      onRemoved();
      toast.success(ar ? `تم إلغاء تفعيل ${result.removed} طالب و${result.pending_removed} رقم معلق` : `Removed access for ${result.removed} students and ${result.pending_removed} pending numbers`);
    } catch {
      toast.error(ar ? 'تعذر إلغاء التفعيل. حدّث القائمة وحاول مرة أخرى.' : 'Could not remove access. Refresh the list and try again.');
    } finally { setBusy(false); }
  }

  if (loading) return <p role="status">{ar ? 'جارٍ تحميل الطلاب…' : 'Loading students…'}</p>;
  if (error || !list) return <div role="alert"><p>{ar ? 'تعذر تحميل الطلاب' : 'Could not load students'}</p><button type="button" onClick={() => setRevision(value => value + 1)}>{ar ? 'إعادة المحاولة' : 'Retry'}</button></div>;
  return <div className="space-y-4">
    <p className="text-sm text-gray-500">{ar ? 'إلغاء التفعيل يوقف الوصول لهذا الكورس ويحفظ المشاهدات والتقدم عند إعادة التفعيل.' : 'Removing access keeps viewing history and progress for reactivation.'}</p>
    <p className="text-sm font-medium">{ar ? `الطلاب المسجلون المفعّل لهم: ${list.total}` : `Registered students with access: ${list.total}`}</p>
    <p className="text-sm text-gray-500">{ar ? 'القائمة تشمل كل تفعيلات الكورس، وليس آخر شيت فقط.' : 'This list includes all course activations, not only the latest sheet.'}</p>
    {list.pending_count > 0 && <p className="text-sm text-gray-500">{ar ? `أرقام تفعيل مسبق معلقة: ${list.pending_count}. إلغاء الكل يشملها حتى لا تتفعل لاحقًا عند تسجيل الدخول.` : `Pending pre-activation numbers: ${list.pending_count}. Removing all includes them so they cannot activate on a later sign-in.`}</p>}
    {list.total + list.pending_count > 0 && <div className="flex flex-wrap items-center gap-3 border-b pb-3">
      <button type="button" disabled={busy || all} onClick={() => setSelected([...new Set([...selected, ...list.data.map(student => student.id)])])} className="text-sm text-primary underline disabled:opacity-50">{ar ? 'تحديد الصفحة' : 'Select page'}</button>
      <button type="button" disabled={busy} onClick={() => { setAll(true); setSelected([]); }} className="text-sm text-primary underline disabled:opacity-50">{list.pending_count > 0
        ? (ar ? `تحديد الكل (${list.total} طالبًا و${list.pending_count} رقمًا معلقًا)` : `Select all (${list.total} students and ${list.pending_count} pending numbers)`)
        : (ar ? `تحديد الكل (${list.total})` : `Select all subscriptions (${list.total})`)}</button>
      {count > 0 && <button type="button" disabled={busy} onClick={() => { setAll(false); setSelected([]); }} className="text-sm underline">{ar ? 'إلغاء التحديد' : 'Clear selection'}</button>}
      <span role="status" className="text-sm">{all && list.pending_count > 0
        ? (ar ? `المحدد: ${list.total} طالبًا و${list.pending_count} رقمًا معلقًا` : `Selected: ${list.total} students and ${list.pending_count} pending numbers`)
        : (ar ? `المحدد: ${count}` : `Selected: ${count}`)}</span>
    </div>}
    {!list.data.length && <p>{ar ? 'لا يوجد طلاب مشتركون في هذه الدورة.' : 'No subscribers in this course.'}</p>}
    <div className="divide-y divide-gray-100">
      {list.data.map(student => <div key={student.id} className="flex items-center gap-3 py-3">
        <input type="checkbox" aria-label={`${ar ? 'تحديد' : 'Select'} ${student.first_name} ${student.last_name}`} disabled={busy || all} checked={all || selected.includes(student.id)} onChange={event => setSelected(event.target.checked ? [...selected, student.id] : selected.filter(id => id !== student.id))} className="h-4 w-4 accent-primary" />
        <div><p className="text-sm font-medium">{student.first_name} {student.last_name}</p><a className="text-xs text-gray-500" dir="ltr" href={`tel:${student.phone}`}>{student.phone || '—'}</a></div>
      </div>)}
    </div>
    {list.last_page > 1 && <div className="flex items-center justify-between text-sm">
      <button type="button" disabled={busy || page === 1} onClick={() => setPage(page - 1)}>{ar ? 'السابق' : 'Previous'}</button>
      <span>{page} / {list.last_page}</span>
      <button type="button" disabled={busy || page === list.last_page} onClick={() => setPage(page + 1)}>{ar ? 'التالي' : 'Next'}</button>
    </div>}
    <button type="button" disabled={busy || !count} onClick={remove} className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-700 disabled:opacity-50">{busy ? (ar ? 'جارٍ إلغاء التفعيل…' : 'Removing access…') : (ar ? 'إلغاء تفعيل المحددين' : 'Remove selected access')}</button>
  </div>;
}
