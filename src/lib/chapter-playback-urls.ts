import { isHlsStreamUrl, isMp4StreamUrl } from '@/src/lib/video-stream-detect';

function learnooApiBase(): string {
  return (process.env.NEXT_PUBLIC_API_URL || 'https://api.learnoo.app').replace(/\/$/, '');
}

export function learnooChapterHlsPlaylistUrl(chapterId: number): string {
  return `${learnooApiBase()}/hls/chapter/${chapterId}/playlist`;
}

function isLearnooHostedFileUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    const base = new URL(learnooApiBase());
    if (u.hostname !== base.hostname && !u.hostname.endsWith('.learnoo.app')) return false;
    const p = u.pathname.toLowerCase();
    return p.includes('/storage/') || p.includes('/uploads/');
  } catch {
    return false;
  }
}

export type ChapterStreamPick = { primarySrc: string; mp4FallbackUrl: string };

type ChapterAttrsLike = {
  video?: string | null;
  playlist?: string | null;
  video_hls_url?: string | null;
  video_mp4_url?: string | null;
};

/**
 * Picks primary playback URL (prefer HLS) and optional MP4 fallback for hybrid player.
 */
export function pickChapterStreams(chapterId: number, attrs: ChapterAttrsLike): ChapterStreamPick {
  const idOk = Number.isFinite(chapterId) && chapterId > 0;
  const explicitHls = (attrs.video_hls_url ?? attrs.playlist ?? '').trim();
  const explicitMp4 = (attrs.video_mp4_url ?? '').trim();
  const video = (attrs.video ?? '').trim();

  const mp4FromVideo = isMp4StreamUrl(video) ? video : '';
  const hlsFromVideo = isHlsStreamUrl(video) ? video : '';

  let primarySrc = '';
  let mp4FallbackUrl = explicitMp4;

  if (explicitHls && isHlsStreamUrl(explicitHls)) {
    primarySrc = explicitHls;
  } else if (hlsFromVideo) {
    primarySrc = hlsFromVideo;
  } else if (idOk && mp4FromVideo && isLearnooHostedFileUrl(mp4FromVideo)) {
    primarySrc = learnooChapterHlsPlaylistUrl(chapterId);
  } else if (mp4FromVideo) {
    primarySrc = mp4FromVideo;
  } else if (explicitHls) {
    primarySrc = explicitHls;
  }

  if (primarySrc && isHlsStreamUrl(primarySrc)) {
    if (!mp4FallbackUrl && mp4FromVideo) mp4FallbackUrl = mp4FromVideo;
  }

  return { primarySrc, mp4FallbackUrl };
}
