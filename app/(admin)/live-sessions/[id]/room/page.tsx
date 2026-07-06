'use client';

import React, { useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useLiveRoom } from '@/src/hooks/useLiveRooms';
import { getUserData } from '@/lib/auth';
import { JitsiMeeting } from '@jitsi/react-sdk';

const JITSI_DOMAIN = 'meet.jit.si';

export default function LiveRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const { data: liveRoom, isLoading } = useLiveRoom(parseInt(roomId));

  const userData = getUserData();
  const userName = userData?.attributes?.first_name
    ? `${userData.attributes.first_name} ${userData.attributes.last_name || ''}`.trim()
    : 'Instructor';

  // Stable room name derived from the room ID
  const jitsiRoomName = `learnoo-room-${roomId}`;

  const jitsiApiRef = useRef<any>(null);

  // When the host closes/leaves, navigate back
  const handleReadyToClose = () => {
    router.push('/live-sessions');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0F172A]">
        <Loader2 className="w-10 h-10 animate-spin text-[#2563EB]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#0F172A]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#1E293B] border-b border-[#334155] shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/live-sessions">
            <button className="p-2 hover:bg-[#334155] rounded-full transition-colors">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white">
              {liveRoom?.attributes?.title || 'Live Session'}
            </h1>
            <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>Live Now</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#94A3B8] bg-[#0F172A] px-3 py-1.5 rounded-lg border border-[#334155]">
          <span>Room ID:</span>
          <code className="text-[#60A5FA] font-mono">{jitsiRoomName}</code>
        </div>
      </div>

      {/* Jitsi Meeting Embed */}
      <div className="flex-1 overflow-hidden">
        <JitsiMeeting
          domain={JITSI_DOMAIN}
          roomName={jitsiRoomName}
          configOverwrite={{
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            disableModeratorIndicator: false,
            startScreenSharing: false,
            enableEmailInStats: false,
            prejoinPageEnabled: false,
            disableDeepLinking: true,
            // Lobby: students wait until the host (moderator) admits them
            lobby: {
              enabled: true,
              autoKnock: true,
            },
            moderator: {
              enabled: true,
            },
          }}
          interfaceConfigOverwrite={{
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
            SHOW_CHROME_EXTENSION_BANNER: false,
            MOBILE_APP_PROMO: false,
          }}
          userInfo={{
            displayName: userName,
            email: userData?.attributes?.email || '',
          }}
          onApiReady={(api) => {
            jitsiApiRef.current = api;
            // Listen for the local participant leaving
            api.addEventListeners({
              readyToClose: handleReadyToClose,
            });
          }}
          onReadyToClose={handleReadyToClose}
          getIFrameRef={(iframe) => {
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
          }}
        />
      </div>
    </div>
  );
}
