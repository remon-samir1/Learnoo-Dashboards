'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useCurrentUser } from '@/src/hooks/useAuth';
import StaffLiveRoom from './StaffLiveRoom';
import Link from 'next/link';

const SessionContext = createContext<(id: string) => void>(() => {});
export const useLiveSession = () => useContext(SessionContext);

export function PersistentLiveSession({ children }: { children: React.ReactNode }) {
  const { user, role } = useCurrentUser();
  const pathname = usePathname();
  const [roomId, setRoomId] = useState<string | null>(null);
  const staff = ['Instructor', 'Admin', 'Super Admin'].includes(role ?? '');
  const storageKey = `learnoo-live-room-${user?.id}`;
  const basePath = role === 'Instructor' ? '/doctor/live-sessions' : '/live-sessions';

  useEffect(() => {
    if (staff) setRoomId(sessionStorage.getItem(storageKey));
    else setRoomId(null);
  }, [staff, storageKey]);

  const open = (id: string) => {
    if (!staff) return;
    sessionStorage.setItem(storageKey, id);
    setRoomId(id);
  };
  const close = () => {
    sessionStorage.removeItem(storageKey);
    setRoomId(null);
  };
  const full = pathname === `${basePath}/${roomId}/room`;

  return <SessionContext.Provider value={open}>
    {children}
    {staff && roomId && <aside aria-label="البث المباشر" className={full ? 'fixed inset-0 z-50 bg-slate-900' : 'fixed bottom-4 end-4 z-50 h-[320px] w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-xl bg-slate-900 shadow-xl'}>
      {!full && <Link className="block bg-slate-800 px-4 py-2 text-sm text-white" href={`${basePath}/${roomId}/room`}>العودة إلى البث المباشر</Link>}
      <div className={full ? 'h-full' : 'h-[calc(100%-36px)]'}><StaffLiveRoom key={roomId} roomId={roomId} basePath={basePath} onClose={close} /></div>
    </aside>}
  </SessionContext.Provider>;
}
