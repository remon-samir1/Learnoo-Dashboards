'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, Loader2, Smartphone, Presentation } from 'lucide-react';
import Link from 'next/link';
import { useLiveRoom } from '@/src/hooks/useLiveRooms';
import { getUserData } from '@/lib/auth';
import { JitsiMeeting } from '@jitsi/react-sdk';
import LocalSessionRecording from './LocalSessionRecording';
import { liveMeetingBranding, liveWhiteboardConfig, JITSI_DOMAIN, getJitsiRoomName, getJitsiAppUrl } from '@/src/lib/jitsi';

export default function StaffLiveRoom({ roomId, basePath, onClose }: { roomId: string; basePath: string; onClose: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: liveRoom, isLoading } = useLiveRoom(parseInt(roomId));

  const userData = getUserData();
  const userName = userData?.attributes?.first_name
    ? `${userData.attributes.first_name} ${userData.attributes.last_name || ''}`.trim()
    : 'Instructor';

  const jitsiRoomName = getJitsiRoomName(roomId);

  const jitsiApiRef = useRef<any>(null);

  const [joined, setJoined] = useState(false);
  const [screenCaptureSupported, setScreenCaptureSupported] = useState<boolean | null>(null);
  const [meetingInBrowser, setMeetingInBrowser] = useState(false);
  const [android, setAndroid] = useState(false);
  const recordingEnabled = !!liveRoom?.attributes?.enable_recording;

  useEffect(() => {
    const supported = typeof navigator.mediaDevices?.getDisplayMedia === 'function';
    setScreenCaptureSupported(supported);
    setMeetingInBrowser(supported);
    setAndroid(/Android/i.test(navigator.userAgent));
  }, []);

  const handleReadyToClose = () => {
    onClose();
    if (pathname === `${basePath}/${roomId}/room`) router.push(basePath);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0F172A]">
        <Loader2 className="w-10 h-10 animate-spin text-[#2563EB]" />
      </div>
    );
  }

  if (!liveRoom) return <div className="flex h-full flex-col items-center justify-center gap-4 bg-slate-900 text-white"><p>الجلسة غير متاحة</p><button onClick={handleReadyToClose}>العودة إلى الجلسات</button></div>;

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-[#0F172A]">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 sm:px-6 sm:py-4 bg-[#1E293B] border-b border-[#334155] shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1">
          <Link href={basePath} className="shrink-0">
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
              <span className="truncate">بث مباشر</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {meetingInBrowser && <button type="button" disabled={!joined} onClick={() => jitsiApiRef.current?.executeCommand('toggleWhiteboard')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-600 px-2.5 py-1.5 text-xs text-white disabled:opacity-50">
            <Presentation className="h-4 w-4" /> السبورة
          </button>}
          {meetingInBrowser && <LocalSessionRecording roomId={roomId} joined={joined} enabled={recordingEnabled} />}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#94A3B8] bg-[#0F172A] px-2.5 py-1.5 rounded-lg border border-[#334155]">
            <span className="text-[#64748B]">Room:</span>
            <code className="text-[#60A5FA] font-mono truncate max-w-[120px] md:max-w-none">{jitsiRoomName}</code>
          </div>
        </div>
      </div>

      {screenCaptureSupported === false && <div dir="rtl" className="shrink-0 bg-slate-800 px-4 py-3 text-sm text-white">
        مشاركة شاشة الآيباد أو الهاتف تحتاج تطبيق مشاركة الشاشة. الطلاب يظلّون داخل Learnoo.
        {meetingInBrowser && <a className="ms-2 underline" href={getJitsiAppUrl(roomId, userName, android)} onClick={() => { setMeetingInBrowser(false); setJoined(false); jitsiApiRef.current = null; }}>فتح في تطبيق مشاركة الشاشة</a>}
      </div>}

      {/* Jitsi Meeting Embed */}
      <div className="min-h-0 flex-1 relative w-full overflow-auto">
        {screenCaptureSupported === null ? <p className="p-6 text-white">جارٍ تجهيز الجلسة…</p> : !meetingInBrowser ? <div dir="rtl" className="mx-auto flex max-w-xl flex-col gap-5 p-6 text-center text-white">
          <Smartphone className="mx-auto h-10 w-10" />
          <h2 className="text-xl font-bold">ابدأ الجلسة من تطبيق مشاركة الشاشة</h2>
          <p>ثبّت التطبيق، ثم افتح نفس الجلسة من الزر التالي. داخل التطبيق اختر «مشاركة الشاشة»، ثم وافق على بدء بث الشاشة من جهازك.</p>
          <a className="rounded-lg bg-blue-600 px-4 py-3 font-bold" href={getJitsiAppUrl(roomId, userName, android)}>فتح في تطبيق مشاركة الشاشة</a>
          <a className="underline" href="https://jitsi.org/downloads/" target="_blank" rel="noopener noreferrer">تحميل تطبيق مشاركة الشاشة</a>
          <p className="text-sm text-slate-300">إذا لم يفتح التطبيق، انسخ رابط الجلسة التالي والصقه في خانة الانضمام داخل تطبيق مشاركة الشاشة:</p>
          <input aria-label="رابط الجلسة لتطبيق مشاركة الشاشة" readOnly value={`https://${JITSI_DOMAIN}/${jitsiRoomName}`} dir="ltr" className="w-full rounded-lg bg-slate-700 p-3 text-sm" onFocus={event => event.currentTarget.select()} />
          <button className="text-sm underline" onClick={() => setMeetingInBrowser(true)}>فتح الجلسة والسبورة في المتصفح</button>
          <p className="text-sm text-slate-300">السبورة داخل المتصفح لا تحتاج مشاركة شاشة الجهاز.</p>
        </div> : <JitsiMeeting
          domain={JITSI_DOMAIN}
          roomName={jitsiRoomName}
          configOverwrite={{
            startWithAudioMuted: true,
            startWithVideoMuted: true,
            disableModeratorIndicator: false,
            startScreenSharing: false,
            enableEmailInStats: false,
            prejoinConfig: { enabled: false },
            disableDeepLinking: true,
            fileRecordingsEnabled: false,
            recordingService: { enabled: false },
            localRecording: { disable: true },
            whiteboard: liveWhiteboardConfig,
            toolbarButtons: [
              'camera',
              'chat',
              'closedcaptions',
              'desktop',
              'download',
              'embedmeeting',
              'etherpad',
              'filmstrip',
              'fullscreen',
              'hangup',
              'highlight',
              'invite',
              'linktosalesforce',
              'microphone',
              'noisesuppression',
              'participants-pane',
              'profile',
              'raisehand',
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
            ...liveMeetingBranding,
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
              videoConferenceJoined: () => setJoined(true),
              videoConferenceLeft: () => setJoined(false),

            });
          }}
          onReadyToClose={handleReadyToClose}
          getIFrameRef={(iframe) => {
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
          }}
        />}
      </div>
    </div>
  );
}
