'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { coursesApi } from '@/src/lib/api';
import { useCurrentUser } from '@/src/hooks/useAuth';
import type { Course } from '@/src/types';

export default function CourseApprovalPanel({ course, onReviewed }: { course: Course; onReviewed: () => unknown }) {
  const t = useTranslations('courses.review');
  const { role } = useCurrentUser();
  const [reason, setReason] = useState(course.attributes.reason || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const canReview = role === 'Admin' || role === 'Super Admin';

  async function review(approval: 0 | 1 | 2) {
    setBusy(true);
    setError('');
    try {
      await coursesApi.review(Number(course.id), approval, approval === 2 ? reason : undefined);
      await onReviewed();
      if (approval !== 2) setReason('');
    } catch (error) {
      setError(error instanceof Error ? error.message : t('error'));
    } finally { setBusy(false); }
  }

  return <section id="course-review" className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
    <h2 className="font-bold">{t('title')}</h2>
    <p className="text-sm font-medium">{t(String(course.attributes.approval))}</p>
    <p className="text-sm text-slate-600">{t(course.attributes.approval === 1 ? 'approvedHelp' : 'hiddenHelp')}</p>
    {course.attributes.approval === 2 && course.attributes.reason && <p className="text-sm text-red-700">{course.attributes.reason}</p>}
    {canReview && <div className="space-y-3">
      <label className="block text-sm">{t('reason')}
        <textarea value={reason} onChange={event => setReason(event.target.value)} maxLength={1000} disabled={busy} className="mt-1 block w-full rounded-lg border p-2" />
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy || course.attributes.approval === 1} onClick={() => review(1)} className="rounded-lg bg-green-700 px-4 py-2 text-sm text-white disabled:opacity-50">{t('approve')}</button>
        <button type="button" disabled={busy || course.attributes.approval === 2} onClick={() => review(2)} className="rounded-lg bg-red-700 px-4 py-2 text-sm text-white disabled:opacity-50">{t('reject')}</button>
        <button type="button" disabled={busy || course.attributes.approval === 0} onClick={() => review(0)} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50">{t('pending')}</button>
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </div>}
  </section>;
}
