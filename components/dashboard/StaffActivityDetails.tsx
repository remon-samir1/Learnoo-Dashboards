'use client';

import { useLocale } from 'next-intl';
import type { StaffActivity, StaffActivityRef } from '@/src/lib/api';
import {
  auditFieldChanged,
  auditFieldKeys,
  auditFieldLabel,
  auditFieldValue,
} from '@/src/lib/staff-activity-details';

/**
 * Everything the activity endpoint recorded for one entry.
 *
 * The snapshot table used to hold a fixed list of seven fields and, on an
 * update, only the ones that differed — so an entry whose change fell outside
 * that list showed its title and an empty table. It reads the keys out of the
 * payload now, marks the ones that moved, and the lecture and lesson the
 * endpoint names are rendered too instead of being dropped.
 */
export default function StaffActivityDetails({ details }: { details: StaffActivity['details'] }) {
  const ar = useLocale() === 'ar';
  if (!details) return null;

  const { course, chapter, lecture, before, after, view_history = [] } = details;
  const keys = auditFieldKeys(before, after);
  const views = view_history.reduce((sum, view) => sum + Number(view.count || 0), 0);

  const place: [StaffActivityRef | undefined, string][] = [
    [lecture, ar ? 'المحاضرة' : 'Lecture'],
    [chapter, ar ? 'الدرس' : 'Lesson'],
  ];

  return <div className="mt-2 space-y-2 text-sm">
    {course && <div className="break-words rounded-lg bg-slate-50 p-3">
      <p className="font-semibold">{ar ? 'الدورة' : 'Course'}: {course.title || (ar ? 'تفاصيل الدورة غير متاحة' : 'Course details unavailable')} <bdi>#{course.id}</bdi></p>
      {course.category_path.length > 0 && <p className="mt-1 text-gray-600">{ar ? 'المسار الدراسي' : 'Academic path'}: {course.category_path.join(' / ')}</p>}
      {details.course_context_current && course.title && <p className="mt-1 text-xs text-gray-500">{ar ? 'بيانات الدورة الحالية؛ لم تُحفظ تفاصيلها وقت العملية القديمة.' : 'Current course details; no snapshot was saved for this older activity.'}</p>}
    </div>}

    {place.some(([ref]) => ref) && <div className="break-words rounded-lg bg-slate-50 p-3">
      {place.map(([ref, label]) => ref && <p key={label} className="first:mt-0 mt-1">
        <span className="font-semibold">{label}:</span> {ref.title || (ar ? 'بدون عنوان' : 'Untitled')} <bdi>#{ref.id}</bdi>
      </p>)}
    </div>}

    {before && <div className="break-words rounded-lg bg-slate-50 p-3">
      <p className="font-bold">
        {after ? (ar ? 'تعديل المحتوى' : 'Content updated') : (ar ? 'حذف المحتوى' : 'Content deleted')}: {before.title} <bdi>#{before.id}</bdi>
      </p>
      {after && !keys.some(key => auditFieldChanged(key, before, after)) &&
        <p className="mt-1 text-xs text-gray-500">{ar ? 'لم تتغير أي من القيم المسجّلة في هذه العملية.' : 'None of the recorded values changed in this action.'}</p>}

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-start">
          <thead><tr>
            <th className="p-2 text-start">{ar ? 'البيان' : 'Field'}</th>
            <th className="p-2 text-start">{ar ? 'قبل' : 'Before'}</th>
            {after && <th className="p-2 text-start">{ar ? 'بعد' : 'After'}</th>}
          </tr></thead>
          <tbody>{keys.map(key => {
            const changed = auditFieldChanged(key, before, after);
            return <tr key={key} className={changed ? 'bg-amber-50' : undefined}>
              <th className="p-2 text-start font-normal">{auditFieldLabel(key, ar ? 'ar' : 'en')}{changed && <span className="ms-1 text-amber-700" aria-hidden>•</span>}</th>
              <td className="break-all p-2">{auditFieldValue(key, before?.[key], ar ? 'ar' : 'en')}</td>
              {after && <td className="break-all p-2 font-medium">{auditFieldValue(key, after[key], ar ? 'ar' : 'en')}</td>}
            </tr>;
          })}</tbody>
        </table>
      </div>
    </div>}

    {view_history.length > 0 && <details className="break-words rounded-lg bg-slate-50 p-3">
      <summary className="cursor-pointer font-semibold">
        {before && !after ? (ar ? 'المشاهدات قبل الحذف' : 'Views before deletion') : (ar ? 'سجل المشاهدات' : 'View history')}
        {' · '}{ar ? 'المشاهدات' : 'Views'}: {views} · {ar ? 'الطلاب' : 'Students'}: {view_history.length}
      </summary>
      <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
        {view_history.map(view => <li key={view.student_id} className="flex justify-between gap-3">
          <span>{view.name || view.student_id}</span><span className="shrink-0 text-gray-600">{view.count}</span>
        </li>)}
      </ul>
    </details>}
  </div>;
}
