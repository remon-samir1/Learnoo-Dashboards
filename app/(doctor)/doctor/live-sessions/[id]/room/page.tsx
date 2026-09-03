'use client';

import React, { useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Loader2, Video, Square } from 'lucide-react';
import Link from 'next/link';
import { useLiveRoom } from '@/src/hooks/useLiveRooms';
import { getUserData } from '@/lib/auth';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { JITSI_DOMAIN, getJitsiRoomName } from '@/src/lib/jitsi';

export default function DoctorLiveRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const { data: liveRoom, isLoading } = useLiveRoom(parseInt(roomId));

  const userData = getUserData();
  const userName = userData?.attributes?.first_name
    ? `${userData.attributes.first_name} ${userData.attributes.last_name || ''}`.trim()
    : 'Instructor';

  const jitsiRoomName = getJitsiRoomName(roomId);
  const jitsiApiRef = useRef<any>(null);

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const toggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.style.display = 'none';
        a.href = url;
        a.download = `recording-${roomId}-${new Date().getTime()}.webm`;
        a.click();
        window.URL.revokeObjectURL(url);
      };

      stream.getVideoTracks()[0].onended = () => {
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
          setIsRecording(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error starting screen recording:", err);
      alert("تعذر بدء تسجيل الشاشة. يرجى التأكد من منح الصلاحيات.");
    }
  };

  const handleReadyToClose = () => {
    router.push('/doctor/live-sessions');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0F172A]">
        <Loader2 className="w-10 h-10 animate-spin text-[#2563EB]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden bg-[#0F172A]">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 sm:px-6 sm:py-4 bg-[#1E293B] border-b border-[#334155] shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1">
          <Link href="/doctor/live-sessions" className="shrink-0">
            <button
              type="button"
              className="p-1.5 sm:p-2 hover:bg-[#334155] rounded-full transition-colors"
              aria-label="Back to live sessions"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base md:text-lg font-bold text-white truncate max-w-[140px] xs:max-w-[200px] sm:max-w-xs md:max-w-md">
              {liveRoom?.attributes?.title || 'Live Session'}
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
              <span className="truncate">Live Now</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={toggleRecording}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg border text-xs sm:text-sm font-medium transition-colors ${isRecording
                ? 'bg-red-500/10 text-red-500 border-red-500'
                : 'bg-[#0F172A] text-white border-[#334155] hover:bg-[#334155]'
              }`}
          >
            {isRecording ? (
              <>
                <Square className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current shrink-0" />
                <span className="whitespace-nowrap">إيقاف التسجيل</span>
              </>
            ) : (
              <>
                <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="whitespace-nowrap">تسجيل كفيديو</span>
              </>
            )}
          </button>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#94A3B8] bg-[#0F172A] px-2.5 py-1.5 rounded-lg border border-[#334155]">
            <span className="text-[#64748B]">Room:</span>
            <code className="text-[#60A5FA] font-mono truncate max-w-[120px] md:max-w-none">{jitsiRoomName}</code>
          </div>
        </div>
      </div>

      {/* Jitsi Meeting Embed */}
      <div className="min-h-0 flex-1 relative w-full overflow-hidden">
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
            fileRecordingsEnabled: true,
            localRecording: {
              enabled: true,
            },
            whiteboard: {
              enabled: true,
              collabServerBaseUrl: 'https://whiteboard.jitsi.net',
            },
            toolbarButtons: [
              'camera',
              'chat',
              'closedcaptions',
              'desktop',
              'download',
              'embedmeeting',
              'etherpad',
              'feedback',
              'filmstrip',
              'fullscreen',
              'hangup',
              'help',
              'highlight',
              'invite',
              'linktosalesforce',
              'livestreaming',
              'microphone',
              'noisesuppression',
              'participants-pane',
              'profile',
              'raisehand',
              'recording',
              'localrecording',
              'security',
              'select-background',
              'settings',
              'shareaudio',
              'sharedvideo',
              'shortcuts',
              'stats',
              'tileview',
              'toggle-camera',
              'videoquality',
              'whiteboard'
            ],
            // Lobby: students wait until the host admits them
            lobby: {
              enabled: true,
              autoKnock: true,
            },
            // Host is moderator — can admit from lobby
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
