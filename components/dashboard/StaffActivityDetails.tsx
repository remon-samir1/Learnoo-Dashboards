'use client';

import { useLocale } from 'next-intl';
import type { ContentAuditSnapshot, StaffActivity } from '@/src/lib/api';

export default function StaffActivityDetails({ details }: { details: StaffActivity['details'] }) {
  const ar = useLocale() === 'ar';
  if (!details?.before) return null;
  const fields: [keyof ContentAuditSnapshot, string][] = [
    ['title', ar ? 'العنوان' : 'Title'], ['video', ar ? 'ملف الفيديو' : 'Video file'],
    ['lecture_id', ar ? 'رقم المحاضرة' : 'Lecture ID'], ['course_id', ar ? 'رقم الدورة' : 'Course ID'],
    ['status', ar ? 'حالة النشر' : 'Publish status'],
    ['max_views', ar ? 'حد المشاهدات' : 'View limit'], ['view_by_minute', ar ? 'ثانية احتساب المشاهدة' : 'View threshold (seconds)'],
  ];
  return <details className="mt-2 rounded-lg bg-slate-50 p-3 text-sm">
    <summary className="cursor-pointer font-bold">{details.after ? (ar ? 'تعديل المحتوى' : 'Content updated') : (ar ? 'حذف المحتوى' : 'Content deleted')}: {details.before.title} #{details.before.id}</summary>
    <table className="mt-3 w-full text-start"><thead><tr><th>{ar ? 'البيان' : 'Field'}</th><th>{ar ? 'قبل' : 'Before'}</th><th>{ar ? 'بعد' : 'After'}</th></tr></thead>
      <tbody>{fields.filter(([key]) => !details.after || details.before[key] !== details.after[key]).map(([key, label]) => <tr key={key}>
        <th className="p-2">{label}</th>{[details.before, details.after].map((snapshot, i) => <td key={i} className="break-all p-2">{key === 'video' ? String(snapshot?.video ?? '—').split('/').pop() : String(snapshot?.[key] ?? '—')}</td>)}
      </tr>)}</tbody></table>
    <p className="mt-3">{ar ? 'المشاهدات قبل العملية' : 'Views before this action'}: {details.view_history.reduce((sum, view) => sum + Number(view.count), 0)} · {ar ? 'الطلاب' : 'Students'}: {details.view_history.length}</p>
    <ul className="mt-2 max-h-48 overflow-y-auto">{details.view_history.map(view => <li key={view.student_id}>{view.name || view.student_id}: {view.count}</li>)}</ul>
  </details>;
}
