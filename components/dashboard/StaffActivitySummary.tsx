'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import api from '@/src/lib/api';

export default function StaffActivitySummary() {
  const ar = useLocale() === 'ar';
  const { data, isLoading, error } = useQuery({ queryKey: ['ownerActivity', 1], queryFn: () => api.ownerOperations.activity(1) });
  return <section className="rounded-xl border bg-white p-6">
    <h2 className="text-lg font-bold">{ar ? 'نشاط الفريق — آخر ٩٠ يومًا' : 'Staff activity — past 90 days'}</h2>
    {isLoading ? <p>{ar ? 'جارٍ التحميل…' : 'Loading…'}</p> : error ? <p role="alert">{ar ? 'تعذر تحميل النشاط' : 'Could not load activity'}</p> : !data?.data.length ? <p>{ar ? 'لا توجد أنشطة مسجلة' : 'No recorded activity'}</p> : <div className="mt-4 max-h-[480px] space-y-4 overflow-y-auto">{data.data.map(item => <article key={item.id} className="border-b pb-3"><p>{item.first_name} {item.last_name}</p><p dir="ltr" className="break-words text-sm">{item.action}</p><time className="text-xs text-gray-500">{new Date(item.created_at).toLocaleString(ar ? 'ar' : 'en')}</time></article>)}</div>}
    <Link href="/activity" className="mt-4 inline-block text-primary underline">{ar ? 'عرض سجل النشاط كاملًا' : 'View full activity history'}</Link>
  </section>;
}
