"use client";

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import api, { type GuardianStudent } from '@/src/lib/api';

export default function PlatformGuardians() {
  const ar = useLocale() === 'ar';
  const [students, setStudents] = useState<GuardianStudent[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [recipient, setRecipient] = useState<{ student: string; parent: string } | null>(null);
  const [content, setContent] = useState('');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { api.guardians.list(page).then(result => { setStudents(result.data); setLastPage(result.last_page); }).catch(() => setError(true)); }, [page]);
  return <div className="space-y-6 pb-12">
    <h1 className="text-2xl font-bold">{ar ? 'أولياء الأمور والتواصل' : 'Guardians and communication'}</h1>
    {error && <p role="alert">{ar ? 'تعذر تحميل أولياء الأمور' : 'Could not load guardians'}</p>}
    {!students.length && !error && <p>{ar ? 'لا يوجد أولياء أمور مرتبطون بالطلاب بعد' : 'No guardians linked to students yet'}</p>}
    {students.map(student => <article key={student.id} className="space-y-3 rounded-xl border bg-white p-4"><h2 className="font-bold">{student.first_name} {student.last_name}</h2><details className="rounded-xl bg-gray-50 p-3"><summary className="cursor-pointer font-medium">{ar ? 'بيانات الطالب ودوراته' : 'Student details and courses'}</summary><div className="mt-3 space-y-2 text-sm">
      <p>{ar ? 'رقم الطالب' : 'Student code'}: {student.student_code || '—'}</p>
      <p>{ar ? 'الهاتف' : 'Phone'}: {student.phone ? <a href={`tel:${student.phone}`} className="text-primary underline">{student.phone}</a> : '—'}</p>
      <p>{ar ? 'البريد' : 'Email'}: {student.email || '—'}</p>
      <p>{[student.university?.name, student.faculty?.name, ...(student.centers ?? []).map(center => center.name)].filter(Boolean).join(' / ') || '—'}</p>
      <p>{ar ? 'الدورات' : 'Courses'}: {(student.activated_courses ?? []).map(course => course.title).join('، ') || '—'}</p>
    </div></details>{student.parents.map(parent => <div key={parent.id} className="flex flex-wrap justify-between gap-3"><p>{parent.first_name} {parent.last_name} · {parent.email} {parent.phone && <a href={`tel:${parent.phone}`} className="text-primary underline">{parent.phone}</a>}</p><button className="text-primary underline" onClick={() => { setRecipient({ student: student.id, parent: parent.id }); setContent(''); }}>{ar ? 'إرسال رسالة' : 'Send message'}</button></div>)}</article>)}
    {recipient && <form className="space-y-3 rounded-xl border bg-white p-4" onSubmit={async e => {
      e.preventDefault(); setBusy(true);
      try { await api.guardians.send({ student_id: recipient.student, to_user_id: recipient.parent, content }); toast.success(ar ? 'تم إرسال الرسالة' : 'Message sent'); setRecipient(null); }
      catch { toast.error(ar ? 'تعذر إرسال الرسالة' : 'Could not send message'); } finally { setBusy(false); }
    }}><label className="block">{ar ? 'الرسالة' : 'Message'}<textarea required minLength={10} value={content} onChange={e => setContent(e.target.value)} className="mt-2 w-full rounded-xl border p-3" /></label><button disabled={busy} className="rounded-xl bg-primary px-4 py-2 text-white">{ar ? 'إرسال' : 'Send'}</button><button type="button" className="px-4" onClick={() => setRecipient(null)}>{ar ? 'إلغاء' : 'Cancel'}</button></form>}
    <div className="flex gap-4"><button disabled={page <= 1} onClick={() => setPage(page - 1)}>{ar ? 'السابق' : 'Previous'}</button><span>{page} / {lastPage}</span><button disabled={page >= lastPage} onClick={() => setPage(page + 1)}>{ar ? 'التالي' : 'Next'}</button></div>
  </div>;
}
