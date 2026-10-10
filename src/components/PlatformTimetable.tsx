"use client";

import { useEffect, useState, type FormEvent } from 'react';
import { useLocale } from 'next-intl';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import api, { type TimetableEntry } from '@/src/lib/api';
import type { Attachment } from '@/src/types';
import { useCourses } from '@/src/hooks/useCourses';
import { CourseTreeSelect } from '@/src/components/admin/CourseTreeSelect';

const PdfPreviewModal = dynamic(() => import('@/components/student/PdfPreviewModal'), { ssr: false });

export default function PlatformTimetable({ canUpload = false }: { canUpload?: boolean }) {
  const ar = useLocale() === 'ar';
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<Attachment | null>(null);
  const { data: courses } = useCourses({ per_page: 500 });
  const refresh = () => api.timetable.list().then(result => { setEntries(result.entries); setError(false); }).catch(() => setError(true)).finally(() => setLoading(false));
  useEffect(() => { void refresh(); }, []);
  const visible = entries.filter(entry => entry.kind === 'course' && `${entry.title} ${entry.documents?.map(document => document.attributes.name).join(' ') ?? ''}`.toLowerCase().includes(search.trim().toLowerCase()));
  const lastPage = Math.max(1, Math.ceil(visible.length / 10));
  const currentPage = Math.min(page, lastPage);

  const upload = async (event: FormEvent<HTMLFormElement>, courseIds: string[], attachmentId?: string) => {
    event.preventDefault();
    if (!courseIds.length) { toast.error(ar ? 'اختر دورة واحدة على الأقل' : 'Select at least one course'); return; }
    const form = event.currentTarget;
    const files = new FormData(form).getAll('file') as File[];
    setBusy(true);
    try {
      for (const courseId of courseIds) {
        for (const file of files) {
          const data = new FormData(); data.set('kind', 'course'); data.set('file', file);
          if (attachmentId) data.set('attachment_id', attachmentId);
          await api.timetable.upload(courseId, data);
        }
      }
      form.reset();
      toast.success(ar ? 'تم حفظ ملفات الجدول' : 'Schedule files saved');
    } catch { toast.error(ar ? 'تعذر حفظ جميع الملفات؛ راجع الملفات الظاهرة قبل إعادة المحاولة' : 'Some files could not be saved; check the list before retrying'); }
    finally { await refresh(); setBusy(false); }
  };

  return <div className="space-y-6 pb-12">
    <h1 className="text-2xl font-bold">{ar ? 'جداول الدورات' : 'Course schedules'}</h1>
    {canUpload && <form className="space-y-3 rounded-xl border bg-white p-4" onSubmit={event => upload(event, selectedCourses)}>
      <CourseTreeSelect label={ar ? 'الدورات' : 'Courses'} multiple value={selectedCourses} onMultiChange={setSelectedCourses} coursesData={courses ?? []} required />
      <label className="block text-sm">{ar ? 'ملفات الجدول (PDF أو صور)' : 'Schedule files (PDF or images)'}<input name="file" type="file" multiple accept="application/pdf,image/jpeg,image/png,image/webp" required className="mt-2 max-w-full" /></label>
      <button disabled={busy} className="rounded-xl bg-primary px-4 py-3 text-white disabled:opacity-50">{ar ? 'إضافة ملفات الجدول' : 'Add schedule files'}</button>
    </form>}
    <input type="search" aria-label={ar ? 'البحث في الجداول' : 'Search schedules'} placeholder={ar ? 'ابحث باسم الدورة أو الملف' : 'Search by course or file name'} value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} className="w-full rounded-xl border bg-white p-3" />
    {error ? <p role="alert">{ar ? 'تعذر تحميل الجداول' : 'Could not load schedules'}</p> : loading ? <p>{ar ? 'جارٍ التحميل…' : 'Loading…'}</p> : <>
      {visible.slice((currentPage - 1) * 10, currentPage * 10).map(entry => <article key={entry.id} className="space-y-3 rounded-xl border bg-white p-4">
        <h2 className="font-bold">{entry.title}</h2>
        {entry.start && <p className="text-sm">{new Date(entry.start).toLocaleString(ar ? 'ar' : 'en')}{entry.end && ` — ${new Date(entry.end).toLocaleString(ar ? 'ar' : 'en')}`}</p>}
        {entry.documents?.map(document => <div key={document.id} className="flex flex-wrap items-center gap-3 rounded-xl border p-3">
          <button className="text-primary underline" onClick={() => setPreview(document)}>{document.attributes.name}</button>
          {canUpload && <form className="flex flex-wrap items-center gap-2" onSubmit={event => upload(event, [String(entry.id)], document.id)}>
            <input name="file" type="file" required aria-label={ar ? `استبدال ${document.attributes.name}` : `Replace ${document.attributes.name}`} accept="application/pdf,image/jpeg,image/png,image/webp" className="max-w-full text-sm" />
            <button disabled={busy} className="rounded-xl border p-2 text-sm disabled:opacity-50">{ar ? 'استبدال الملف' : 'Replace file'}</button>
          </form>}
        </div>)}
      </article>)}
      {!visible.length && <p>{ar ? 'لا توجد جداول مطابقة للبحث' : 'No matching schedules'}</p>}
      {lastPage > 1 && <nav aria-label={ar ? 'صفحات الجداول' : 'Schedule pages'} className="flex items-center justify-center gap-4">
        <button disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)} className="rounded-xl border p-3 disabled:opacity-50">{ar ? 'السابق' : 'Previous'}</button>
        <span>{currentPage} / {lastPage}</span>
        <button disabled={currentPage >= lastPage} onClick={() => setPage(currentPage + 1)} className="rounded-xl border p-3 disabled:opacity-50">{ar ? 'التالي' : 'Next'}</button>
      </nav>}
    </>}
    {preview && preview.attributes.extension.toLowerCase() !== 'pdf' ? <div role="dialog" aria-label={preview.attributes.name} aria-modal="true" className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/80 p-6"><button onClick={() => setPreview(null)} className="rounded-xl bg-white p-3">{ar ? 'إغلاق' : 'Close'}</button><img src={preview.attributes.path} alt={preview.attributes.name} className="max-h-[80vh] max-w-full rounded-xl object-contain" /></div> : <PdfPreviewModal open={Boolean(preview)} onClose={() => setPreview(null)} pdfUrl={preview?.attributes.path ?? null} title={preview?.attributes.name ?? ''} />}
  </div>;
}
