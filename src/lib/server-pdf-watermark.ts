'use server';

import { PDFDocument, rgb, degrees } from 'pdf-lib';
import type { User } from '@/src/types';
import type { WatermarkConfig } from '@/src/types/watermark-config';

/**
 * Adds watermark text to all pages of a PDF buffer.
 * Returns watermarked PDF as bytes, or original PDF if watermark is disabled.
 */
export async function addWatermarkToPdf(
  pdfBuffer: ArrayBuffer,
  watermarkConfig: WatermarkConfig,
  user: User | null,
  studentCode?: string
): Promise<ArrayBuffer> {
  if (!watermarkConfig.enabled) {
    return pdfBuffer;
  }

  try {
    const pdfDoc = await PDFDocument.load(Buffer.from(pdfBuffer));
    const pages = pdfDoc.getPages();
    const rgb_color = hexToRgb(watermarkConfig.color);

    // Build watermark text — mirrors PdfPreviewModal client logic exactly
    const parts: string[] = [];

    if (watermarkConfig.useStudentCode && studentCode) {
      parts.push(studentCode);
    }

    if (watermarkConfig.usePhoneNumber && user?.attributes?.phone) {
      const phone = String(user.attributes.phone).trim();
      if (phone) parts.push(phone);
    }

    // Fall back to the static text configured in admin if no dynamic parts
    let watermarkText = parts.length > 0 ? parts.join(' · ') : watermarkConfig.text;

    // Append student code for traceability (matches client-side PdfPreviewModal behavior)
    const studentCodeForTrace = studentCode?.trim() || '';
    if (studentCodeForTrace && !watermarkText.includes(studentCodeForTrace)) {
      watermarkText = watermarkText ? `${watermarkText} · ${studentCodeForTrace}` : studentCodeForTrace;
    }

    const opacity = watermarkConfig.opacity / 100;
    const fontSize = calculateFontSize(watermarkConfig.size);
    const rotationDegrees = watermarkConfig.rotation;

    for (const page of pages) {
      const { width, height } = page.getSize();

      // Always use full-grid watermarks — the client-side PdfPreviewModal
      // always renders a 3×4 CSS grid regardless of the `position` config,
      // so we mirror that here so the downloaded PDF looks identical.
      addGridWatermarks(
        page,
        watermarkText,
        rgb_color,
        opacity,
        fontSize,
        rotationDegrees,
        width,
        height,
        watermarkConfig.dynamicPosition
      );
    }

    const watermarkedBytes = await pdfDoc.save();
    return watermarkedBytes.buffer.slice(watermarkedBytes.byteOffset, watermarkedBytes.byteOffset + watermarkedBytes.byteLength) as ArrayBuffer;
  } catch (error) {
    console.error('Failed to add watermark to PDF:', error);
    return pdfBuffer;
  }
}

function hexToRgb(hex: string): { red: number; green: number; blue: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return {
      red: parseInt(result[1], 16) / 255,
      green: parseInt(result[2], 16) / 255,
      blue: parseInt(result[3], 16) / 255,
    };
  }
  return { red: 0, green: 0, blue: 0 };
}

function calculateFontSize(size: 'small' | 'medium' | 'large'): number {
  switch (size) {
    case 'small':
      return 18;
    case 'medium':
      return 28;
    case 'large':
      return 40;
    default:
      return 28;
  }
}

function addGridWatermarks(
  page: any,
  text: string,
  color: { red: number; green: number; blue: number },
  opacity: number,
  _fontSize: number,
  _rotationDegrees: number,
  pageWidth: number,
  pageHeight: number,
  _dynamicPosition: boolean
) {
  // ── Exact mirror of PdfPreviewModal client-side CSS overlay ──────────────
  //
  // Client CSS (PdfPreviewContent):
  //   <div class="absolute inset-0">
  //     <div class="grid h-full w-full grid-cols-3 gap-16 p-10">
  //       12 × <span class="rotate-[-25deg] text-2xl font-bold">
  //     </div>
  //   </div>
  //
  // The CSS grid fills the entire page container. We use proportional
  // spacing so the layout scales correctly to any PDF page size.

  const COLS = 3;
  const ROWS = 4;
  const FONT_SIZE = 24;  // CSS text-2xl
  const ROTATION = -25;  // CSS rotate-[-25deg]

  // Proportional padding & gap (relative to page dims, matching CSS ~5.5% / ~9%)
  const padX = pageWidth * 0.055;
  const padY = pageHeight * 0.048;
  const gapX = pageWidth * 0.088;
  const gapY = pageHeight * 0.063;

  // Cell dimensions
  const areaW = pageWidth - padX * 2;
  const areaH = pageHeight - padY * 2;
  const cellW = (areaW - gapX * (COLS - 1)) / COLS;
  const cellH = (areaH - gapY * (ROWS - 1)) / ROWS;

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      // Center of each grid cell — PDF origin is bottom-left, CSS is top-left
      const cx = padX + col * (cellW + gapX) + cellW / 2;
      const cy = pageHeight - (padY + row * (cellH + gapY) + cellH / 2);

      // Rough center-alignment for the drawn text
      const approxTextWidth = text.length * FONT_SIZE * 0.42;

      page.drawText(text, {
        x: cx - approxTextWidth / 2,
        y: cy - FONT_SIZE / 2,
        size: FONT_SIZE,
        color: rgb(color.red, color.green, color.blue),
        opacity,
        rotate: degrees(ROTATION),
      });
    }
  }
}




function addSingleWatermark(
  page: any,
  text: string,
  color: { red: number; green: number; blue: number },
  opacity: number,
  fontSize: number,
  rotationDegrees: number,
  pageWidth: number,
  pageHeight: number,
  position: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'center'
) {
  const padding = 20;
  let x = pageWidth / 2;
  let y = pageHeight / 2;

  switch (position) {
    case 'topLeft':
      x = padding;
      y = pageHeight - padding - fontSize;
      break;
    case 'topRight':
      x = pageWidth - padding - fontSize * text.length * 0.6;
      y = pageHeight - padding - fontSize;
      break;
    case 'bottomLeft':
      x = padding;
      y = padding;
      break;
    case 'bottomRight':
      x = pageWidth - padding - fontSize * text.length * 0.6;
      y = padding;
      break;
    case 'center':
      // keep center
      break;
  }

  page.drawText(text, {
    x: x,
    y: y,
    size: fontSize,
    color: rgb(color.red, color.green, color.blue),
    opacity: opacity,
    rotate: degrees(rotationDegrees),
  });
}
