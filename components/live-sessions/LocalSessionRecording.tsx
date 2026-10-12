'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { Square, Video } from 'lucide-react';

export default function LocalSessionRecording({ roomId, joined, enabled }: { roomId: string; joined: boolean; enabled: boolean }) {
  const ar = useLocale() === 'ar';
  const recorder = useRef<MediaRecorder | null>(null);
  const [supported, setSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [download, setDownload] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    setSupported(typeof navigator.mediaDevices?.getDisplayMedia === 'function' && typeof MediaRecorder !== 'undefined');
    return () => { if (recorder.current?.state === 'recording') recorder.current.stop(); };
  }, []);
  useEffect(() => () => { if (download) URL.revokeObjectURL(download.url); }, [download]);
  useEffect(() => {
    if (!joined && recorder.current?.state === 'recording') recorder.current.stop();
  }, [joined]);
  useEffect(() => {
    if (!recording) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [recording]);

  const toggleRecording = async () => {
    if (pending || !enabled || !joined) return;
    if (recording) { setPending(true); recorder.current?.stop(); return; }
    setError('');
    setPending(true);
    let display: MediaStream | undefined, mic: MediaStream | undefined, audio: AudioContext | undefined;
    const release = () => {
      display?.getTracks().forEach(track => track.stop());
      mic?.getTracks().forEach(track => track.stop());
      void audio?.close();
    };
    try {
      display = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 24 }, audio: true, preferCurrentTab: true } as DisplayMediaStreamOptions);
      if (!display.getAudioTracks().length) throw new Error('missing-audio');
      mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
      audio = new AudioContext();
      await audio.resume();
      const mixed = audio.createMediaStreamDestination();
      audio.createMediaStreamSource(display).connect(mixed);
      audio.createMediaStreamSource(mic).connect(mixed);
      const stream = new MediaStream([...display.getVideoTracks(), ...mixed.stream.getAudioTracks()]);
      const mimeType = ['video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'].find(type => MediaRecorder.isTypeSupported(type));
      const current = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), videoBitsPerSecond: 1500000 });
      recorder.current = current;
      // shortcut: buffers on this device until stop; use disk streaming for multi-hour recordings.
      const chunks: Blob[] = [];
      current.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      current.onstart = () => { setRecording(true); setPending(false); };
      current.onerror = () => {
        setError(ar ? 'توقف التسجيل بسبب خطأ في المتصفح. احفظ الجزء المتاح.' : 'The browser interrupted recording. Save the available portion.');
        if (current.state !== 'inactive') current.stop();
      };
      current.onstop = () => {
        release();
        recorder.current = null;
        setRecording(false);
        setPending(false);
        if (!chunks.length) return;
        const url = URL.createObjectURL(new Blob(chunks, { type: current.mimeType }));
        const name = `Learnoo-${roomId}-${new Date().toISOString().replace(/[:.]/g, '-')}.${current.mimeType.includes('mp4') ? 'mp4' : 'webm'}`;
        setDownload({ url, name });
        const link = document.createElement('a');
        link.href = url;
        link.download = name;
        link.click();
      };
      display.getVideoTracks()[0].addEventListener('ended', () => { if (current.state === 'recording') current.stop(); });
      if (display.getVideoTracks()[0].readyState === 'ended') throw new Error('capture-ended');
      current.start(1000);
    } catch (failure) {
      release();
      recorder.current = null;
      setPending(false);
      setError(failure instanceof Error && failure.message === 'missing-audio'
        ? (ar ? 'اختر تبويب الجلسة وفعّل «مشاركة صوت التبويب» في Chrome أو Edge على الكمبيوتر، ثم أعد المحاولة.' : 'Select the meeting tab and enable Share tab audio in desktop Chrome or Edge, then retry.')
        : (ar ? 'لم يبدأ التسجيل. اسمح بتسجيل التبويب واستخدام الميكروفون، ثم أعد المحاولة.' : 'Recording did not start. Allow tab capture and microphone access, then retry.'));
    }
  };

  if (!enabled) return <p className="text-xs text-slate-300">{ar ? 'التسجيل غير مفعّل لهذه الجلسة' : 'Recording is disabled for this session'}</p>;
  return <div className="max-w-[180px] sm:max-w-xs text-xs text-white">
    {supported ? <button type="button" disabled={!joined || pending} onClick={toggleRecording}
      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 disabled:opacity-50 ${recording ? 'border-red-500 text-red-400' : 'border-slate-600'}`}>
      {recording ? <Square className="h-4 w-4" /> : <Video className="h-4 w-4" />}
      {pending ? (ar ? 'جارٍ تجهيز التسجيل…' : 'Preparing recording…') : recording ? (ar ? 'إيقاف وحفظ التسجيل' : 'Stop and save recording') : (ar ? 'تسجيل على جهازي' : 'Record on my device')}
    </button> : <p>{ar ? 'التسجيل من الموقع يحتاج Chrome أو Edge على الكمبيوتر.' : 'Website recording requires desktop Chrome or Edge.'}</p>}
    {supported && <p className="mt-1 text-slate-300">{recording
      ? (ar ? 'التسجيل جارٍ على جهازك. أوقفه واحفظ الملف قبل إغلاق الصفحة.' : 'Recording on your device. Stop and save before closing this page.')
      : (ar ? 'يسجل التبويب وميكروفونك. اختر تبويب الجلسة مع الصوت؛ يُنزّل الفيديو على جهازك عند الإيقاف.' : 'Records the tab and your microphone. Choose the meeting tab with audio; the video downloads to your device when stopped.')}</p>}
    {error && <p role="alert" className="mt-1 text-red-300">{error}</p>}
    {download && <a className="mt-1 block underline" href={download.url} download={download.name}>{ar ? 'حفظ آخر تسجيل على جهازي' : 'Save last recording to my device'}</a>}
  </div>;
}
