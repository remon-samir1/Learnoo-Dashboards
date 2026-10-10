/**
 * Configuration and utilities for Jitsi Meet integration.
 * Default domain is set to the production server: 'meet.learnoo.app'.
 * Automatically strips protocol (https://, http://) and trailing slashes.
 */

export function getJitsiDomain(): string {
  const domain = process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.learnoo.app';
  return domain.replace(/^https?:\/\//, '').replace(/\/$/, '').trim();
}

export const JITSI_DOMAIN = getJitsiDomain();

/**
 * Generates an alphanumeric room name safe for Apache/Nginx Jitsi rewrite rules (without hyphens or special chars).
 * e.g. 'learnooroom58'
 */
export function getJitsiRoomName(roomId: string | number): string {
  const cleanId = String(roomId).replace(/[^a-zA-Z0-9]/g, '');
  return `learnooroom${cleanId}`;
}

export function getJitsiAppUrl(roomId: string | number, displayName: string, android = false) {
  const meeting = `${JITSI_DOMAIN}/${getJitsiRoomName(roomId)}#userInfo.displayName=${encodeURIComponent(JSON.stringify(displayName))}`;
  return android ? `intent://${meeting}#Intent;scheme=org.jitsi.meet;package=org.jitsi.meet;end` : `org.jitsi.meet://${meeting}`;
}

export const liveMeetingBranding = {
  APP_NAME: 'Learnoo',
  PROVIDER_NAME: 'Learnoo',
  SHOW_JITSI_WATERMARK: false,
  SHOW_BRAND_WATERMARK: false,
  SHOW_POWERED_BY: false,
  JITSI_WATERMARK_LINK: '',
  BRAND_WATERMARK_LINK: '',
  DEFAULT_WELCOME_PAGE_LOGO_URL: '',
};
