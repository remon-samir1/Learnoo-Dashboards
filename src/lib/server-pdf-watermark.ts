'use server';

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, PDFFont, rgb, degrees } from 'pdf-lib';
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

  const pdfDoc = await PDFDocument.load(Buffer.from(pdfBuffer));
  pdfDoc.registerFontkit(fontkit);
  const font = await pdfDoc.embedFont(
    await readFile(path.join(process.cwd(), 'node_modules/dejavu-fonts-ttf/ttf/DejaVuSans.ttf'))
  );
  const pages = pdfDoc.getPages();
  const rgb_color = hexToRgb(watermarkConfig.color);

  const parts: string[] = [];

  if (watermarkConfig.useStudentCode && studentCode) {
    parts.push(studentCode);
  }

  if (watermarkConfig.usePhoneNumber && user?.attributes?.phone) {
    const phone = String(user.attributes.phone).trim();
    if (phone) parts.push(phone);
  }

  let watermarkText = parts.length > 0 ? parts.join(' · ') : watermarkConfig.text;

  const studentCodeForTrace = studentCode?.trim() || '';
  if (studentCodeForTrace && !watermarkText.includes(studentCodeForTrace)) {
    watermarkText = watermarkText ? `${watermarkText} · ${studentCodeForTrace}` : studentCodeForTrace;
  }

  watermarkText = prepareWatermarkText(watermarkText);

  const opacity = watermarkConfig.opacity / 100;

  for (const page of pages) {
    const { width, height } = page.getSize();

    addGridWatermarks(page, watermarkText, font, rgb_color, opacity, width, height);
  }

  const watermarkedBytes = await pdfDoc.save();
  return watermarkedBytes.buffer.slice(watermarkedBytes.byteOffset, watermarkedBytes.byteOffset + watermarkedBytes.byteLength) as ArrayBuffer;
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

function prepareWatermarkText(text: string): string {
  if (!/[\u0600-\u06FF]/.test(text)) return text;

  return text.replace(/[0-9٠-٩]+/g, (digits) => [...digits].reverse().join(''));
}

function addGridWatermarks(
  page: any,
  text: string,
  font: PDFFont,
  color: { red: number; green: number; blue: number },
  opacity: number,
  pageWidth: number,
  pageHeight: number,
) {
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
        font,
        color: rgb(color.red, color.green, color.blue),
        opacity,
        rotate: degrees(ROTATION),
      });
    }
  }
}
