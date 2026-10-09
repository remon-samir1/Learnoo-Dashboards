'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useCurrentUser } from '@/src/hooks/useAuth';
import { useLiveSession } from './PersistentLiveSession';

export default function StaffLiveRoomPage() {
  const { id } = useParams<{ id: string }>();
  const { role } = useCurrentUser();
  const open = useLiveSession();
  useEffect(() => { open(id); }, [id, role]);
  return <div className="flex h-[80dvh] items-center justify-center">جارٍ الاتصال بالبث المباشر…</div>;
}
