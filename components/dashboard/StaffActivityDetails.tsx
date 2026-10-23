'use client';

import { useLocale } from 'next-intl';
import type { ContentAuditSnapshot, StaffActivity } from '@/src/lib/api';

export default function StaffActivityDetails({ details }: { details: StaffActivity['details'] }) {
  const ar = useLocale() === 'ar';
  if (!details) return null;
  const { course, before, after, view_history = [] } = details;
  const fields: [keyof ContentAuditSnapshot, string][] = [
    ['title', ar ? 'العنوان' : 'Title'], ['video', ar ? 'ملف الفيديو' : 'Video file'],
    ['lecture_id', ar ? 'رقم المحاضرة' : 'Lecture ID'], ['course_id', ar ? 'رقم الدورة' : 'Course ID'],
    ['status', ar ? 'حالة النشر' : 'Publish status'],
    ['max_views', ar ? 'حد المشاهدات' : 'View limit'], ['view_by_minute', ar ? 'ثانية احتساب المشاهدة' : 'View threshold (seconds)'],
  ];
  return <>
    {course && <div className="mt-2 break-words rounded-lg bg-slate-50 p-3 text-sm">
      <p className="font-semibold">{ar ? 'الدورة' : 'Course'}: {course.title || (ar ? 'تفاصيل الدورة غير متاحة' : 'Course details unavailable')} <bdi>#{course.id}</bdi></p>
      {course.category_path.length > 0 && <p className="mt-1 text-gray-600">{ar ? 'المسار الدراسي' : 'Academic path'}: {course.category_path.join(' / ')}</p>}
      {details.course_context_current && course.title && <p className="mt-1 text-xs text-gray-500">{ar ? 'بيانات الدورة الحالية؛ لم تُحفظ تفاصيلها وقت العملية القديمة.' : 'Current course details; no snapshot was saved for this older activity.'}</p>}
    </div>}
    {before && <details className="mt-2 rounded-lg bg-slate-50 p-3 text-sm">
    <summary className="cursor-pointer font-bold">{after ? (ar ? 'تعديل المحتوى' : 'Content updated') : (ar ? 'حذف المحتوى' : 'Content deleted')}: {before.title} #{before.id}</summary>
    <table className="mt-3 w-full text-start"><thead><tr><th>{ar ? 'البيان' : 'Field'}</th><th>{ar ? 'قبل' : 'Before'}</th><th>{ar ? 'بعد' : 'After'}</th></tr></thead>
      <tbody>{fields.filter(([key]) => !after || before[key] !== after[key]).map(([key, label]) => <tr key={key}>
        <th className="p-2">{label}</th>{[before, after].map((snapshot, i) => <td key={i} className="break-all p-2">{key === 'video' ? String(snapshot?.video ?? '—').split('/').pop() : String(snapshot?.[key] ?? '—')}</td>)}
      </tr>)}</tbody></table>
    <p className="mt-3">{ar ? 'المشاهدات قبل العملية' : 'Views before this action'}: {view_history.reduce((sum, view) => sum + Number(view.count), 0)} · {ar ? 'الطلاب' : 'Students'}: {view_history.length}</p>
    <ul className="mt-2 max-h-48 overflow-y-auto">{view_history.map(view => <li key={view.student_id}>{view.name || view.student_id}: {view.count}</li>)}</ul>
  </details>}
  </>;
}
