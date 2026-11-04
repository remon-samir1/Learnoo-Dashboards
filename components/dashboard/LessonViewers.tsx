"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import api from '@/src/lib/api';

export default function LessonViewers({ chapterId }: { chapterId: number }) {
  const ar = useLocale() === 'ar';
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useQuery({
    queryKey: ['lessonViewers', chapterId, page],
    queryFn: () => api.chapters.viewers(chapterId, page),
  });
  if (error) return <p role="alert">{ar ? 'تعذر تحميل مشاهدات الدرس' : 'Could not load lesson views'}</p>;
  if (isLoading || !data) return <p role="status">{ar ? 'جارٍ تحميل المشاهدات…' : 'Loading lesson views…'}</p>;
  return <div className="space-y-3">
    <p className="text-sm text-gray-600">{ar ? 'المشاهدات تخص هذا الدرس فقط، ولكل طالب عدّاد مستقل.' : 'Views are for this lesson only. Each student has an independent counter.'}</p>
    <p className="text-sm">{ar ? 'الحد المسموح لكل طالب' : 'Limit per student'}: {data.max_views || (ar ? 'بلا حد' : 'Unlimited')}</p>
    {!data.data.length && <p>{ar ? 'لا توجد مشاهدات مسجلة لهذا الدرس' : 'No views recorded for this lesson'}</p>}
    {data.data.map(view => <article key={view.id} className="flex flex-wrap items-center justify-between gap-3 border-b py-3">
      <div><p className="font-medium">{view.user.first_name} {view.user.last_name}</p><p className="text-xs text-gray-500">{view.user.email || view.user.student_code}</p></div>
      <div className="text-sm"><p>{ar ? 'المشاهدات المستخدمة' : 'Used views'}: {view.count}</p><p>{ar ? 'المشاهدات المتبقية' : 'Remaining views'}: {view.remaining_views ?? (ar ? 'بلا حد' : 'Unlimited')}</p>{view.created_at && <time className="text-xs text-gray-500">{new Date(view.created_at).toLocaleString(ar ? 'ar' : 'en')}</time>}</div>
    </article>)}
    {data.last_page > 1 && <div className="flex items-center justify-between">
      <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>{ar ? 'السابق' : 'Previous'}</button>
      <span>{page} / {data.last_page}</span>
      <button type="button" disabled={page >= data.last_page} onClick={() => setPage(page + 1)}>{ar ? 'التالي' : 'Next'}</button>
    </div>}
  </div>;
}
