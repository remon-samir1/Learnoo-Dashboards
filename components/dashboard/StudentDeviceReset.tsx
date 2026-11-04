'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import { ownerOperationsApi } from '@/src/lib/api';
import { useCurrentUser } from '@/src/hooks/useAuth';

export default function StudentDeviceReset({ studentId }: { studentId: string }) {
  const ar = useLocale() === 'ar';
  const { role } = useCurrentUser();
  const [busy, setBusy] = useState(false);
  if (role !== 'Admin' && role !== 'Super Admin') return null;

  async function resetDevice() {
    if (!window.confirm(ar
      ? 'السماح لهذا الطالب بتغيير جهازه؟ سيتم إلغاء الجلسات وطلبات النقل السابقة، وسيُعتمد أول جهاز يسجّل منه الطالب بعد ذلك. سيحتفظ الحساب بتفعيلاته ومشاهداته.'
      : 'Allow this student to change devices? Previous sessions and transfer requests will be revoked. The first device used to sign in next will be approved. The account keeps its access and viewing history.')) return;
    setBusy(true);
    try {
      await ownerOperationsApi.resetDevice(studentId);
      toast.success(ar ? 'تم السماح بتغيير الجهاز وإلغاء الجلسات السابقة. يمكن للطالب الآن الدخول من الجهاز الجديد.' : 'Device change allowed. Previous sessions revoked. The student can now sign in from the new device.');
    } catch {
      toast.error(ar ? 'تعذر السماح بتغيير الجهاز. حاول مرة أخرى.' : 'Could not allow the device change. Please try again.');
    } finally { setBusy(false); }
  }

  return <div className="space-y-3 border-t pt-4">
    <p className="text-sm text-slate-600">{ar ? 'يسمح بتغيير الجهاز بدون طلب من الطالب. تُلغى الجلسات السابقة، ويُعتمد أول جهاز يسجّل منه الطالب بعد ذلك.' : 'Allow a device change without a student request. Previous sessions are revoked, and the next device used to sign in is approved.'}</p>
    <button type="button" disabled={busy} onClick={resetDevice} className="rounded-xl bg-primary px-4 py-3 text-sm font-medium text-white disabled:opacity-50">
      {busy ? (ar ? 'جارٍ السماح بتغيير الجهاز…' : 'Allowing device change…') : (ar ? 'السماح بتغيير الجهاز' : 'Allow device change')}
    </button>
  </div>;
}
