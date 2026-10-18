"use client";

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import StaffActivityDetails from '@/components/dashboard/StaffActivityDetails';
import { formatStaffActivity } from '@/src/lib/staff-activity';
import { toast } from 'sonner';
import api, { type StaffActivity, type DeviceTransfer, type DeviceDetails } from '@/src/lib/api';
import { useCurrentUser } from '@/src/hooks/useAuth';

export default function OwnerActivityPage() {
  const ar = useLocale() === 'ar';
  const { role } = useCurrentUser();
  const [activity, setActivity] = useState<StaffActivity[]>([]);
  const [devices, setDevices] = useState<DeviceTransfer[]>([]);
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [lastPage, setLastPage] = useState(1);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => {
    if (role !== 'Super Admin') return;
    api.ownerOperations.activity(page, { from: from || undefined, to: to || undefined }).then(history => {
      setActivity(history.data); setLastPage(history.last_page); setError(false);
    }).catch(() => setError(true));
  }, [role, page, from, to]);
  useEffect(() => {
    if (role !== 'Super Admin' && role !== 'Admin') return;
    let active = true;
    const load = () => api.ownerOperations.devices().then(transfers => { if (active) setDevices(transfers.data); }).catch(() => { if (active) setError(true); });
    load();
    const timer = window.setInterval(load, 30000);
    return () => { active = false; window.clearInterval(timer); };
  }, [role]);
  async function resolveDevice(id: string, action: 'approve' | 'cancel') {
    if (action === 'cancel' && !window.confirm(ar ? 'إلغاء طلب نقل الجهاز؟ سيبقى الجهاز المعتمد والجلسات الحالية كما هما.' : 'Cancel this transfer request? The approved device and current sessions will be kept.')) return;
    setBusy(id);
    try {
      await api.ownerOperations[action](id);
      setDevices(prev => prev.filter(device => device.id !== id));
      toast.success(action === 'approve'
        ? (ar ? 'تم اعتماد الجهاز الجديد وإلغاء الجلسات السابقة' : 'New device approved. Previous sessions revoked.')
        : (ar ? 'تم إلغاء طلب النقل. الجهاز المعتمد والجلسات الحالية كما هما.' : 'Transfer request cancelled. The approved device and current sessions are unchanged.'));
    } catch {
      toast.error(ar ? 'تعذر تحديث طلب نقل الجهاز' : 'Could not update the transfer request');
    } finally { setBusy(null); }
  }
  if (role !== 'Super Admin' && role !== 'Admin') return <p>{ar ? 'هذه الصفحة متاحة للمالك والأدمن فقط' : 'This page is available to the Owner and Admin only'}</p>;
  return <div className="space-y-6 pb-12">
    <h1 className="text-2xl font-bold">{role === 'Admin' ? (ar ? 'اعتماد الأجهزة' : 'Device approvals') : (ar ? 'نشاط الفريق واعتماد الأجهزة' : 'Staff activity and device approvals')}</h1>
    {error && <p role="alert">{ar ? 'تعذر تحميل البيانات' : 'Could not load data'}</p>}
    <h2 className="text-lg font-bold">{ar ? 'طلبات نقل الجهاز' : 'Device transfer requests'}</h2>
    {!devices.length && <p>{ar ? 'لا توجد طلبات معلقة' : 'No pending requests'}</p>}
    {devices.map(device => <article key={device.id} id={`device-${device.id}`} className="flex scroll-mt-24 flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4"><div className="space-y-2"><p className="font-bold">{device.first_name} {device.last_name} · {device.phone}</p>
      {([['current_device', ar ? 'الجهاز الحالي' : 'Current device'], ['requested_device', ar ? 'الجهاز المطلوب' : 'Requested device']] as const).map(([key, label]) => {
        const info: DeviceDetails | null = device[key];
        return <div key={key} className="text-sm"><p>{label}: {info ? `${info.device} · ${info.browser} · ${info.identifier}` : (ar ? 'التفاصيل غير متاحة؛ تظهر بعد تسجيل الدخول من الجهاز' : 'Details unavailable; captured on the next sign-in from this device')}</p>
          {info && <p className="text-xs text-gray-500"><span dir="ltr">IP: {info.ip}</span> · {new Date(info.at).toLocaleString(ar ? 'ar' : 'en')}</p>}</div>;
      })}
    </div><div className="flex flex-wrap gap-3">
      <button type="button" disabled={busy === device.id} className="text-primary underline disabled:opacity-50" onClick={() => resolveDevice(device.id, 'approve')}>{ar ? 'اعتماد الجهاز الجديد' : 'Approve new device'}</button>
      <button type="button" disabled={busy === device.id} className="text-red-600 underline disabled:opacity-50" onClick={() => resolveDevice(device.id, 'cancel')}>{ar ? 'إلغاء الطلب' : 'Cancel request'}</button>
    </div></article>)}
    {role === 'Super Admin' && <>
    <h2 className="text-lg font-bold">{ar ? 'نشاط آخر ٩٠ يومًا' : 'Activity over the past 90 days'}</h2>
    <div className="flex flex-wrap items-end gap-3">
      <button className="rounded-xl border p-3" onClick={() => { const today = new Date().toLocaleDateString('en-CA'); setFrom(today); setTo(today); setPage(1); }}>{ar ? 'اليوم' : 'Today'}</button>
      <button className="rounded-xl border p-3" onClick={() => { const today = new Date(); const start = new Date(); start.setDate(start.getDate() - 6); setFrom(start.toLocaleDateString('en-CA')); setTo(today.toLocaleDateString('en-CA')); setPage(1); }}>{ar ? 'آخر ٧ أيام' : 'Last 7 days'}</button>
      <button className="rounded-xl border p-3" onClick={() => { setFrom(''); setTo(''); setPage(1); }}>{ar ? 'آخر ٩٠ يومًا' : 'Last 90 days'}</button>
      <label>{ar ? 'من' : 'From'}<input type="date" value={from} max={to || undefined} onChange={event => { setFrom(event.target.value); setPage(1); }} className="block rounded-xl border p-3" /></label>
      <label>{ar ? 'إلى' : 'To'}<input type="date" value={to} min={from || undefined} onChange={event => { setTo(event.target.value); setPage(1); }} className="block rounded-xl border p-3" /></label>
    </div>
    {!activity.length && <p>{ar ? 'لا توجد أنشطة مسجلة بعد' : 'No recorded activity yet'}</p>}
    {activity.map(item => <article key={item.id} className="rounded-xl border bg-white p-4"><p>{item.first_name} {item.last_name}</p><p className="text-sm">{formatStaffActivity(item.action, ar ? 'ar' : 'en')}</p><StaffActivityDetails details={item.details} /><time className="text-xs text-gray-500">{new Date(item.created_at).toLocaleString(ar ? 'ar' : 'en')}</time></article>)}
    <div className="flex gap-4"><button disabled={page <= 1} onClick={() => setPage(page - 1)}>{ar ? 'السابق' : 'Previous'}</button><span>{page} / {lastPage}</span><button disabled={page >= lastPage} onClick={() => setPage(page + 1)}>{ar ? 'التالي' : 'Next'}</button></div>
    </>}
  </div>;
}
