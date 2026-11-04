import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default async function Icon() {
  const logo = await readFile(join(process.cwd(), 'public/Logo.jpeg'));
  return new ImageResponse(<img alt="Learnoo" src={`data:image/jpeg;base64,${logo.toString('base64')}`} width={512} height={512} style={{ objectFit: 'contain', background: '#063bb2' }} />, size);
}
