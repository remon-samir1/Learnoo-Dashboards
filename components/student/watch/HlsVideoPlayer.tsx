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

    console.error(`${LOG_PREFIX} Hls.Events.ERROR ${summary}`);
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
      },
      forwardedRef
    ) {
      const localRef = useRef<HTMLVideoElement | null>(null);
      const playerShellRef = useRef<HTMLDivElement | null>(null);
      const watermarkPortalMountRef = useRef<HTMLDivElement | null>(null);
      const [showPlaybackSwitching, setShowPlaybackSwitching] = useState(false);
      const onFatalPlaybackErrorRef = useRef(onFatalPlaybackError);
      const hlsConfigRef = useRef(hlsConfig);

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

      const onVideoSurfaceClick = useCallback(() => {
        if (!showCustomControls) return;
        const v = localRef.current;
        if (!v) return;
        if (v.paused) void v.play().catch(() => {});
        else v.pause();
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
          video.src = trimmedSrc;
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
            video.src = mp4Fb;
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

        // Prefer MSE whenever hls.js can run. Chromium often reports canPlayType("…mpegurl") as
        // "maybe" but native <video src> still fails (e.g. MEDIA_ERR_SRC_NOT_SUPPORTED on URLs
        // without .m3u8). Native also cannot attach Authorization on segment requests.
        if (mseSupported) {
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
        const hlsInstanceRef: { current: Hls | null } = { current: hls };
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
          video.src = fb;
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

        hls.on(Events.MANIFEST_LOADED, (_, data) => {
          const text = data.networkDetails?.response?.text;
          const preview =
            typeof text === 'string' ? `${text.slice(0, 120)}${text.length > 120 ? '…' : ''}` : '(no text)';
          console.info(`${LOG_PREFIX} MANIFEST_LOADED`, {
            url: data.url,
            stats: data.stats,
            textPreview: preview,
          });
        });

        hls.on(Events.MANIFEST_PARSED, (_, data) => {
          console.info(`${LOG_PREFIX} MANIFEST_PARSED`, {
            levels: data.levels?.length,
            firstLevel: data.firstLevel,
            audioTracks: data.audioTracks?.length,
            subtitleTracks: data.subtitleTracks?.length,
          });
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
          console.info(
            `${LOG_PREFIX} playbackMode=native-hls (fallback: no MSE) | Hls.isSupported()=false | src=${apiMasterUrl}`
          );
          logVideoState(video, 'before native assign');
          const detachError = attachVideoErrorListener('native-hls');
          video.src = apiMasterUrl;
          logVideoState(video, 'after native assign');
          return () => {
            detachError();
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
          video.src = mp4Fb;
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

      const stageShellClass = className ? `relative min-h-0 min-w-0 ${className}` : 'relative min-h-0 min-w-0';

      const videoStageGrid = (
        <div className="relative grid min-h-0 min-w-0 grid-cols-1 grid-rows-1">
          <div
            className="col-start-1 row-start-1 relative z-0 flex min-h-0 min-w-0 max-h-full max-w-full items-center justify-center"
            onClick={showCustomControls ? onVideoSurfaceClick : undefined}
          >
            <video
              id={id}
              ref={setRefs}
              className="relative z-0 h-full w-full min-h-0 max-h-full max-w-full object-contain"
              controls={nativeVideoControls}
              controlsList={showCustomControls ? 'nofullscreen nodownload noremoteplayback' : undefined}
              disablePictureInPicture={showCustomControls}
              playsInline={playsInline}
              preload={preload}
              autoPlay={autoPlay}
              muted={muted}
              poster={poster}
            >
              {children}
            </video>
          </div>
          <div
            ref={watermarkPortalMountRef}
            className="pointer-events-none absolute inset-0 z-[12] col-start-1 row-start-1 overflow-visible"
            aria-hidden
          />
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
        </div>
      );

      return (
        <>
          {showCustomControls ? (
            <div ref={playerShellRef} className="relative flex min-h-0 min-w-0 w-full flex-col">
              <div className={stageShellClass}>{videoStageGrid}</div>
              <HlsVideoCustomControls videoRef={localRef} shellRef={playerShellRef} />
            </div>
          ) : (
            <div ref={playerShellRef} className={stageShellClass}>
              {videoStageGrid}
            </div>
          )}
          <VideoWatermark
            videoRef={localRef}
            shellRef={playerShellRef}
            portalMountRef={watermarkPortalMountRef}
            contentType={watermarkContentType}
            showWatermark={showWatermark}
            initialResolution={initialWatermarkResolution}
          />
          
        </>
      );
    }
  );

  HlsVideoPlayer.displayName = 'HlsVideoPlayer';

  export { isHlsStreamUrl, isMp4StreamUrl } from '@/src/lib/video-stream-detect';
