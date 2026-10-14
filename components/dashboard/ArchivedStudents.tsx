'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { archivedStudentsApi } from '@/src/lib/api';
import { useCurrentUser } from '@/src/hooks/useAuth';

export default function ArchivedStudents({ onRecovered }: { onRecovered: () => Promise<unknown> }) {
  const ar = useLocale() === 'ar';
  const { role } = useCurrentUser();
  const allowed = role === 'Admin' || role === 'Super Admin';
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState('');
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['archivedStudents', page, search], enabled: allowed, queryFn: () => archivedStudentsApi.list(page, search) });
  if (!allowed) return null;
  async function recover(id: string, mode: 'restore' | 'new') {
    const message = mode === 'restore'
      ? (ar ? 'استرجاع الحساب بتفعيلاته ومشاهداته السابقة وإلغاء جلساته القديمة؟' : 'Restore this account with its previous access and views, revoking old sessions?')
      : (ar ? 'السماح بتسجيل حساب جديد بنفس الرقم؟ سيبقى الحساب القديم مؤرشفًا ولن تنتقل تفعيلاته أو مشاهداته للحساب الجديد.' : 'Allow a new account with this number? The old account stays archived. Its access and views will not transfer.');
    if (!window.confirm(message)) return;
    setBusy(id);
    try {
      await archivedStudentsApi.recover(id, mode);
      await refetch();
      await onRecovered();
      toast.success(mode === 'restore' ? (ar ? 'تم استرجاع الحساب' : 'Account restored') : (ar ? 'يمكن للطالب الآن التسجيل بنفس الرقم كحساب جديد' : 'The student can now register a new account with this number'));
    } catch { toast.error(ar ? 'تعذر تنفيذ الطلب' : 'Could not complete the request'); }
    finally { setBusy(''); }
  }
  return <section className="mt-8 space-y-4 rounded-xl border bg-white p-5">
    <h2 className="text-xl font-bold">{ar ? 'حسابات الطلاب المحذوفة' : 'Deleted student accounts'}</h2>
    <p className="text-sm text-gray-600">{ar ? 'اختر استرجاع الحساب القديم أو السماح بتسجيل جديد بدون نقل التفعيلات السابقة.' : 'Restore the previous account, or allow fresh registration without transferring previous access.'}</p>
    <input aria-label={ar ? 'ابحث عن حساب محذوف' : 'Search deleted accounts'} value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder={ar ? 'الاسم أو رقم الهاتف' : 'Name or phone'} className="w-full rounded-lg border p-3" />
    {isLoading ? <p>{ar ? 'جارٍ التحميل…' : 'Loading…'}</p> : error ? <p role="alert">{ar ? 'تعذر تحميل الحسابات' : 'Could not load accounts'}</p> : !data?.data.length ? <p>{ar ? 'لا توجد حسابات محذوفة مطابقة' : 'No matching deleted accounts'}</p> : data.data.map(student => <article key={student.id} className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
      <p>{student.first_name} {student.last_name} · <span dir="ltr">{student.phone}</span></p>
      <div className="flex flex-wrap gap-4"><button disabled={!!busy} className="text-primary underline" onClick={() => recover(student.id, 'restore')}>{ar ? 'استرجاع الحساب القديم' : 'Restore previous account'}</button>
        <button disabled={!!busy} className="text-amber-800 underline" onClick={() => recover(student.id, 'new')}>{ar ? 'السماح بحساب جديد' : 'Allow new account'}</button></div>
    </article>)}
    {data && data.last_page > 1 && <div className="flex gap-4"><button disabled={page === 1} onClick={() => setPage(page - 1)}>{ar ? 'السابق' : 'Previous'}</button><span>{page} / {data.last_page}</span><button disabled={page === data.last_page} onClick={() => setPage(page + 1)}>{ar ? 'التالي' : 'Next'}</button></div>}
  </section>;
}
