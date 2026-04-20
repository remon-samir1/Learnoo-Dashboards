"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LiveSessionCard from '@/components/live-sessions/LiveSessionCard';
import { useLiveRooms, useDeleteLiveRoom } from '@/src/hooks/useLiveRooms';
import type { LiveRoom } from '@/src/types';
import { toast } from 'react-hot-toast';

function getSessionStatus(room: LiveRoom): 'LIVE' | 'UPCOMING' | 'ENDED' {
  // Use API status if available
  const apiStatus = room.attributes.status;
  if (apiStatus === 'live') return 'LIVE';
  if (apiStatus === 'ended') return 'ENDED';
  if (apiStatus === 'pending') return 'UPCOMING';
  
  // Fallback to calculation if no API status
  const now = new Date();
  const startTime = new Date(room.attributes.started_at);
  const endTime = room.attributes.ended_at ? new Date(room.attributes.ended_at) : null;

  if (endTime && now >= startTime && now <= endTime) {
    return 'LIVE';
  } else if (now < startTime) {
    return 'UPCOMING';
  } else {
    return 'ENDED';
  }
}

function formatTime(dateString: string, t: any): string {
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow = new Date(now.setDate(now.getDate() + 1)).toDateString() === date.toDateString();

  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  if (isToday) return `${t('liveSessions.time.today')}, ${timeStr}`;
  if (isTomorrow) return `${t('liveSessions.time.tomorrow')}, ${timeStr}`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
}

function getDuration(startedAt: string, endedAt?: string | null): string {
  if (!endedAt) return '';
  const start = new Date(startedAt);
  const end = new Date(endedAt);
  const diffMs = end.getTime() - start.getTime();
  const diffMins = Math.round(diffMs / 60000);

  if (isNaN(diffMins) || diffMins < 0) return '';

  if (diffMins >= 60) {
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${diffMins} min`;
}

export default function LiveSessionsPage() {
  const t = useTranslations();
  const router = useRouter();
  const { data: liveRooms, isLoading, error, refetch } = useLiveRooms();
  const deleteMutation = useDeleteLiveRoom();

  const handleStart = (roomId: string) => {
    router.push(`/live-sessions/${roomId}/room`);
  };

  const handleDelete = async (roomId: string) => {
    if (!confirm(t('liveSessions.deleteConfirm'))) return;
    try {
      await deleteMutation.mutate(Number(roomId));
      toast.success(t('liveSessions.deleteSuccess'));
      refetch();
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error(t('liveSessions.deleteError'));
    }
  };

  const transformRoomToCardProps = (room: LiveRoom) => {
    const attrs = room.attributes;
    return {
      id: room.id,
      status: getSessionStatus(room),
      title: attrs.title,
      course: attrs.course?.data?.attributes?.title || t('liveSessions.card.noCourse'),
      instructor: attrs.user?.data?.attributes?.full_name || t('liveSessions.card.unknownInstructor'),
      time: formatTime(attrs.started_at, t),
      duration: getDuration(attrs.started_at, attrs.ended_at),
      enable_chat: attrs.enable_chat ?? true,
      enable_recording: attrs.enable_recording ?? false,
    };
  };

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">{t('liveSessions.pageTitle')}</h1>
          <p className="text-[#64748B] mt-1 text-[14px]">{t('liveSessions.pageDescription')}</p>
        </div>
        <Link href="/live-sessions/schedule">
          <button className="bg-[#2563EB] text-white px-6 py-2.5 rounded-xl font-bold text-[14px] flex items-center gap-2 hover:bg-[#1D4ED8] transition-all shadow-md shadow-blue-200">
            <Plus className="w-5 h-5" />
            {t('liveSessions.scheduleSession')}
          </button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
        <input
          type="text"
          placeholder={t('liveSessions.searchPlaceholder')}
          className="w-full pl-11 pr-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8]"
        />
      </div>

      {/* Sessions List */}
      <div className="flex flex-col gap-6">
        {isLoading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-[#F1F5F9] rounded-2xl p-6 h-32 animate-pulse" />
            ))}
          </>
        ) : error ? (
          <div className="text-center py-12 text-red-500">
            {t('liveSessions.error')}: {error}
          </div>
        ) : liveRooms && liveRooms.length > 0 ? (
          liveRooms.map((room) => {
            const cardProps = transformRoomToCardProps(room);
            return (
              <LiveSessionCard
                key={room.id}
                {...cardProps}
                onStart={() => handleStart(room.id)}
                onDetails={() => router.push(`/live-sessions/${room.id}`)}
                onSettings={() => router.push(`/live-sessions/${room.id}/settings`)}
                onDelete={() => handleDelete(room.id)}
              />
            );
          })
        ) : (
          <div className="text-center py-12 text-[#64748B]">
            {t('liveSessions.noSessions')}
          </div>
        )}
      </div>
    </div>
  );
}
