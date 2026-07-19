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

    // Append user ID for traceability (matches client-side PdfPreviewModal behavior)
    const userId = user?.id != null ? String(user.id).trim() : '';
    if (userId && !watermarkText.includes(userId)) {
      watermarkText = watermarkText ? `${watermarkText} · ${userId}` : userId;
    }

    const opacity = watermarkConfig.opacity / 100;
    const fontSize = calculateFontSize(watermarkConfig.size);
    const rotationDegrees = watermarkConfig.rotation;

    for (const page of pages) {
      const { width, height } = page.getSize();

      if (watermarkConfig.position === 'full') {
        // Add grid of watermarks across the page
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
      } else {
        // Add single watermark at specified position
        addSingleWatermark(
          page,
          watermarkText,
          rgb_color,
          opacity,
          fontSize,
          rotationDegrees,
          width,
          height,
          watermarkConfig.position
        );
      }
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
  fontSize: number,
  rotationDegrees: number,
  pageWidth: number,
  pageHeight: number,
  _dynamicPosition: boolean
) {
  // Diagonal tiling — mirrors the client CSS grid with rotate-[-25deg] pattern.
  // spacingX/Y produce similar density to the 3-col × 4-row CSS grid in PdfPreviewModal.
  const spacingX = 180;
  const spacingY = 110;

  let rowIdx = 0;
  for (let y = pageHeight; y > -spacingY; y -= spacingY) {
    // Stagger every other row by half spacingX — same effect as the CSS grid offset
    const stagger = rowIdx % 2 === 0 ? 0 : spacingX / 2;
    for (let x = -spacingX + stagger; x < pageWidth + spacingX; x += spacingX) {
      page.drawText(text, {
        x,
        y,
        size: fontSize,
        color: rgb(color.red, color.green, color.blue),
        opacity,
        rotate: degrees(rotationDegrees),
      });
    }
    rowIdx++;
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
