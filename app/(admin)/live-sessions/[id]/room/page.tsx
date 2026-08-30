'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Loader2, Video, Square } from 'lucide-react';
import Link from 'next/link';
import { useLiveRoom } from '@/src/hooks/useLiveRooms';
import { getUserData } from '@/lib/auth';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { JITSI_DOMAIN, getJitsiRoomName } from '@/src/lib/jitsi';

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
        <div className="flex items-center gap-3">
          <button
            onClick={toggleRecording}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${isRecording
                ? 'bg-red-500/10 text-red-500 border-red-500'
                : 'bg-[#0F172A] text-white border-[#334155] hover:bg-[#334155]'
              }`}
          >
            {isRecording ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                <span>إيقاف التسجيل</span>
              </>
            ) : (
              <>
                <Video className="w-4 h-4" />
                <span>تسجيل كفيديو</span>
              </>
            )}
          </button>
          <div className="flex items-center gap-2 text-xs text-[#94A3B8] bg-[#0F172A] px-3 py-1.5 rounded-lg border border-[#334155]">
            <span>Room ID:</span>
            <code className="text-[#60A5FA] font-mono">{jitsiRoomName}</code>
          </div>
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
