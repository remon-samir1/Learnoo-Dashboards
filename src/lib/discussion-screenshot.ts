/**
 * Discussion Screenshot Capture — fully automatic, no manual fallback.
 *
 * LEVEL 1  — real video frame via canvas.drawImage(video), synchronized with
 *            requestVideoFrameCallback when available.
 * LEVEL 1B — bounded retries (0/100/250/500/1000ms) with multiple strategies:
 *            tiny probe canvas to test readability, fresh canvas per attempt,
 *            OffscreenCanvas when supported, media-event / rAF waits.
 * LEVEL 2  — player component capture via html2canvas (short timeout on iOS,
 *            never skipped by platform).
 * LEVEL 3  — synthetic branded snapshot drawn with the plain 2D canvas API,
 *            so it works even when html2canvas is unavailable. Embeds the
 *            chapter thumbnail only when it can be loaded CORS-safely.
 *
 * There is no LEVEL 4. The user is never asked to attach a screenshot.
 */

import { isIOSDevice } from '@/src/lib/video-stream-detect';

/* ------------------------------------------------------------------ */
/*  Logging (development only — no console spam in production)         */
/* ------------------------------------------------------------------ */

const DEV = process.env.NODE_ENV === 'development';
const TAG = '[DiscussionCapture]';

function dlog(...args: unknown[]): void {
  if (DEV) console.info(TAG, ...args);
}
function dwarn(...args: unknown[]): void {
  if (DEV) console.warn(TAG, ...args);
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type ScreenshotFailureReason =
  | 'no_blob'
  | 'invalid_dimensions'
  | 'image_load_failed'
  | 'blank_image'
  | 'transparent_image'
  | 'capture_error';

export type ScreenshotValidationResult =
  | { valid: true; reason: null }
  | { valid: false; reason: ScreenshotFailureReason };

export type DiscussionCaptureSource =
  | 'video-frame'
  | 'video-frame-retry'
  | 'video-component'
  | 'synthetic'
  | null;

export interface DiscussionCaptureResult {
  success: boolean;
  source: DiscussionCaptureSource;
  blob?: Blob;
  /** Convenience wrapper around `blob` ready for FormData upload. */
  file?: File;
  /** The video moment (seconds) this capture represents. */
  timestamp: number;
  reason?: string;
}

export interface DiscussionCaptureContext {
  video: HTMLVideoElement | null;
  /** Player wrapper element for LEVEL 2 component capture. */
  container: HTMLElement | null;
  /**
   * The exact video moment to represent, snapshotted once by the caller at
   * click time. Retries must not drift it. Falls back to video.currentTime.
   */
  timestamp?: number;
  /** For the LEVEL 3 synthetic snapshot. */
  courseTitle?: string;
  chapterTitle?: string;
  /** Chapter thumbnail; embedded only if it loads with CORS enabled. */
  thumbnailUrl?: string | null;
  locale?: string;
}

/* ------------------------------------------------------------------ */
/*  Image Validation                                                   */
/* ------------------------------------------------------------------ */

/**
 * Minimum byte-size for a valid JPEG. A blank 1×1 JPEG is ~600 bytes.
 * A real video frame at ≥320×180 will always exceed this.
 */
const MIN_BLOB_SIZE = 2_000;

/**
 * Sample a grid of pixels across the image and compute variance to detect
 * blank / single-colour images.
 *
 * We sample a 12×12 grid (144 points, covering corners / 25% / 50% / 75%
 * positions). For each pixel we compute luminance Y = 0.299R+0.587G+0.114B
 * and analyse both the whole image and the centre 50% region (where video
 * content lives, away from watermark/UI badges).
 *
 * Thresholds are deliberately tolerant of dark scenes: a very dark movie
 * frame still has luminance SD ≈ 5–30 from compression noise and gradients,
 * while a truly blank/black canvas has SD ≈ 0.
 */
function analysePixelVariance(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): { blank: boolean; transparent: boolean; luminanceSD: number; alphaRatio: number } {
  const GRID = 12;
  const stepX = Math.max(1, Math.floor(width / GRID));
  const stepY = Math.max(1, Math.floor(height / GRID));
  const luminances: number[] = [];
  const centerLuminances: number[] = [];
  let transparentCount = 0;
  let totalSamples = 0;
  let centerSamples = 0;
  let overallMax = 0;
  let centerMax = 0;

  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      const x = Math.min(gx * stepX + Math.floor(stepX / 2), width - 1);
      const y = Math.min(gy * stepY + Math.floor(stepY / 2), height - 1);
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const r = pixel[0];
      const g = pixel[1];
      const b = pixel[2];
      const a = pixel[3];
      totalSamples++;
      if (a < 10) {
        transparentCount++;
      }
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      luminances.push(lum);
      if (lum > overallMax) overallMax = lum;

      // Centre 50% region (video content, away from badges/overlays)
      if (gx >= 3 && gx <= 8 && gy >= 3 && gy <= 8) {
        centerSamples++;
        centerLuminances.push(lum);
        if (lum > centerMax) centerMax = lum;
      }
    }
  }

  const n = luminances.length;
  if (n === 0) return { blank: true, transparent: true, luminanceSD: 0, alphaRatio: 1 };

  const mean = luminances.reduce((s, v) => s + v, 0) / n;
  const variance = luminances.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const sd = Math.sqrt(variance);
  const alphaRatio = totalSamples > 0 ? transparentCount / totalSamples : 0;

  let centerSD = 0;
  let cMean = 0;
  if (centerLuminances.length > 0) {
    cMean = centerLuminances.reduce((s, v) => s + v, 0) / centerLuminances.length;
    const cVar =
      centerLuminances.reduce((s, v) => s + (v - cMean) ** 2, 0) / centerLuminances.length;
    centerSD = Math.sqrt(cVar);
  }

  // Detect black / unrendered / blank images:
  // 1. Overall image essentially pitch black
  // 2. Centre video area black/empty — catches Level 1 black frames AND
  //    Level 2 html2canvas captures where the video box rendered black even
  //    though surrounding UI (badges, controls) has text.
  // 3. Entire image uniform/flat
  // 4. Centre area flat and dark
  const isEssentiallyBlack = mean < 15 || overallMax < 28;
  const isCenterBlackOrEmpty =
    centerSamples > 0 && (cMean < 18 || centerMax < 35 || (centerSD < 2.0 && cMean < 40));
  const isUniformFlat = sd < 2.0;

  return {
    blank: isEssentiallyBlack || isCenterBlackOrEmpty || isUniformFlat,
    transparent: alphaRatio > 0.8,
    luminanceSD: sd,
    alphaRatio,
  };
}

/**
 * Validate a screenshot blob: rejects null/empty/tiny blobs, zero dimensions,
 * corrupted images, transparent output, and blank/black canvases via pixel
 * sampling. Dark-but-real video frames pass (variance-based threshold).
 */
export async function validateScreenshot(blob: Blob | null): Promise<ScreenshotValidationResult> {
  if (!blob || blob.size === 0) {
    return { valid: false, reason: 'no_blob' };
  }
  if (blob.size < MIN_BLOB_SIZE) {
    return { valid: false, reason: 'blank_image' };
  }

  let img: HTMLImageElement;
  let objectUrl: string | null = null;
  try {
    objectUrl = URL.createObjectURL(blob);
    img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('image_load_failed'));
      image.src = objectUrl!;
    });
  } catch {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    return { valid: false, reason: 'image_load_failed' };
  }

  try {
    if (img.width === 0 || img.height === 0) {
      return { valid: false, reason: 'invalid_dimensions' };
    }

    // Draw onto a small canvas for pixel analysis (cap at 200×200 for perf)
    const analysisMax = 200;
    let aw = img.width;
    let ah = img.height;
    if (aw > analysisMax || ah > analysisMax) {
      const scale = analysisMax / Math.max(aw, ah);
      aw = Math.round(aw * scale);
      ah = Math.round(ah * scale);
    }

    const canvas = document.createElement('canvas');
    canvas.width = aw;
    canvas.height = ah;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      // Cannot create canvas context — give benefit of doubt
      return { valid: true, reason: null };
    }
    ctx.drawImage(img, 0, 0, aw, ah);

    const analysis = analysePixelVariance(ctx, aw, ah);

    if (analysis.transparent) {
      return { valid: false, reason: 'transparent_image' };
    }
    if (analysis.blank) {
      return { valid: false, reason: 'blank_image' };
    }

    return { valid: true, reason: null };
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

/* ------------------------------------------------------------------ */
/*  Shared canvas helpers                                              */
/* ------------------------------------------------------------------ */

/** Cap capture dimensions to prevent iOS Safari canvas memory issues. */
const MAX_CAPTURE_DIM = 1280;

function fitWithin(w: number, h: number, max: number): { w: number; h: number } {
  if (w <= max && h <= max) return { w, h };
  if (w >= h) return { w: max, h: Math.round((h * max) / w) };
  return { w: Math.round((w * max) / h), h: max };
}

function domCanvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise<Blob | null>((resolve) => {
    try {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.85);
    } catch {
      // SecurityError from a tainted canvas surfaces here in some browsers
      resolve(null);
    }
  });
}

/* ------------------------------------------------------------------ */
/*  LEVEL 1 — real video frame                                         */
/* ------------------------------------------------------------------ */

const HAVE_CURRENT_DATA = 2;

interface FrameAttemptResult {
  blob: Blob | null;
  tainted: boolean;
  reason?: string;
}

function logVideoDiagnostics(video: HTMLVideoElement): void {
  if (!DEV) return;
  console.info(`${TAG} CORS state`, video.crossOrigin ?? '(not set)');
  console.info(`${TAG} currentSrc`, video.currentSrc);
  console.info(`${TAG} readyState`, video.readyState);
  console.info(`${TAG} videoWidth`, video.videoWidth);
  console.info(`${TAG} videoHeight`, video.videoHeight);
  console.info(`${TAG} state`, {
    currentTime: video.currentTime,
    paused: video.paused,
    seeking: video.seeking,
    networkState: video.networkState,
  });
}

/**
 * One bounded attempt at drawing a real video frame.
 *
 * Strategy D: an 8×8 probe canvas first — drawImage + getImageData is the
 * cheapest reliable taint test (a tainted canvas throws SecurityError on
 * read). Only if readable do we pay for the full-size draw.
 * Strategy E/F: OffscreenCanvas when supported, DOM canvas otherwise.
 * Strategy G: every attempt uses freshly created canvases.
 */
async function attemptVideoFrame(video: HTMLVideoElement): Promise<FrameAttemptResult> {
  if (video.videoWidth === 0 || video.videoHeight === 0) {
    return { blob: null, tainted: false, reason: 'no_dimensions' };
  }
  if (video.readyState < HAVE_CURRENT_DATA) {
    return { blob: null, tainted: false, reason: 'not_ready' };
  }
  if (video.seeking) {
    return { blob: null, tainted: false, reason: 'seeking' };
  }

  try {
    // Strategy D — tiny probe: readability / taint test before full draw
    const probe = document.createElement('canvas');
    probe.width = 8;
    probe.height = 8;
    const probeCtx = probe.getContext('2d');
    if (!probeCtx) return { blob: null, tainted: false, reason: 'no_context' };
    probeCtx.drawImage(video, 0, 0, 8, 8);
    try {
      probeCtx.getImageData(0, 0, 1, 1);
    } catch {
      return { blob: null, tainted: true, reason: 'tainted_canvas' };
    }

    const { w, h } = fitWithin(video.videoWidth, video.videoHeight, MAX_CAPTURE_DIM);

    // Strategy E — OffscreenCanvas when supported (keeps main DOM untouched)
    if (typeof OffscreenCanvas !== 'undefined') {
      try {
        const off = new OffscreenCanvas(w, h);
        const offCtx = off.getContext('2d');
        if (offCtx) {
          offCtx.drawImage(video, 0, 0, w, h);
          const blob = await off.convertToBlob({ type: 'image/jpeg', quality: 0.85 });
          if (blob) return { blob, tainted: false };
        }
      } catch (err) {
        if ((err as DOMException | undefined)?.name === 'SecurityError') {
          return { blob: null, tainted: true, reason: 'tainted_canvas' };
        }
        dwarn('OffscreenCanvas attempt failed, falling back to DOM canvas', err);
      }
    }

    // Strategy F/G — a fresh DOM canvas per attempt
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { blob: null, tainted: false, reason: 'no_context' };
    ctx.drawImage(video, 0, 0, w, h);
    const blob = await domCanvasToBlob(canvas);
    if (!blob) return { blob: null, tainted: false, reason: 'to_blob_null' };
    return { blob, tainted: false };
  } catch (err) {
    if ((err as DOMException | undefined)?.name === 'SecurityError') {
      return { blob: null, tainted: true, reason: 'security_error' };
    }
    dwarn('video frame attempt error', err);
    return { blob: null, tainted: false, reason: 'draw_error' };
  }
}

/**
 * Wait for the next paintable frame, bounded by `timeoutMs`.
 *
 * Strategy B: requestVideoFrameCallback when available — fires exactly when
 * a new frame is presented. Strategy C: media events (loadeddata / canplay /
 * seeked / timeupdate) plus a rAF readyState check as fallbacks. Whichever
 * fires first wins; the timeout guarantees the wait is bounded.
 */
function waitForPaintableFrame(video: HTMLVideoElement, timeoutMs: number): Promise<void> {
  return new Promise<void>((resolve) => {
    let settled = false;
    const events = ['loadeddata', 'canplay', 'seeked', 'timeupdate'] as const;
    let rvfcId: number | null = null;
    let rafId: number | null = null;

    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      events.forEach((ev) => video.removeEventListener(ev, finish));
      const v = video as HTMLVideoElement & {
        cancelVideoFrameCallback?: (handle: number) => void;
      };
      if (rvfcId != null && typeof v.cancelVideoFrameCallback === 'function') {
        v.cancelVideoFrameCallback(rvfcId);
      }
      if (rafId != null) cancelAnimationFrame(rafId);
      resolve();
    };

    const timer = setTimeout(finish, Math.max(0, timeoutMs));

    const v = video as HTMLVideoElement & {
      requestVideoFrameCallback?: (cb: () => void) => number;
    };
    if (typeof v.requestVideoFrameCallback === 'function') {
      rvfcId = v.requestVideoFrameCallback(() => finish());
    } else {
      const rafCheck = () => {
        if (settled) return;
        if (video.readyState >= HAVE_CURRENT_DATA && !video.seeking) {
          finish();
        } else {
          rafId = requestAnimationFrame(rafCheck);
        }
      };
      rafId = requestAnimationFrame(rafCheck);
    }
    events.forEach((ev) => video.addEventListener(ev, finish));
  });
}

/** Bounded retry schedule (LEVEL 1B). Total wait budget ≈ 1.85s, hard cap 2s. */
const RETRY_DELAYS_MS = [0, 100, 250, 500, 1000];
const LEVEL1_BUDGET_MS = 2_000;

interface RealFrameResult {
  blob: Blob | null;
  retried: boolean;
  tainted: boolean;
  lastReason?: string;
}

async function captureRealFrameWithRetry(video: HTMLVideoElement): Promise<RealFrameResult> {
  const deadline = performance.now() + LEVEL1_BUDGET_MS;
  let lastReason: string | undefined;

  for (let i = 0; i < RETRY_DELAYS_MS.length; i++) {
    const remaining = deadline - performance.now();
    if (remaining <= 0) break;
    if (i > 0) {
      dlog('retry', `attempt ${i + 1} after up to ${RETRY_DELAYS_MS[i]}ms`);
      await waitForPaintableFrame(video, Math.min(RETRY_DELAYS_MS[i], remaining));
    }

    dlog('video frame attempt', i + 1);
    const attempt = await attemptVideoFrame(video);

    if (attempt.tainted) {
      // A tainted canvas cannot be untainted by retrying — the source itself
      // is cross-origin without CORS. Fail fast to LEVEL 2.
      dlog('canvas security error', '(tainted — stopping LEVEL 1 retries)');
      return { blob: null, retried: i > 0, tainted: true, lastReason: attempt.reason };
    }

    if (attempt.blob) {
      const validation = await validateScreenshot(attempt.blob);
      if (validation.valid) {
        return { blob: attempt.blob, retried: i > 0, tainted: false };
      }
      lastReason = validation.reason ?? undefined;
      dlog('video frame attempt produced invalid image', validation.reason);
    } else {
      lastReason = attempt.reason;
    }
  }

  return { blob: null, retried: true, tainted: false, lastReason };
}

/* ------------------------------------------------------------------ */
/*  LEVEL 2 — player component capture                                 */
/* ------------------------------------------------------------------ */

/**
 * html2canvas time budget. Short on iOS (it renders slowly there and its
 * output for a native-HLS video box is usually rejected anyway); moderate
 * elsewhere. Never platform-disabled — iOS still gets a real attempt.
 */
function level2TimeoutMs(): number {
  return isIOSDevice() ? 1_000 : 4_000;
}

async function captureComponentScreenshot(
  element: HTMLElement,
  timeoutMs: number
): Promise<Blob | null> {
  try {
    // Dynamic import — only loads when LEVEL 2 is actually needed
    const html2canvas = (await import('html2canvas')).default;

    const canvas = await Promise.race([
      html2canvas(element, {
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#0b1426',
        // Limit scale to prevent memory issues on mobile devices
        scale: Math.min(window.devicePixelRatio || 1, 2),
        logging: false,
      }),
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), timeoutMs);
      }),
    ]);

    if (!canvas) {
      dwarn('component capture timed out', `${timeoutMs}ms`);
      return null;
    }
    return await domCanvasToBlob(canvas);
  } catch (err) {
    dwarn('component capture error', err);
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  LEVEL 3 — synthetic discussion snapshot                            */
/* ------------------------------------------------------------------ */

/**
 * Try to load an image with CORS enabled. With `crossOrigin = 'anonymous'`
 * a missing CORS header fails the LOAD (onerror) rather than tainting the
 * canvas, so a resolved image here is always safe to draw. Bounded.
 */
function loadCorsSafeImage(url: string, timeoutMs: number): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (img: HTMLImageElement | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(img);
    };
    const timer = setTimeout(() => finish(null), timeoutMs);
    try {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => finish(img);
      img.onerror = () => finish(null);
      img.src = url;
    } catch {
      finish(null);
    }
  });
}

function truncateToWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) {
    t = t.slice(0, -1);
  }
  return `${t}…`;
}

function formatSyntheticTime(sec: number): string {
  const safe = Number.isFinite(sec) && sec >= 0 ? sec : 0;
  const m = Math.floor(safe / 60);
  const s = Math.floor(safe % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Draw a professional-looking branded snapshot card entirely with the 2D
 * canvas API — no html2canvas dependency, so this level cannot fail on
 * library availability. Optionally uses a CORS-safe chapter thumbnail as a
 * dimmed backdrop.
 */
async function createSyntheticSnapshot(opts: {
  courseTitle?: string;
  chapterTitle?: string;
  timestamp: number;
  thumbnailUrl?: string | null;
  locale?: string;
}): Promise<Blob | null> {
  const W = 1280;
  const H = 720;
  const isAr = opts.locale === 'ar';

  const draw = (thumb: HTMLImageElement | null): HTMLCanvasElement | null => {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Background — brand dark gradient
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#0b1426');
    grad.addColorStop(1, '#131f3d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Optional dimmed thumbnail backdrop (cover fit)
    if (thumb && thumb.width > 0 && thumb.height > 0) {
      const scale = Math.max(W / thumb.width, H / thumb.height);
      const dw = thumb.width * scale;
      const dh = thumb.height * scale;
      ctx.drawImage(thumb, (W - dw) / 2, (H - dh) / 2, dw, dh);
      ctx.fillStyle = 'rgba(7, 13, 24, 0.82)';
      ctx.fillRect(0, 0, W, H);
    }

    // Card frame
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(48, 48, W - 96, H - 96);

    // Accent bar
    ctx.fillStyle = '#2D43D1';
    ctx.fillRect(48, 48, W - 96, 8);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Brand
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px system-ui, -apple-system, "Segoe UI", sans-serif';
    ctx.fillText('LEARNOO', W / 2, 160);

    // Course title
    const maxTextWidth = W - 240;
    if (opts.courseTitle?.trim()) {
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '500 34px system-ui, -apple-system, "Segoe UI", sans-serif';
      ctx.fillText(truncateToWidth(ctx, opts.courseTitle.trim(), maxTextWidth), W / 2, 260);
    }

    // Chapter title
    if (opts.chapterTitle?.trim()) {
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '600 40px system-ui, -apple-system, "Segoe UI", sans-serif';
      const chapterLabel = isAr ? 'الفصل: ' : 'Chapter: ';
      ctx.fillText(
        truncateToWidth(ctx, `${chapterLabel}${opts.chapterTitle.trim()}`, maxTextWidth),
        W / 2,
        330
      );
    }

    // Big timestamp
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 120px system-ui, -apple-system, "Segoe UI", sans-serif';
    ctx.fillText(formatSyntheticTime(opts.timestamp), W / 2, 460);

    // Label
    ctx.fillStyle = '#93B4FF';
    ctx.font = '600 32px system-ui, -apple-system, "Segoe UI", sans-serif';
    ctx.fillText(isAr ? 'لحظة النقاش' : 'Discussion Moment', W / 2, 570);

    return canvas;
  };

  let thumb: HTMLImageElement | null = null;
  if (opts.thumbnailUrl?.trim()) {
    thumb = await loadCorsSafeImage(opts.thumbnailUrl.trim(), 1_200);
    dlog('synthetic snapshot', thumb ? 'thumbnail embedded' : 'thumbnail unavailable (skipped)');
  }

  try {
    let canvas = draw(thumb);
    if (!canvas) return null;
    let blob = await domCanvasToBlob(canvas);
    if (!blob && thumb) {
      // Extremely defensive: if the thumbnail somehow tainted the canvas,
      // redraw without it. (Should not happen with crossOrigin loading.)
      canvas = draw(null);
      blob = canvas ? await domCanvasToBlob(canvas) : null;
    }
    return blob;
  } catch (err) {
    dwarn('synthetic snapshot error', err);
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Orchestrator                                                       */
/* ------------------------------------------------------------------ */

/**
 * Fully automatic capture:
 *   LEVEL 1  real video frame (+ LEVEL 1B bounded retries)
 *   LEVEL 2  player component via html2canvas
 *   LEVEL 3  synthetic branded snapshot
 * Never asks the user for anything. `success: false` only when every level
 * failed — the caller should then post the discussion without an image.
 */
export async function captureDiscussionScreenshot(
  ctx: DiscussionCaptureContext
): Promise<DiscussionCaptureResult> {
  const { video, container } = ctx;
  const timestamp =
    ctx.timestamp != null && Number.isFinite(ctx.timestamp) && ctx.timestamp >= 0
      ? ctx.timestamp
      : video && Number.isFinite(video.currentTime)
        ? video.currentTime
        : 0;

  const ok = (source: DiscussionCaptureSource, blob: Blob): DiscussionCaptureResult => {
    const file = new File([blob], 'screenshot.jpg', { type: 'image/jpeg' });
    dlog('final result', { source, bytes: blob.size, timestamp });
    return { success: true, source, blob, file, timestamp };
  };

  // ---- LEVEL 1 / 1B: real video frame with bounded retries ----
  if (video) {
    dlog('LEVEL 1');
    logVideoDiagnostics(video);
    const r1 = await captureRealFrameWithRetry(video);
    if (r1.blob) {
      return ok(r1.retried ? 'video-frame-retry' : 'video-frame', r1.blob);
    }
    dlog('LEVEL 1 failed', { tainted: r1.tainted, reason: r1.lastReason });
  } else {
    dlog('LEVEL 1 skipped (no video element)');
  }

  // ---- LEVEL 2: player component capture ----
  if (container) {
    dlog('LEVEL 2', 'component capture');
    const b2 = await captureComponentScreenshot(container, level2TimeoutMs());
    if (b2) {
      const validation = await validateScreenshot(b2);
      if (validation.valid) {
        return ok('video-component', b2);
      }
      // Typically: html2canvas rendered the cross-origin video box black.
      dlog('LEVEL 2 output rejected', validation.reason);
    }
  } else {
    dlog('LEVEL 2 skipped (no container element)');
  }

  // ---- LEVEL 3: synthetic discussion snapshot ----
  dlog('LEVEL 3', 'synthetic snapshot');
  const b3 = await createSyntheticSnapshot({
    courseTitle: ctx.courseTitle,
    chapterTitle: ctx.chapterTitle,
    timestamp,
    thumbnailUrl: ctx.thumbnailUrl,
    locale: ctx.locale,
  });
  if (b3) {
    return ok('synthetic', b3);
  }

  dwarn('final result', 'all levels failed — discussion will post without a screenshot');
  return { success: false, source: null, timestamp, reason: 'all_levels_failed' };
}
