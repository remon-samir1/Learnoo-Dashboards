"use client";

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import api, { type DownloadRecord } from '@/src/lib/api';
import type { Attachment } from '@/src/types';

export default function PlatformDownloads() {
  const ar = useLocale() === 'ar';
  const [files, setFiles] = useState<Attachment[]>([]);
  const [records, setRecords] = useState<DownloadRecord[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    Promise.all([api.downloads.list(), api.downloads.history(page)]).then(([list, history]) => {
      if (!active) return; setFiles(list.data); setRecords(history.data); setLastPage(history.last_page); setError(false);
    }).catch(() => active && setError(true)).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [page]);
  return <div className="space-y-6 pb-12">
    <h1 className="text-2xl font-bold">{ar ? 'التحميلات' : 'Downloads'}</h1>
    {error ? <p role="alert">{ar ? 'تعذر تحميل الملفات' : 'Could not load files'}</p> : loading ? <p>{ar ? 'جارٍ التحميل…' : 'Loading…'}</p> : <>
      <h2 className="text-lg font-bold">{ar ? 'الملفات المتاحة للتحميل' : 'Available files'}</h2>
      {!files.length && <p>{ar ? 'لا توجد ملفات متاحة للتحميل' : 'No files available for download'}</p>}
      {files.map(file => <div key={file.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-white p-4"><span>{file.attributes.name}</span><button disabled={busy === String(file.id)} className="text-primary underline disabled:opacity-50" onClick={async () => {
        setBusy(String(file.id));
        try { await api.downloads.download(file.id, file.attributes.name); const history = await api.downloads.history(page); setRecords(history.data); }
        catch { toast.error(ar ? 'تعذر تحميل الملف' : 'Download failed'); }
        finally { setBusy(null); }
      }}>{ar ? 'تحميل' : 'Download'}</button></div>)}
      <h2 className="text-lg font-bold">{ar ? 'سجل التحميلات' : 'Download history'}</h2>
      {!records.length && <p>{ar ? 'لا توجد تحميلات بعد' : 'No downloads yet'}</p>}
      {records.map(record => <article key={record.id} className="rounded-xl border bg-white p-4"><p>{record.file_name}</p><p className="text-sm text-gray-500">{record.first_name} {record.last_name} · {new Date(record.created_at).toLocaleString(ar ? 'ar' : 'en')}</p></article>)}
      <div className="flex gap-4"><button disabled={page <= 1} onClick={() => setPage(page - 1)}>{ar ? 'السابق' : 'Previous'}</button><span>{page} / {lastPage}</span><button disabled={page >= lastPage} onClick={() => setPage(page + 1)}>{ar ? 'التالي' : 'Next'}</button></div>
    </>}
  </div>;
}
