'use client';

import Cookies from 'js-cookie';
import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from 'react';
import Hls, { type ErrorData, ErrorDetails, Events, type HlsConfig } from 'hls.js';
import { toProxiedLearnooHlsUrl } from '@/src/lib/learnoo-hls-proxy';
import type { WatermarkResolution } from '@/src/lib/watermark-from-features';
import { isHlsStreamUrl, isMp4StreamUrl } from '@/src/lib/video-stream-detect';
import type { WatermarkContentType } from '@/src/types/watermark-config';
import { HlsVideoCustomControls } from '@/components/student/watch/HlsVideoCustomControls';
import { StudentVideoStaticOverlay } from '@/components/student/watch/StudentVideoStaticOverlay';
import { VideoWatermark } from '@/components/student/watch/VideoWatermark';

const LOG_PREFIX = '[HlsVideoPlayer]';

export type HlsPlaybackMode = 'native-hls' | 'hls-mse' | 'unsupported-hls' | 'mp4-progressive';

/**
 * Learnoo serves the master at `.../playlist` (200, `application/vnd.apple.mpegurl`). The
 * `.../playlist.m3u8` alias is not valid on this API (404). Do **not** rewrite `/playlist` → `.m3u8`
 * up front. This helper is only used after a manifest **404** to try the alternate pattern used
 * by some other backends.
 */
function tryPlaylistM3u8FallbackUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    const p = u.pathname;
    const lower = p.toLowerCase();
    if (lower.endsWith('.m3u8')) return null;
    if (lower.endsWith('/playlist') || lower.endsWith('/playlist/')) {
      const base = p.replace(/\/?$/, '');
      u.pathname = `${base}.m3u8`;
      return u.toString();
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Attach Bearer to HLS XHRs. When the master is loaded via same-origin `/api/learnoo-origin/…`,
 * `masterPlaylistUrl` resolves to `localhost` — use `apiMasterUrl` (original `https://api…/hls/…`)
 * so absolute `#EXT-X-KEY` URLs to `api.learnoo.app` still receive Authorization (fixes keyLoadError 401).
 */
function attachBearerForHlsXhr(
  xhr: XMLHttpRequest,
  requestUrl: string,
  masterPlaylistUrl: string,
  token: string,
  apiMasterUrl: string
): void {
  const resolveAgainstPage = (u: string): string => {
    const t = u.trim();
    if (/^https?:\/\//i.test(t)) return t;
    if (typeof window !== 'undefined') {
      try {
        return new URL(t, window.location.origin).href;
      } catch {
        /* fallthrough */
      }
    }
    return t;
  };

  const masterResolved = resolveAgainstPage(masterPlaylistUrl);

  let resolvedRequest: string;
  try {
    resolvedRequest = new URL(requestUrl, masterResolved).toString();
  } catch {
    return;
  }
  let masterHost: string;
  let requestHost: string;
  try {
    masterHost = new URL(masterResolved).hostname;
    requestHost = new URL(resolvedRequest).hostname;
  } catch {
    return;
  }

  let logicalMasterOnLearnoo = false;
  try {
    const h = new URL(apiMasterUrl.trim()).hostname;
    logicalMasterOnLearnoo = h === 'api.learnoo.app' || h.endsWith('.learnoo.app');
  } catch {
    /* ignore */
  }

  const masterOnLearnoo =
    logicalMasterOnLearnoo ||
    masterHost === 'api.learnoo.app' ||
    masterHost.endsWith('.learnoo.app');
  const requestOnLearnoo = requestHost === 'api.learnoo.app' || requestHost.endsWith('.learnoo.app');
  const sameHost = requestHost === masterHost;

  if (!(sameHost || (masterOnLearnoo && requestOnLearnoo))) {
    console.debug(`${LOG_PREFIX} xhrSetup skip Authorization (host gate)`, {
      requestHost,
      masterHost,
      logicalMasterOnLearnoo,
      requestUrl: resolvedRequest,
    });
    return;
  }

  xhr.setRequestHeader('Authorization', `Bearer ${token}`);
}

function videoErrorMessage(code: number | undefined): string {
  switch (code) {
    case MediaError.MEDIA_ERR_ABORTED:
      return 'MEDIA_ERR_ABORTED — fetch aborted';
    case MediaError.MEDIA_ERR_NETWORK:
      return 'MEDIA_ERR_NETWORK — network error while loading';
    case MediaError.MEDIA_ERR_DECODE:
      return 'MEDIA_ERR_DECODE — decode failed (codec / corrupt segment)';
    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
      return 'MEDIA_ERR_SRC_NOT_SUPPORTED — MIME/codec not supported or invalid source';
    default:
      return `Unknown media error code: ${code ?? 'n/a'}`;
  }
}

function logVideoState(video: HTMLVideoElement, label: string): void {
  console.info(
    `${LOG_PREFIX} ${label} | readyState=${String(video.readyState)} networkState=${String(video.networkState)} currentSrc=${video.currentSrc || '(empty)'} paused=${String(video.paused)}`
  );
}

const DEFAULT_FAKE_QUALITIES = [720, 480, 360];

function parseHlsQualityLevelsFromManifest(
  manifestText: string
): Array<{ height?: number; bitrate?: number; index: number }> {
  const levels: Array<{ height?: number; bitrate?: number; index: number }> = [];
  const lines = manifestText.split(/\r?\n/);

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line.startsWith('#EXT-X-STREAM-INF:')) continue;
    const attrs = line.substring('#EXT-X-STREAM-INF:'.length).split(',');
    let height: number | undefined;
    let bitrate: number | undefined;

    for (const attr of attrs) {
      const [key, value] = attr.split('=').map((part) => part.trim());
      if (!key || value == null) continue;
      if (key === 'RESOLUTION') {
        const parts = value.split('x');
        const candidate = Number(parts[1]);
        if (Number.isFinite(candidate) && candidate > 0) {
          height = candidate;
        }
      }
      if (key === 'BANDWIDTH') {
        const candidate = Number(value);
        if (Number.isFinite(candidate) && candidate > 0) {
          bitrate = candidate;
        }
      }
    }

    levels.push({ index: levels.length, height, bitrate });
  }

  return levels;
}

function buildMergedQualityOptions(
  realLevels: Array<{ height?: number; bitrate?: number; index?: number }> = []
): QualityOption[] {
  const result: QualityOption[] = [];
  const handledHeights = new Set<number>();

  for (let i = 0; i < realLevels.length; i += 1) {
    const level = realLevels[i];
    const index = level.index ?? i;
    const height = level.height;
    const bitrate = level.bitrate;

    let label = 'Unknown';
    if (typeof height === 'number' && height > 0) {
      label = `${height}p`;
      handledHeights.add(height);
    } else if (bitrate != null && bitrate > 0) {
      label = `${Math.round(bitrate / 1000)} kbps`;
    } else {
      label = `Level ${index + 1}`;
    }

    result.push({
      id: height ? `${height}p` : `level-${index}`,
      label,
      height,
      bitrate,
      realLevelIndex: index,
      isFake: false,
    });
  }

  for (const fakeHeight of DEFAULT_FAKE_QUALITIES) {
    if (!handledHeights.has(fakeHeight)) {
      result.push({
        id: `${fakeHeight}p`,
        label: `${fakeHeight}p`,
        height: fakeHeight,
        realLevelIndex: undefined,
        isFake: true,
      });
    }
  }

  // Sort descending: highest resolution/height at top (e.g. 1080p, 720p, 480p, 360p)
  result.sort((a, b) => {
    const hA = a.height ?? 0;
    const hB = b.height ?? 0;
    if (hA !== hB) return hB - hA;
    const bA = a.bitrate ?? 0;
    const bB = b.bitrate ?? 0;
    return bB - bA;
  });

  return result;
}

function logHlsError(data: ErrorData, masterUrl: string): void {
  const response = data.response as { code?: number; text?: string; url?: string } | undefined;
  const hintParts: string[] = [];

  if (
    data.details === ErrorDetails.MANIFEST_LOAD_ERROR ||
    data.details === ErrorDetails.MANIFEST_PARSING_ERROR ||
    data.details === ErrorDetails.LEVEL_LOAD_ERROR ||
    data.details === ErrorDetails.FRAG_LOAD_ERROR
  ) {
    hintParts.push(
      'Check Network tab: playlist/variant/segment status (401/403=CORS or auth), Content-Type (playlist: application/vnd.apple.mpegurl; segments: often video/mp2t), CORS Allow-Origin + Allow-Headers: Authorization.'
    );
  }
  if (data.details === ErrorDetails.KEY_LOAD_ERROR || data.details === ErrorDetails.KEY_LOAD_TIMEOUT) {
    hintParts.push(
      'AES-128 key request: ensure Authorization (and Cookie if used) reach /api/learnoo-origin and upstream /hls/key/… (see xhr KEY logs and server [learnoo-origin-proxy] logs).'
    );
  }
  if (data.mimeType) {
    hintParts.push(`Reported MIME: ${data.mimeType}`);
  }
  if (response?.code != null) {
    hintParts.push(`HTTP status: ${response.code}`);
    if (response.code === 0) {
      hintParts.push(
        'HTTP 0 usually means CORS/preflight blocked or request aborted; same-origin /api/learnoo-origin is used for Learnoo API URLs when possible.'
      );
    }
  }
  if (response?.text && response.text.length < 500) {
    hintParts.push(`bodySnippet=${response.text.slice(0, 200)}`);
  }

  const summary = [
    `masterUrl=${masterUrl}`,
    `fatal=${String(data.fatal)}`,
    `type=${String(data.type)}`,
    `details=${String(data.details)}`,
    data.url ? `url=${data.url}` : '',
    data.frag?.url ? `frag.url=${data.frag.url}` : '',
    data.reason ? `reason=${data.reason}` : '',
    data.error?.message ? `error.message=${data.error.message}` : '',
    response?.code != null ? `http=${String(response.code)}` : '',
    hintParts.length ? `hints=${hintParts.join('; ')}` : '',
  ]
    .filter(Boolean)
    .join(' | ');

  const http = response?.code;
  const manifestNotFound =
    http === 404 && data.details === ErrorDetails.MANIFEST_LOAD_ERROR;
  if (manifestNotFound) {
    console.debug(`${LOG_PREFIX} Hls.Events.ERROR ${summary}`);
    return;
  }

  if (data.fatal) {
    console.error(`${LOG_PREFIX} Hls.Events.ERROR ${summary}`);
  } else {
    console.warn(`${LOG_PREFIX} Hls.Events.ERROR ${summary}`);
  }
}

function canPlayNativeHls(video: HTMLVideoElement): boolean {
  const types = ['application/vnd.apple.mpegurl', 'application/x-mpegURL'] as const;
  for (const t of types) {
    const r = video.canPlayType(t);
    if (r === 'probably' || r === 'maybe') return true;
  }
  return false;
}

function isLikelyAppleNativeHlsCapable(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /AppleWebKit/i.test(ua) && !/Chrome|CriOS|Edg|OPR|Firefox/i.test(ua);
}

/**
 * Detect iOS (iPhone/iPad/iPod) Safari or any iOS browser (all use WebKit).
 * On iOS, native HLS is far more reliable than MSE/hls.js and must be preferred.
 * Also, `crossOrigin="anonymous"` on `<video>` breaks native HLS on iOS entirely.
 */
function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  // Standard iOS device strings
  if (/iPad|iPhone|iPod/i.test(ua)) return true;
  // iPadOS 13+ reports as "Macintosh" with touch support
  if (/Macintosh/i.test(ua) && typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1) return true;
  return false;
}

function logVideoElementError(
  video: HTMLVideoElement,
  mode: HlsPlaybackMode | 'rejected-non-hls'
): void {
  const ve = video.error;
  const code = ve?.code;
  const codePart =
    code == null ? 'mediaError=null' : `mediaError.code=${String(code)} (${videoErrorMessage(code)})`;
  const summary = [
    `mode=${mode}`,
    `currentSrc=${video.currentSrc || '(empty)'}`,
    `srcAttr=${video.getAttribute('src') ?? '(none)'}`,
    `networkState=${String(video.networkState)}`,
    `readyState=${String(video.readyState)}`,
    codePart,
  ].join(' | ');
  console.error(`${LOG_PREFIX} <video> error event ${summary}`);
}

/** Pause and clear element without calling `load()` — `load()` resets MSE and breaks hls.js lifecycle. */
function detachVideoSourceSoft(video: HTMLVideoElement): void {
  try {
    video.pause();
  } catch {
    /* ignore */
  }
  video.removeAttribute('src');
  video.srcObject = null;
}

export type OnFatalPlaybackError = (info: { reason: string; hlsDetails?: ErrorDetails }) => void;

type QualityOption = {
  id: string;
  label: string;
  height?: number;
  bitrate?: number;
  realLevelIndex?: number;
  isFake?: boolean;
};

export type HlsVideoPlayerProps = {
  src: string;
  id?: string;
  className?: string;
  controls?: boolean;
  playsInline?: boolean;
  preload?: HTMLVideoElement['preload'];
  autoPlay?: boolean;
  muted?: boolean;
  poster?: string;
  children?: ReactNode;
  mp4FallbackUrl?: string;
  /** Shown while tearing down HLS and loading MP4 fallback. */
  switchingPlaybackLabel?: string;
  onFatalPlaybackError?: OnFatalPlaybackError;
  hlsConfig?: Partial<HlsConfig>;
  /** When true, native `controls` are disabled and a React control bar is shown (watermark-safe). */
  showCustomControls?: boolean;
  /** Platform feature watermark (`GET /v1/feature`). */
  showWatermark?: boolean;
  watermarkContentType?: WatermarkContentType;
  /** Server-resolved watermark until client `usePlatformFeature` succeeds. */
  initialWatermarkResolution?: WatermarkResolution | null;
  /** Top-left static student id badge (pointer-events none). */
  showStaticStudentOverlay?: boolean;
  /** Second line on static overlay (e.g. lecture / chapter title). */
  staticOverlaySubtitle?: string;
  /** Rendered inside the fullscreen wrapper above the video (e.g. Show/Hide PDF). */
  watchOverlay?: ReactNode;
  /** Rendered inside the fullscreen wrapper below the video stage (e.g. PDF panel). */
  watchPanel?: ReactNode;
  /** Triggered when the user clicks the previous-chapter button. */
  onPrevChapter?: () => void;
  /** Triggered when the user clicks the next-chapter button. */
  onNextChapter?: () => void;
  /** Whether the previous-chapter action is currently enabled. */
  canPrevChapter?: boolean;
  /** Whether the next-chapter action is currently enabled. */
  canNextChapter?: boolean;
  /** Chapter title shown next to the info icon in the player controls. */
  chapterInfoTitle?: string;
  /** Whether the player is currently in theater (wider) mode. */
  theaterMode?: boolean;
  /** Toggle theater mode. */
  onToggleTheater?: () => void;
};

export const HlsVideoPlayer = forwardRef<HTMLVideoElement, HlsVideoPlayerProps>(
  function HlsVideoPlayer(
    {
      src,
      id,
      className,
      controls = true,
      playsInline = true,
      preload = 'metadata',
      autoPlay = false,
      muted = false,
      poster,
      children,
      onFatalPlaybackError,
      hlsConfig,
      mp4FallbackUrl = '',
      switchingPlaybackLabel,
      showCustomControls = false,
      showWatermark = true,
      watermarkContentType = 'chapters',
      initialWatermarkResolution = null,
      showStaticStudentOverlay = true,
      staticOverlaySubtitle,
      watchOverlay,
      watchPanel,
      onPrevChapter,
      onNextChapter,
      canPrevChapter,
      canNextChapter,
      chapterInfoTitle,
      theaterMode,
      onToggleTheater,
    },
    forwardedRef
  ) {
    const localRef = useRef<HTMLVideoElement | null>(null);
    /** Fullscreen target: video + watermark + custom controls stay in one subtree. */
    const videoWrapperRef = useRef<HTMLDivElement | null>(null);
    const hlsInstanceRef = useRef<Hls | null>(null);
    const [showControls, setShowControls] = useState(true);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [qualityOptions, setQualityOptions] = useState<QualityOption[]>(() =>
      buildMergedQualityOptions([])
    );
    const [selectedQuality, setSelectedQuality] = useState<string | 'auto'>('auto');
    const [autoQualityEnabled, setAutoQualityEnabled] = useState(true);
    const [showPlaybackSwitching, setShowPlaybackSwitching] = useState(false);
    /**
     * Tracks whether native HLS is being used (iOS). When true, we must NOT
     * set `crossOrigin="anonymous"` on the `<video>` element because it
     * breaks Safari's internal HLS player entirely.
     */
    const [usingNativeHls, setUsingNativeHls] = useState(() => isIOSDevice());
    const onFatalPlaybackErrorRef = useRef(onFatalPlaybackError);
    const hlsConfigRef = useRef(hlsConfig);
    const revealControls = useCallback(() => {
      setShowControls(true);

      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }

      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2000);
    }, []);
    useEffect(() => {
      onFatalPlaybackErrorRef.current = onFatalPlaybackError;
      hlsConfigRef.current = hlsConfig;
    }, [onFatalPlaybackError, hlsConfig]);

    const setRefs = useCallback(
      (node: HTMLVideoElement | null) => {
        localRef.current = node;
        if (typeof forwardedRef === 'function') {
          forwardedRef(node);
        } else if (forwardedRef) {
          (forwardedRef as MutableRefObject<HTMLVideoElement | null>).current = node;
        }
      },
      [forwardedRef]
    );

    const nativeVideoControls = !showCustomControls && controls;

    const setQualityLevel = useCallback(
      (value: string | 'auto') => {
        const hls = hlsInstanceRef.current;

        if (value === 'auto') {
          if (hls) {
            hls.currentLevel = -1;
            hls.nextLevel = -1;
          }
          setAutoQualityEnabled(true);
          setSelectedQuality('auto');
          return;
        }

        const opt = qualityOptions.find((q) => q.id === value || q.label === value);
        if (
          opt &&
          typeof opt.realLevelIndex === 'number' &&
          opt.realLevelIndex >= 0 &&
          hls &&
          hls.levels &&
          hls.levels[opt.realLevelIndex]
        ) {
          hls.currentLevel = opt.realLevelIndex;
          hls.nextLevel = opt.realLevelIndex;
        } else if (
          hls &&
          typeof (value as any) === 'number' &&
          hls.levels &&
          hls.levels[value as any]
        ) {
          hls.currentLevel = value as any;
          hls.nextLevel = value as any;
        }

        // Even if fake, activate gracefully in the UI without breaking playback
        setAutoQualityEnabled(false);
        setSelectedQuality(value);
      },
      [qualityOptions]
    );

    const onVideoSurfaceClick = useCallback(() => {
      if (!showCustomControls) return;
      const v = localRef.current;
      if (!v) return;
      if (v.paused) void v.play().catch(() => { });
      else v.pause();
    }, [showCustomControls]);

    useEffect(() => {
      if (!showCustomControls) return;
      const video = localRef.current;
      const wrapper = videoWrapperRef.current;
      if (!video || !wrapper || typeof document === 'undefined') return;

      const requestWrapperFullscreen = () => {
        const wrapperEl = wrapper as any;
        const req =
          wrapperEl?.requestFullscreen?.bind(wrapperEl) ??
          wrapperEl?.webkitRequestFullscreen?.bind(wrapperEl) ??
          wrapperEl?.mozRequestFullScreen?.bind(wrapperEl) ??
          wrapperEl?.msRequestFullscreen?.bind(wrapperEl);
        if (!req) return;
        try {
          const p = req();
          if (p != null && typeof (p as Promise<void>).catch === 'function') {
            void (p as Promise<void>).catch(() => { });
          }
        } catch {
          /* ignore */
        }
      };

      const redirectVideoFullscreen = () => {
        const doc = document as any;
        const fs =
          document.fullscreenElement ||
          doc.webkitFullscreenElement ||
          doc.mozFullScreenElement ||
          doc.msFullscreenElement;
        if (fs === video) {
          if (typeof document.exitFullscreen === 'function') {
            void document.exitFullscreen().then(() => {
              requestWrapperFullscreen();
            }).catch(() => {});
          } else if (typeof doc.webkitExitFullscreen === 'function') {
            try {
              doc.webkitExitFullscreen();
              requestWrapperFullscreen();
            } catch {
              /* ignore */
            }
          }
        }
      };

      const onDblClick = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
      };

      document.addEventListener('fullscreenchange', redirectVideoFullscreen);
      document.addEventListener('webkitfullscreenchange', redirectVideoFullscreen);
      video.addEventListener('dblclick', onDblClick);

      return () => {
        document.removeEventListener('fullscreenchange', redirectVideoFullscreen);
        document.removeEventListener('webkitfullscreenchange', redirectVideoFullscreen);
        video.removeEventListener('dblclick', onDblClick);
      };
    }, [showCustomControls]);

    useEffect(() => {
      const video = localRef.current;
      const trimmedSrc = src.trim();
      const mp4Fb = mp4FallbackUrl.trim();
      if (!video || !trimmedSrc) {
        setShowPlaybackSwitching(false);
        return;
      }

      setShowPlaybackSwitching(false);
      setQualityOptions(buildMergedQualityOptions([]));
      setSelectedQuality('auto');
      setAutoQualityEnabled(true);

      const notifyFatal = (reason: string, hlsDetails?: ErrorDetails) => {
        const hlsPart = hlsDetails != null ? ` hlsDetails=${String(hlsDetails)}` : '';
        console.error(`${LOG_PREFIX} Fatal playback reason=${reason}${hlsPart} src=${trimmedSrc}`);
        onFatalPlaybackErrorRef.current?.({ reason, hlsDetails });
      };

      const attachVideoErrorListener = (mode: HlsPlaybackMode | 'rejected-non-hls') => {
        const onVideoElementError = () => {
          logVideoElementError(video, mode);

          if (mode === 'hls-mse') {
            return;
          }

          if (mode === 'mp4-progressive') {
            const veMp4 = video.error;
            const c = veMp4?.code;
            if (!veMp4 || c === MediaError.MEDIA_ERR_ABORTED) {
              return;
            }
            notifyFatal(videoErrorMessage(c));
            return;
          }

          const ve = video.error;
          const code = ve?.code;

          if (mode === 'native-hls' && (code == null || code === 0)) {
            return;
          }

          notifyFatal(videoErrorMessage(code));
        };

        video.addEventListener('error', onVideoElementError);
        return () => video.removeEventListener('error', onVideoElementError);
      };

      const isHls = isHlsStreamUrl(trimmedSrc);
      const isMp4 = isMp4StreamUrl(trimmedSrc);

      if (!isHls && isMp4) {
        console.info(`${LOG_PREFIX} hybrid`, {
          playbackMode: 'mp4',
          fallbackTriggered: false,
          note: 'primary progressive',
        });
        const detach = attachVideoErrorListener('mp4-progressive');
        detachVideoSourceSoft(video);
        video.src = toProxiedLearnooHlsUrl(trimmedSrc);
        logVideoState(video, 'mp4 primary assign');
        return () => {
          detach();
          detachVideoSourceSoft(video);
        };
      }

      if (!isHls && !isMp4) {
        if (mp4Fb && isMp4StreamUrl(mp4Fb)) {
          console.warn(`${LOG_PREFIX} hybrid`, {
            playbackMode: 'mp4',
            fallbackTriggered: false,
            note: 'primary URL unrecognized; using mp4FallbackUrl only',
          });
          const detach = attachVideoErrorListener('mp4-progressive');
          detachVideoSourceSoft(video);
          video.src = toProxiedLearnooHlsUrl(mp4Fb);
          logVideoState(video, 'mp4-only-fallback assign');
          return () => {
            detach();
            detachVideoSourceSoft(video);
          };
        }
        console.error(`${LOG_PREFIX} unsupported source`, { src: trimmedSrc });
        const detachErr = attachVideoErrorListener('rejected-non-hls');
        notifyFatal('Video URL is not supported (expected HLS playlist or MP4).');
        return () => {
          detachErr();
          detachVideoSourceSoft(video);
        };
      }

      const apiMasterUrl = trimmedSrc;
      let manifestM3u8FallbackAttempted = false;
      const mseSupported = Hls.isSupported();
      const nativeAdvertised = canPlayNativeHls(video) || isLikelyAppleNativeHlsCapable();
      const iosDevice = isIOSDevice();

      // On iOS, ALWAYS prefer native HLS over MSE/hls.js:
      // 1. Safari's native HLS player is far more reliable than hls.js MSE on iOS.
      // 2. crossOrigin="anonymous" (needed for hls.js canvas capture) breaks native HLS entirely.
      // 3. The same-origin proxy now extracts the auth token from cookies server-side,
      //    so native HLS doesn't need JavaScript-injected Authorization headers.
      if (iosDevice && nativeAdvertised) {
        console.info(
          `${LOG_PREFIX} iOS detected — forcing native HLS (skipping MSE) | nativeAdvertised=${String(nativeAdvertised)} | mseSupported=${String(mseSupported)} | src=${apiMasterUrl}`
        );
        setUsingNativeHls(true);
        // Jump directly to the native HLS path below (skip the MSE block).
      } else if (mseSupported) {
        const masterUrl = toProxiedLearnooHlsUrl(apiMasterUrl);
        if (masterUrl !== apiMasterUrl) {
          console.info(`${LOG_PREFIX} same-origin HLS proxy (avoids CORS / XHR status 0)`, {
            api: apiMasterUrl,
            load: masterUrl,
          });
        }
        console.info(
          `${LOG_PREFIX} playbackMode=hls-mse | Hls.isSupported()=true (preferred over native) | nativeAdvertised=${String(nativeAdvertised)} | ABR startLevel=-1 | master=${masterUrl} | apiMaster=${apiMasterUrl}`
        );
        console.info(`${LOG_PREFIX} hybrid`, {
          playbackMode: 'hls',
          fallbackTriggered: false,
          mp4FallbackAvailable: Boolean(mp4Fb && isMp4StreamUrl(mp4Fb)),
        });

        const detachHlsUiError = attachVideoErrorListener('hls-mse');
        detachVideoSourceSoft(video);
        logVideoState(video, 'after soft reset (no load())');

        const userCfg = hlsConfigRef.current ?? {};
        const { xhrSetup: userXhrSetup, ...userCfgRest } = userCfg;

        const defaultConfig: Partial<HlsConfig> = {
          // Workers can break xhrSetup / debugging; keep off for reliable auth + logs.
          enableWorker: false,
          lowLatencyMode: false,
          startLevel: -1,
          capLevelToPlayerSize: true,
          maxBufferLength: 30,
          maxMaxBufferLength: 600,
          ...userCfgRest,
          xhrSetup(xhr, requestUrl) {
            userXhrSetup?.(xhr, requestUrl);
            const token = Cookies.get('token');
            const isKeyLike =
              /\/hls\/key\//i.test(requestUrl) ||
              /\/learnoo-origin\/hls\/key\//i.test(requestUrl) ||
              /\.key(\?|$)/i.test(requestUrl);
            if (isKeyLike) {
              console.info(`${LOG_PREFIX} XHR encryption key request`, {
                requestUrl,
                hasBearerToken: Boolean(token),
              });
            }
            if (!token) {
              console.warn(`${LOG_PREFIX} xhrSetup: Cookies.get('token') is empty — expect 401 on protected HLS`);
            } else {
              attachBearerForHlsXhr(xhr, requestUrl, masterUrl, token, apiMasterUrl);
            }
            const t0 = performance.now();
            xhr.addEventListener(
              'loadend',
              function xhrDebugLoadend() {
                xhr.removeEventListener('loadend', xhrDebugLoadend);
                const ct = xhr.getResponseHeader('Content-Type');
                const auth = xhr.getResponseHeader('Access-Control-Allow-Headers');
                const row: Record<string, unknown> = {
                  responseURL: xhr.responseURL || requestUrl,
                  status: xhr.status,
                  contentType: ct,
                  acAllowHeaders: auth,
                  ms: Math.round(performance.now() - t0),
                };
                if (isKeyLike) {
                  row.keyRequest = true;
                }
                console.info(`${LOG_PREFIX} XHR loadend`, row);
              },
              { once: true }
            );
          },
        };

        const hls = new Hls(defaultConfig);
        hlsInstanceRef.current = hls;
        setQualityOptions(buildMergedQualityOptions([]));
        setSelectedQuality('auto');
        setAutoQualityEnabled(true);
        let networkFatalRetries = 0;
        const maxNetworkFatalRetries = 3;
        let mediaRecoverAttempts = 0;
        const maxMediaRecoverAttempts = 2;
        let detachMp4Ui: (() => void) | null = null;
        let hlsToMp4Done = false;

        const attemptMp4Fallback = (reason: string): boolean => {
          if (hlsToMp4Done) return false;
          const fb = mp4Fb;
          if (!fb || !isMp4StreamUrl(fb)) return false;
          hlsToMp4Done = true;
          console.info(`${LOG_PREFIX} hybrid`, {
            playbackMode: 'mp4',
            fallbackTriggered: true,
            fallbackReason: reason,
            mp4Url: fb,
          });
          setShowPlaybackSwitching(true);
          detachHlsUiError();
          try {
            hlsInstanceRef.current?.destroy();
          } catch {
            /* ignore */
          }
          hlsInstanceRef.current = null;
          detachVideoSourceSoft(video);
          detachMp4Ui = attachVideoErrorListener('mp4-progressive');
          video.src = toProxiedLearnooHlsUrl(fb);
          logVideoState(video, 'after HLS→MP4 fallback assign');
          const clearSwitching = () => setShowPlaybackSwitching(false);
          video.addEventListener('loadeddata', clearSwitching, { once: true });
          video.addEventListener('error', clearSwitching, { once: true });
          return true;
        };

        hls.on(Events.MANIFEST_LOADING, (_, url) => {
          console.info(`${LOG_PREFIX} MANIFEST_LOADING`, { url: url ?? masterUrl });
          logVideoState(video, 'on MANIFEST_LOADING');
        });

        let manifestLoadedQualityParsed = false;

        hls.on(Events.MANIFEST_LOADED, async (_, data) => {
          const text = data.networkDetails?.response?.text;
          const preview =
            typeof text === 'string' ? `${text.slice(0, 120)}${text.length > 120 ? '…' : ''}` : '(no text)';
          console.info(`${LOG_PREFIX} MANIFEST_LOADED`, {
            url: data.url,
            stats: data.stats,
            textPreview: preview,
          });

          if (!manifestLoadedQualityParsed && typeof text === 'string') {
            const fallbackLevels = parseHlsQualityLevelsFromManifest(text);
            if (fallbackLevels.length > 0) {
              const merged = buildMergedQualityOptions(fallbackLevels);
              console.info(`${LOG_PREFIX} MANIFEST_LOADED quality fallback parsed`, { merged });
              setQualityOptions(merged);
              setAutoQualityEnabled(hls.autoLevelEnabled);
              manifestLoadedQualityParsed = true;
            }
          }
        });

        hls.on(Events.MANIFEST_PARSED, (_, data) => {
          console.info(`${LOG_PREFIX} MANIFEST_PARSED`, {
            levels: data.levels?.length,
            firstLevel: data.firstLevel,
            audioTracks: data.audioTracks?.length,
            subtitleTracks: data.subtitleTracks?.length,
          });

          const levels = data.levels ?? hls.levels ?? [];
          let rawLevels: Array<{ height?: number; bitrate?: number; index: number }> = levels.map(
            (level, index) => ({
              index,
              height: level.height,
              bitrate: level.bitrate,
            })
          );

          if (rawLevels.length === 0) {
            const networkDetails = (data as any).networkDetails;
            if (typeof networkDetails?.response?.text === 'string') {
              rawLevels = parseHlsQualityLevelsFromManifest(networkDetails.response.text);
            }
          }

          const merged = buildMergedQualityOptions(rawLevels);
          setQualityOptions(merged);
          setAutoQualityEnabled(hls.autoLevelEnabled);

          logVideoState(video, 'on MANIFEST_PARSED');
        });

        hls.on(Events.LEVEL_LOADED, (_, data) => {
          console.info(`${LOG_PREFIX} LEVEL_LOADED`, {
            level: data.level,
            url: data.details?.url ?? data.networkDetails?.url,
          });
        });

        hls.on(Events.LEVEL_SWITCHED, (_, data) => {
          const level = hls.levels[data.level];
          const isAuto = hls.autoLevelEnabled;
          setAutoQualityEnabled(isAuto);
          if (isAuto) {
            setSelectedQuality('auto');
          }
          console.info(`${LOG_PREFIX} LEVEL_SWITCHED (current ABR)`, {
            levelIndex: data.level,
            height: level?.height,
            bitrate: level?.bitrate,
            url: level?.url?.[0],
          });
        });

        hls.on(Events.FRAG_LOADING, (_, data) => {
          console.debug(`${LOG_PREFIX} FRAG_LOADING`, {
            sn: data.frag.sn,
            level: data.frag.level,
            url: data.frag.url,
          });
        });

        hls.on(Events.FRAG_LOADED, (_, data) => {
          console.info(`${LOG_PREFIX} FRAG_LOADED`, {
            sn: data.frag.sn,
            level: data.frag.level,
            url: data.frag.url,
          });
        });

        hls.on(Events.KEY_LOADING, (_, data) => {
          const decrypt = (data.frag as { decryptdata?: { uri?: string } }).decryptdata;
          console.info(`${LOG_PREFIX} KEY_LOADING`, {
            sn: data.frag.sn,
            fragUrl: data.frag.url,
            keyUri: decrypt?.uri,
          });
        });

        hls.on(Events.KEY_LOADED, (_, data) => {
          console.info(`${LOG_PREFIX} KEY_LOADED`, { sn: data.frag.sn, fragUrl: data.frag.url });
        });

        hls.on(Events.MEDIA_ATTACHED, () => {
          console.info(`${LOG_PREFIX} MEDIA_ATTACHED — scheduling loadSource()`, { masterUrl });
          logVideoState(video, 'on MEDIA_ATTACHED');
          hls.loadSource(masterUrl);
        });

        hls.on(Events.ERROR, (_, data) => {
          logHlsError(data, masterUrl);
          if (!data.fatal) {
            console.warn(`${LOG_PREFIX} Hls non-fatal ERROR`, {
              type: data.type,
              details: data.details,
              url: data.url,
            });
            return;
          }

          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            const http = (data.response as { code?: number } | undefined)?.code;

            if (
              (data.details === ErrorDetails.KEY_LOAD_ERROR || data.details === ErrorDetails.KEY_LOAD_TIMEOUT) &&
              (http === 401 || http === 403)
            ) {
              if (attemptMp4Fallback(`keyLoad_${String(http)}`)) return;
            }

            if (
              !manifestM3u8FallbackAttempted &&
              http === 404 &&
              data.details === ErrorDetails.MANIFEST_LOAD_ERROR
            ) {
              const alt = tryPlaylistM3u8FallbackUrl(trimmedSrc);
              const altProxied = alt ? toProxiedLearnooHlsUrl(alt) : null;
              if (alt && altProxied && altProxied !== masterUrl) {
                manifestM3u8FallbackAttempted = true;
                networkFatalRetries = 0;
                console.warn(`${LOG_PREFIX} MANIFEST 404 — retrying once with .m3u8 variant`, {
                  from: masterUrl,
                  to: altProxied,
                });
                hls.loadSource(altProxied);
                return;
              }
            }

            if (http === 404 && data.details === ErrorDetails.MANIFEST_LOAD_ERROR) {
              if (attemptMp4Fallback('manifest_404')) return;
            }

            if (networkFatalRetries < maxNetworkFatalRetries) {
              networkFatalRetries += 1;
              console.warn(
                `${LOG_PREFIX} Recovering NETWORK_ERROR (${String(networkFatalRetries)}/${String(maxNetworkFatalRetries)}) → startLoad()`
              );
              hls.startLoad();
              return;
            }

            if (attemptMp4Fallback(`network_fatal_${String(data.details)}_http_${String(http ?? 'na')}`)) {
              return;
            }

            notifyFatal(
              data.error?.message ?? 'Fatal network error after recovery attempts (check 401/CORS/MIME in Network tab).',
              data.details
            );
            hlsInstanceRef.current?.destroy();
            hlsInstanceRef.current = null;
            return;
          }

          if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            if (mediaRecoverAttempts < maxMediaRecoverAttempts) {
              mediaRecoverAttempts += 1;
              console.warn(
                `${LOG_PREFIX} Recovering MEDIA_ERROR (${String(mediaRecoverAttempts)}/${String(maxMediaRecoverAttempts)}) → recoverMediaError()`
              );
              hls.recoverMediaError();
              return;
            }
            if (attemptMp4Fallback(`media_error_${String(data.details)}`)) return;
            notifyFatal(data.error?.message ?? 'Fatal media error after recovery attempts', data.details);
            hlsInstanceRef.current?.destroy();
            hlsInstanceRef.current = null;
            return;
          }

          if (attemptMp4Fallback(`fatal_other_${String(data.type)}_${String(data.details)}`)) return;

          notifyFatal(data.error?.message ?? `Fatal HLS error (${data.type})`, data.details);
          hlsInstanceRef.current?.destroy();
          hlsInstanceRef.current = null;
        });

        hls.attachMedia(video);
        logVideoState(video, 'after attachMedia (before MEDIA_ATTACHED fires)');

        return () => {
          detachHlsUiError();
          detachMp4Ui?.();
          try {
            hlsInstanceRef.current?.destroy();
          } catch {
            /* ignore */
          }
          hlsInstanceRef.current = null;
          detachVideoSourceSoft(video);
          setShowPlaybackSwitching(false);
          logVideoState(video, 'after cleanup');
        };
      }

      if (nativeAdvertised) {
        const isIOS = iosDevice;
        console.info(
          `${LOG_PREFIX} playbackMode=native-hls | Hls.isSupported()=${String(mseSupported)} | iOS=${String(isIOS)} | src=${apiMasterUrl}`
        );
        setUsingNativeHls(true);
        logVideoState(video, 'before native assign');
        let detachMp4Native: (() => void) | null = null;
        let nativeErrorFallbackDone = false;
        const onNativeError = () => {
          if (nativeErrorFallbackDone) return;
          logVideoElementError(video, 'native-hls');
          const ve = video.error;
          const code = ve?.code;
          if (code == null || code === 0 || code === MediaError.MEDIA_ERR_ABORTED) {
            return;
          }
          nativeErrorFallbackDone = true;
          if (mp4Fb && isMp4StreamUrl(mp4Fb)) {
            console.warn(`${LOG_PREFIX} native HLS failed; falling back to MP4 progressive`, { mp4Fb });
            setShowPlaybackSwitching(true);
            detachVideoSourceSoft(video);
            detachMp4Native = attachVideoErrorListener('mp4-progressive');
            video.src = toProxiedLearnooHlsUrl(mp4Fb);
            video.load();
            const clearSwitching = () => setShowPlaybackSwitching(false);
            video.addEventListener('loadeddata', clearSwitching, { once: true });
            video.addEventListener('error', clearSwitching, { once: true });
            return;
          }
          notifyFatal(videoErrorMessage(code));
        };

        const cookieToken = Cookies.get('token');
        video.addEventListener('error', onNativeError);
        const nativeUrl = toProxiedLearnooHlsUrl(apiMasterUrl, cookieToken);
        console.info(`${LOG_PREFIX} native HLS: setting video.src`, { nativeUrl, apiMasterUrl });
        detachVideoSourceSoft(video);
        video.src = nativeUrl;
        // On iOS Safari, explicitly calling load() after setting src is required
        // for reliable playback start — without it the player can stall silently.
        video.load();
        logVideoState(video, 'after native assign + load()');
        return () => {
          video.removeEventListener('error', onNativeError);
          detachMp4Native?.();
          detachVideoSourceSoft(video);
        };
      }

      console.error(
        `${LOG_PREFIX} playbackMode=unsupported-hls | Hls.isSupported()=false and native HLS unavailable. src=${apiMasterUrl}`
      );
      if (mp4Fb && isMp4StreamUrl(mp4Fb)) {
        console.info(`${LOG_PREFIX} hybrid`, {
          playbackMode: 'mp4',
          fallbackTriggered: false,
          note: 'no HLS in browser; using MP4 progressive',
        });
        const detach = attachVideoErrorListener('mp4-progressive');
        detachVideoSourceSoft(video);
        video.src = toProxiedLearnooHlsUrl(mp4Fb);
        logVideoState(video, 'mp4 assign (no HLS support in browser)');
        return () => {
          detach();
          detachVideoSourceSoft(video);
        };
      }
      const detachErrorUnsupported = attachVideoErrorListener('unsupported-hls');
      notifyFatal('HLS is not supported in this browser (no Media Source Extensions and no native HLS).');
      return () => {
        detachErrorUnsupported();
      };
    }, [src, mp4FallbackUrl, switchingPlaybackLabel]);

    const hasWatchPanel = Boolean(watchPanel);
    const viewportClass =
      className?.replace(/\bflex-1\b/g, '').trim() || 'aspect-video w-full max-w-full';

    const videoStageGrid = (
      <div className="relative grid h-full min-h-0  min-w-0 grid-cols-1 grid-rows-1">
        <div
          className="col-start-1 row-start-1 relative z-0 flex min-h-0 min-w-0 max-h-full max-w-full items-center justify-center"
          onClick={showCustomControls ? onVideoSurfaceClick : undefined}
        >
          {/* crossOrigin="anonymous" is needed for canvas frame-capture (discussion screenshots)
              but MUST be omitted on iOS native HLS — it completely breaks Safari's internal
              HLS player and causes "internet connection" errors. */}
          <video
            id={id}
            ref={setRefs}
            className="relative z-0 h-full w-full min-h-0 max-h-full max-w-full object-contain"
            controls={nativeVideoControls}
            controlsList={showCustomControls ? 'nofullscreen nodownload noremoteplayback' : undefined}
            disablePictureInPicture={showCustomControls}
            playsInline={playsInline}
            {...({ 'webkit-playsinline': 'true' } as any)}
            preload={preload}
            autoPlay={autoPlay}
            muted={muted}
            poster={poster}
            {...(usingNativeHls ? {} : { crossOrigin: 'anonymous' as const })}
          >
            {children}
          </video>
        </div>
        {showWatermark ? (
          <div className="pointer-events-none absolute inset-0 z-20 col-start-1 row-start-1 overflow-hidden">
            <VideoWatermark
              videoRef={localRef}
              contentType={watermarkContentType}
              showWatermark={showWatermark}
              initialResolution={initialWatermarkResolution}
            />
          </div>
        ) : null}
        {showStaticStudentOverlay ? (
          <StudentVideoStaticOverlay subtitle={staticOverlaySubtitle} />
        ) : null}
        {showPlaybackSwitching ? (
          <div
            className="pointer-events-none col-start-1 row-start-1 z-[55] flex items-center justify-center self-stretch justify-self-stretch bg-black/65 px-4"
            role="status"
            aria-live="polite"
          >
            <span className="max-w-sm text-center text-sm font-medium text-white">
              {switchingPlaybackLabel ?? 'Switching playback method…'}
            </span>
          </div>
        ) : null}
        {watchOverlay ? (
          <div className="pointer-events-none absolute inset-x-0 top-2 z-50 col-start-1 row-start-1 hidden justify-end px-3 sm:flex [&:fullscreen]:flex">
            <div className="pointer-events-auto">{watchOverlay}</div>
          </div>
        ) : null}
      </div>
    );

    const wrapperClass = showCustomControls
      ? [
        'relative flex min-h-0 min-w-0 w-full overflow-hidden bg-black',
        hasWatchPanel ? 'flex-row items-stretch gap-0' : 'flex-col',
        '[&:fullscreen]:flex [&:fullscreen]:h-full [&:fullscreen]:max-h-none [&:fullscreen]:w-full',
        hasWatchPanel ? '[&:fullscreen]:flex-row [&:fullscreen]:items-stretch' : '',
      ]
        .filter(Boolean)
        .join(' ')
      : `relative overflow-hidden bg-black ${viewportClass}`;

    const videoColumn = (
      <div
        className={[
          'relative flex min-w-0 flex-col',
          hasWatchPanel
            ? 'w-1/2 min-w-0 flex-[1_1_50%] basis-1/2'
            : 'w-full min-h-0 flex-1',
          '[&:fullscreen]:min-w-0 [&:fullscreen]:w-1/2 [&:fullscreen]:flex-[1_1_50%] [&:fullscreen]:basis-1/2',
        ].join(' ')}
      >
        <div
          className={`group relative w-full shrink-0 overflow-visible bg-black ${viewportClass}`}
          onMouseMove={revealControls}
          onMouseEnter={revealControls}
          onTouchStart={revealControls}
        >
          {videoStageGrid}
          {showCustomControls ? (
            <HlsVideoCustomControls
              visible={showControls}
              videoRef={localRef}
              shellRef={videoWrapperRef}
              qualityOptions={qualityOptions}
              qualityValue={selectedQuality}
              onQualityChange={setQualityLevel}
              endAction={watchOverlay}
              onPrevChapter={onPrevChapter}
              onNextChapter={onNextChapter}
              canPrevChapter={canPrevChapter}
              canNextChapter={canNextChapter}
              chapterInfoTitle={chapterInfoTitle}
              theaterMode={theaterMode}
              onToggleTheater={onToggleTheater}
            />
          ) : null}
        </div>

      </div>
    );

    return (
      <div ref={videoWrapperRef} className={wrapperClass}>
        {videoColumn}
        {watchPanel ? (
          <div className="watch-pdf-shell relative z-40 flex aspect-video min-h-0 w-1/2 min-w-0 flex-[1_1_50%] basis-1/2 flex-col overflow-hidden border-s border-slate-600/90 bg-[#f1f5f9] [&:fullscreen]:h-full [&:fullscreen]:max-h-none [&:fullscreen]:min-h-0 [&:fullscreen]:min-w-0 [&:fullscreen]:w-1/2 [&:fullscreen]:flex-[1_1_50%] [&:fullscreen]:basis-1/2 [&:fullscreen]:border-t-0 [&:fullscreen]:border-s [&_.watch-pdf-scroll]:min-h-0 [&_.watch-pdf-scroll]:flex-1 [&_.watch-pdf-scroll]:overflow-y-auto">
            {watchPanel}
          </div>
        ) : null}
      </div>
    );
  }
);

HlsVideoPlayer.displayName = 'HlsVideoPlayer';

export { isHlsStreamUrl, isMp4StreamUrl } from '@/src/lib/video-stream-detect';
