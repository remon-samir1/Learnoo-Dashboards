/**
 * Discussion Screenshot Capture — 3-level fallback utility.
 *
 * Level 1: Direct video frame capture via canvas.drawImage(video).
 * Level 2: DOM container capture via html2canvas (useful when video is
 *          cross-origin tainted, e.g. iOS native HLS without crossOrigin).
 * Level 3: Manual upload — returns null, caller should show file picker UI.
 *
 * The module also exposes a robust screenshot validator that detects blank,
 * transparent, or invalid images by analysing pixel variance.
 */

import { isIOSDevice } from '@/src/lib/video-stream-detect';

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

export type CaptureFallbackLevel = 'direct' | 'component' | 'manual' | null;

export interface CaptureResult {
  file: File | null;
  level: CaptureFallbackLevel;
  /** Human-readable internal log messages (never shown to user). */
  log: string[];
}

const LOG = '[Discussion Screenshot]';

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
 * We sample a 12×12 grid (144 points) across the image. For each pixel we
 * compute luminance Y = 0.299R + 0.587G + 0.114B. We then compute the
 * standard deviation of these luminance values. A real video frame —
 * even a very dark scene — has luminance SD > ~2 because of compression
 * artefacts, UI overlays, gradients, etc. A truly blank/solid-colour
 * frame has SD ≈ 0.
 *
 * Threshold: SD < 1.5 → blank. This was chosen because:
 * - Pure black canvas: SD = 0
 * - Solid colour with JPEG noise: SD ≈ 0.3–0.8
 * - Very dark movie scene (e.g. night): SD ≈ 5–30
 * - Normal video frame: SD > 15
 *
 * Additionally we check for nearly-full transparency (alpha channel).
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
      // Standard luminance formula: Y = 0.299R + 0.587G + 0.114B
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      luminances.push(lum);
      if (lum > overallMax) overallMax = lum;

      // Analyze the center 50% region (where video content resides, away from badges/overlays)
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

  // Center region variance and mean
  let centerSD = 0;
  let cMean = 0;
  if (centerLuminances.length > 0) {
    cMean = centerLuminances.reduce((s, v) => s + v, 0) / centerLuminances.length;
    const cVar = centerLuminances.reduce((s, v) => s + (v - cMean) ** 2, 0) / centerLuminances.length;
    centerSD = Math.sqrt(cVar);
  }

  // Detect black / unrendered / blank images:
  // 1. Overall image is essentially pitch black (mean < 15 or max pixel < 28)
  // 2. The center video area is black (cMean < 18 or centerMax < 35) — this catches
  //    Level 1 black frames AND Level 2 html2canvas captures where the video element is empty
  //    even if surrounding UI badges (e.g. student ID) have text.
  // 3. The entire image is completely uniform/flat (sd < 2.0)
  // 4. The center area is completely flat and dark (centerSD < 2.0 && cMean < 40)
  const isEssentiallyBlack = mean < 15 || overallMax < 28;
  const isCenterBlackOrEmpty =
    centerSamples > 0 && (cMean < 18 || centerMax < 35 || (centerSD < 2.0 && cMean < 40));
  const isUniformFlat = sd < 2.0;

  const isBlank = isEssentiallyBlack || isCenterBlackOrEmpty || isUniformFlat;

  return {
    blank: isBlank,
    transparent: alphaRatio > 0.8,
    luminanceSD: sd,
    alphaRatio,
  };
}

/**
 * Validate a screenshot blob by loading it as an image and analysing pixels.
 * Returns a structured result indicating validity and failure reason.
 */
export async function validateScreenshot(blob: Blob | null): Promise<ScreenshotValidationResult> {
  if (!blob || blob.size === 0) {
    return { valid: false, reason: 'no_blob' };
  }
  if (blob.size < MIN_BLOB_SIZE) {
    return { valid: false, reason: 'blank_image' };
  }

  // Load the blob as an Image to check dimensions and pixel data
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
/*  Level 1: Direct video frame capture                                */
/* ------------------------------------------------------------------ */

/**
 * Capture a frame from a <video> element by drawing it onto a canvas.
 * Returns a File if successful, null if the video is not ready or the
 * canvas is tainted (cross-origin).
 */
export function captureDirectVideoFrame(video: HTMLVideoElement): {
  file: File | null;
  tainted: boolean;
} {
  if (!video || video.videoWidth === 0 || video.videoHeight === 0 || video.readyState < 1) {
    console.debug(`${LOG} Level 1: video not ready`, {
      hasVideo: Boolean(video),
      videoWidth: video?.videoWidth,
      videoHeight: video?.videoHeight,
      readyState: video?.readyState,
    });
    return { file: null, tainted: false };
  }
  try {
    const canvas = document.createElement('canvas');
    // Cap dimensions to prevent iOS Safari canvas memory issues
    const maxDim = 1280;
    let w = video.videoWidth;
    let h = video.videoHeight;
    if (w > maxDim || h > maxDim) {
      if (w >= h) {
        h = Math.round((h * maxDim) / w);
        w = maxDim;
      } else {
        w = Math.round((w * maxDim) / h);
        h = maxDim;
      }
    }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { file: null, tainted: false };
    ctx.drawImage(video, 0, 0, w, h);

    let dataUrl: string;
    try {
      dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    } catch (err) {
      // SecurityError — tainted canvas (cross-origin without CORS headers)
      console.warn(`${LOG} Level 1: canvas tainted`, err);
      return { file: null, tainted: true };
    }

    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    const u8 = new Uint8Array(bstr.length);
    for (let i = 0; i < bstr.length; i++) u8[i] = bstr.charCodeAt(i);

    let file: File;
    try {
      file = new File([u8], 'screenshot.jpg', { type: mime });
    } catch {
      // Edge-case: very old browsers where File constructor fails
      const blob = new Blob([u8], { type: mime });
      file = Object.assign(blob, {
        name: 'screenshot.jpg',
        lastModified: Date.now(),
      }) as unknown as File;
    }
    return { file, tainted: false };
  } catch (err) {
    console.warn(`${LOG} Level 1: unexpected error`, err);
    return { file: null, tainted: false };
  }
}

/* ------------------------------------------------------------------ */
/*  Level 2: DOM container capture via html2canvas                     */
/* ------------------------------------------------------------------ */

/**
 * Capture a screenshot of a DOM element using html2canvas.
 * html2canvas is dynamically imported to avoid increasing the main bundle
 * for users who never trigger this code path.
 *
 * Note: html2canvas cannot capture the actual decoded video frames from a
 * <video> element on iOS native HLS. It will render the element's bounding
 * box but the video area may appear black. The result is validated by the
 * caller using `validateScreenshot()`. If blank, Level 3 (manual) kicks in.
 */
export async function captureContainerScreenshot(
  element: HTMLElement | null
): Promise<File | null> {
  if (!element) {
    console.debug(`${LOG} Level 2: no element provided`);
    return null;
  }

  try {
    // Dynamic import — only loads when Level 2 is actually needed
    const html2canvas = (await import('html2canvas')).default;

    const canvas = await html2canvas(element, {
      useCORS: true,
      allowTaint: false,
      backgroundColor: null,
      // Limit scale to prevent memory issues on mobile devices
      scale: Math.min(window.devicePixelRatio, 2),
      logging: false,
    });

    return new Promise<File | null>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.warn(`${LOG} Level 2: toBlob returned null`);
            resolve(null);
            return;
          }
          try {
            const file = new File([blob], 'screenshot.jpg', {
              type: 'image/jpeg',
            });
            resolve(file);
          } catch {
            const f = Object.assign(blob, {
              name: 'screenshot.jpg',
              lastModified: Date.now(),
            }) as unknown as File;
            resolve(f);
          }
        },
        'image/jpeg',
        0.85
      );
    });
  } catch (err) {
    console.warn(`${LOG} Level 2: html2canvas error`, err);
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Orchestrator: 3-level capture pipeline                             */
/* ------------------------------------------------------------------ */

/**
 * Attempt screenshot capture using the 3-level fallback:
 *   Level 1 → Direct video frame
 *   Level 2 → DOM container via html2canvas
 *   Level 3 → null (manual upload required)
 *
 * @param video      The <video> HTMLElement (ref from HlsVideoPlayer)
 * @param container  The DOM element wrapping the video player (for Level 2)
 * @returns CaptureResult with the file (or null) and metadata
 */
export async function captureScreenshotWithFallback(
  video: HTMLVideoElement | null,
  container: HTMLElement | null
): Promise<CaptureResult> {
  const log: string[] = [];

  // ---- Level 1: Direct video frame ----
  if (video) {
    const { file: directFile, tainted } = captureDirectVideoFrame(video);
    if (directFile) {
      const validation = await validateScreenshot(directFile);
      if (validation.valid) {
        log.push('Level 1: success (direct video frame)');
        return { file: directFile, level: 'direct', log };
      }
      log.push(`Level 1: captured but invalid (${validation.reason})`);
    } else {
      log.push(`Level 1: failed (${tainted ? 'tainted canvas' : 'video not ready'})`);
    }
  } else {
    log.push('Level 1: skipped (no video element)');
  }

  // ---- Level 2: DOM container capture ----
  if (container) {
    log.push('Level 2: attempting html2canvas container capture...');
    const containerFile = await captureContainerScreenshot(container);
    if (containerFile) {
      const validation = await validateScreenshot(containerFile);
      if (validation.valid) {
        log.push('Level 2: success (container capture)');
        return { file: containerFile, level: 'component', log };
      }
      log.push(`Level 2: captured but invalid (${validation.reason})`);
    } else {
      log.push('Level 2: html2canvas returned null');
    }
  } else {
    log.push('Level 2: skipped (no container element)');
  }

  // ---- Level 3: Manual upload required ----
  log.push('Level 3: manual upload required');
  return { file: null, level: 'manual', log };
}
