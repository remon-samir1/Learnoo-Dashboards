"use client";

import { useEffect } from 'react';
import { usePlatformFeature } from '@/src/hooks/usePlatformFeature';

export default function PlatformBranding() {
  const { data: features } = usePlatformFeature();
  useEffect(() => {
    const value = (key: string) => features?.find(feature => feature.attributes.key === key)?.attributes.value;
    const primary = value('primary_color');
    const accent = value('accent_color');
    if (primary && /^#[0-9a-f]{3,8}$/i.test(primary)) {
      document.documentElement.style.setProperty('--primary', primary);
      document.documentElement.style.setProperty('--primary-blue', primary);
      document.documentElement.dataset.platformBranding = 'true';
      const hex = primary.length === 4 ? primary.slice(1).split('').map(c => c + c).join('') : primary.slice(1, 7);
      const channels = [0, 2, 4].map(offset => parseInt(hex.slice(offset, offset + 2), 16));
      document.documentElement.style.setProperty('--on-primary', channels[0] * .299 + channels[1] * .587 + channels[2] * .114 > 160 ? '#172033' : '#ffffff');
    }
    if (accent && /^#[0-9a-f]{3,8}$/i.test(accent)) document.documentElement.style.setProperty('--accent', accent);
    const font = value('font_family');
    if (!font || !/^[a-z0-9 -]+$/i.test(font)) return;
    document.documentElement.style.setProperty('--font-platform', `"${font}", sans-serif`);
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;500;600;700&display=swap`;
    document.head.appendChild(stylesheet);
    return () => stylesheet.remove();
  }, [features]);
  return null;
}
