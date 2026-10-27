'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import { useCurrentUser } from '@/src/hooks/useAuth';
import { ownerOperationsApi, type PendingActivationFilters } from '@/src/lib/api';
import { CourseTreeSelect } from '@/src/components/admin/CourseTreeSelect';

export default function PendingActivationsPage() {
  const ar = useLocale() === 'ar';
  const { role } = useCurrentUser();
  const [phone, setPhone] = useState('');
  const [itemType, setItemType] = useState('');
  const [course, setCourse] = useState('');
  const [filters, setFilters] = useState<PendingActivationFilters>({});
  const [page, setPage] = useState(1);
  const { data: result, isPending: loading, isError: error, refetch } = useQuery({
    queryKey: ['owner-pending-activations', page, filters],
    queryFn: () => ownerOperationsApi.pendingActivations(page, filters),
    enabled: role === 'Super Admin',
  });
  const types = ar ? { course: 'مادة', chapter: 'درس', category: 'قسم', library: 'مكتبة', quiz: 'امتحان' } : { course: 'Course', chapter: 'Lesson', category: 'Department', library: 'Library', quiz: 'Exam' };

  if (role !== 'Super Admin') return <p>{ar ? 'هذه الصفحة متاحة للأونر فقط.' : 'This page is available to the Owner only.'}</p>;

  return <main className="space-y-6 p-6">
    <div><h1 className="text-2xl font-bold">{ar ? 'أرقام التفعيل المسبق المعلقة' : 'Pending pre-activation numbers'}</h1>
      <p className="mt-2 text-sm text-gray-600">{ar ? 'هذه الأرقام تنتظر تفعيلها عند تسجيل الطالب أو دخوله. ليست عدد الطلاب المسجلين.' : 'These numbers await activation when the student registers or signs in. They are separate from registered student totals.'}</p></div>
    <form className="space-y-4 rounded-2xl border bg-white p-5" onSubmit={event => {
      event.preventDefault(); setPage(1);
      setFilters({ phone: phone.trim() || undefined, item_type: itemType || undefined, course_id: course ? Number(course) : undefined });
    }}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">{ar ? 'رقم الهاتف' : 'Phone number'}<input type="search" dir="ltr" maxLength={40} value={phone} onChange={event => setPhone(event.target.value)} className="mt-2 block w-full rounded-xl border p-3 text-base" /></label>
        <label className="text-sm">{ar ? 'نوع المحتوى' : 'Content type'}<select value={itemType} onChange={event => { setItemType(event.target.value); if (event.target.value !== 'course') setCourse(''); }} className="mt-2 block w-full rounded-xl border bg-white p-3">
          <option value="">{ar ? 'كل الأنواع' : 'All types'}</option>{Object.entries(types).map(([value, name]) => <option key={value} value={value}>{name}</option>)}
        </select></label>
      </div>
      {(!itemType || itemType === 'course') && <CourseTreeSelect searchCoursesDirectly value={course} onChange={value => { setCourse(value); if (value) setItemType('course'); }} label={ar ? 'المادة (اختياري)' : 'Course (optional)'} searchPlaceholder={ar ? 'ابحث باسم المادة أو الفرقة' : 'Search by course or year'} />}
      <div className="flex flex-wrap gap-3"><button type="submit" disabled={loading} className="rounded-xl bg-primary px-5 py-3 text-sm text-white disabled:opacity-50">{ar ? 'بحث' : 'Search'}</button>
        <button type="button" onClick={() => { setPhone(''); setItemType(''); setCourse(''); setFilters({}); setPage(1); }} className="rounded-xl border px-4 py-3 text-sm">{ar ? 'مسح الفلاتر' : 'Reset filters'}</button></div>
    </form>
    {loading ? <p role="status">{ar ? 'جارٍ التحميل…' : 'Loading…'}</p> : error ? <div role="alert"><p>{ar ? 'تعذر تحميل الأرقام.' : 'Could not load pending numbers.'}</p><button type="button" onClick={() => void refetch()} className="mt-2 text-primary underline">{ar ? 'إعادة المحاولة' : 'Retry'}</button></div> : result && <>
      <p className="text-sm text-gray-600">{ar ? `التفعيلات المعلقة: ${result.total} (قد يتكرر الرقم لمواد مختلفة)` : `Pending activations: ${result.total} (one number can have different courses)`}</p>
      {!result.data.length && <p>{ar ? 'لا توجد أرقام معلقة مطابقة.' : 'No matching pending numbers.'}</p>}
      <div className="divide-y rounded-2xl border bg-white">{result.data.map(row => <article key={row.id} className="grid gap-3 p-4 sm:grid-cols-[1fr_2fr_1fr]">
        <p dir="ltr" className="text-start font-medium">{row.phone}</p>
        <div className="min-w-0"><p className="break-words">{row.title || (ar ? 'المحتوى لم يعد متاحًا' : 'Content no longer available')}</p><p className="mt-1 break-words text-xs text-gray-500">{types[row.item_type as keyof typeof types]}{row.category_path.length ? ` · ${row.category_path.join(' / ')}` : ''}</p></div>
        <p className="text-sm text-gray-500">{row.created_at ? new Date(row.created_at).toLocaleDateString(ar ? 'ar-EG' : 'en-GB') : '—'}</p>
      </article>)}</div>
      {result.last_page > 1 && <div className="flex items-center justify-between text-sm"><button disabled={page <= 1} onClick={() => setPage(value => value - 1)} className="rounded-xl border px-4 py-2 disabled:opacity-50">{ar ? 'السابق' : 'Previous'}</button><span>{page} / {result.last_page}</span><button disabled={page >= result.last_page} onClick={() => setPage(value => value + 1)} className="rounded-xl border px-4 py-2 disabled:opacity-50">{ar ? 'التالي' : 'Next'}</button></div>}
    </>}
  </main>;
}
