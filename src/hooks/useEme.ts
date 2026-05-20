'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { DrmConfig, DrmKeySystemConfig } from '@/src/types/drm-config';

function getKeySystemName(keySystem: string): string {
  if (keySystem.includes('widevine')) return 'Widevine';
  if (keySystem.includes('fairplay') || keySystem.includes('fps')) return 'FairPlay';
  if (keySystem.includes('playready')) return 'PlayReady';
  if (keySystem.includes('clearkey')) return 'ClearKey';
  return keySystem;
}

async function requestKeySystemAccess(
  keySystemConfigs: DrmKeySystemConfig[]
): Promise<MediaKeySystemAccess | null> {
  if (typeof navigator === 'undefined' || !navigator.requestMediaKeySystemAccess) {
    return null;
  }

  for (const config of keySystemConfigs) {
    try {
      const access = await navigator.requestMediaKeySystemAccess(config.keySystem, [
        {
          initDataTypes: config.keySystem.includes('fairplay') ? ['sinf', 'spc', 'skd'] : ['cenc'],
          videoCapabilities: config.videoCapabilities || [{ contentType: 'video/mp4; codecs="avc1.42E01E"' }],
          audioCapabilities: config.audioCapabilities || [{ contentType: 'audio/mp4' }],
          distinctiveIdentifier: (config.distinctiveIdentifier || 'optional') as MediaKeysRequirement,
          persistentState: (config.persistentState || 'optional') as MediaKeysRequirement,
          sessionTypes: config.sessionTypes || ['temporary'],
        },
      ]);
      return access;
    } catch (err) {
      console.debug(`[EME] Key system ${config.keySystem} not available:`, err);
    }
  }

  return null;
}

async function loadServerCertificate(
  keySession: MediaKeySession,
  serverCertificateUrl?: string
): Promise<void> {
  if (!serverCertificateUrl) return;

  try {
    const response = await fetch(serverCertificateUrl);
    if (!response.ok) return;
    const certificate = await response.arrayBuffer();
    await keySession.update(certificate);
  } catch (err) {
    console.warn('[EME] Failed to load server certificate:', err);
  }
}

export interface UseEmeOptions {
  drmConfig: DrmConfig;
  videoElement: React.RefObject<HTMLVideoElement | null>;
  onDrmReady?: () => void;
  onDrmError?: (error: Error) => void;
}

export function useEme({
  drmConfig,
  videoElement,
  onDrmReady,
  onDrmError,
}: UseEmeOptions) {
  const mediaKeysRef = useRef<MediaKeys | null>(null);
  const keySessionRef = useRef<MediaKeySession | null>(null);

  const setupEme = useCallback(async () => {
    const video = videoElement.current;
    if (!video || !drmConfig.enabled) return;

    try {
      const keySystemConfigs = drmConfig.licenseServers
        ? Object.entries(drmConfig.licenseServers)
            .filter(([_, url]) => url)
            .map(([key, url]) => ({
              keySystem:
                key === 'widevine'
                  ? 'com.widevine.alpha'
                  : key === 'fairplay'
                  ? 'com.apple.fps'
                  : key === 'playready'
                  ? 'com.microsoft.playready'
                  : 'org.w3.clearkey',
              licenseServerUrl: url as string,
              videoCapabilities: [{ contentType: 'video/mp4; codecs="avc1.42E01E"' }],
              audioCapabilities: [{ contentType: 'audio/mp4' }],
            }))
        : [];

      if (keySystemConfigs.length === 0) {
        console.warn('[EME] No DRM license servers configured');
        return;
      }

      const access = await requestKeySystemAccess(keySystemConfigs);
      if (!access) {
        const error = new Error('No supported DRM key system found');
        onDrmError?.(error);
        return;
      }

      const mediaKeys = await access.createMediaKeys();
      mediaKeysRef.current = mediaKeys;

      await video.setMediaKeys(mediaKeys);

      const keySession = mediaKeys.createSession();
      keySessionRef.current = keySession;

      keySession.addEventListener('message', async (event: MediaKeyMessageEvent) => {
        try {
          const licenseUrl = (event as any).target?.keySystem
            ? keySystemConfigs.find(
                (c) => c.keySystem === ((event as any).target?.keySystem || '')
              )?.licenseServerUrl
            : keySystemConfigs[0]?.licenseServerUrl;

          if (!licenseUrl) {
            throw new Error('No license server URL found');
          }

          const headers: Record<string, string> = {
            'Content-Type': 'application/octet-stream',
            ...drmConfig.licenseRequestHeaders,
          };

          if (drmConfig.getLicense) {
            const keySystem = ((event as any).target?.keySystem || 'widevine') as any;
            const license = await drmConfig.getLicense(keySystem, event.message);
            await keySession.update(license);
          } else {
            const response = await fetch(licenseUrl, {
              method: 'POST',
              headers,
              body: event.message,
            });

            if (!response.ok) {
              throw new Error(
                `License request failed: ${response.status} ${response.statusText}`
              );
            }

            const license = await response.arrayBuffer();
            await keySession.update(license);
          }

          onDrmReady?.();
        } catch (err) {
          const error = err instanceof Error ? err : new Error('License acquisition failed');
          console.error('[EME] License acquisition failed:', error);
          onDrmError?.(error);
        }
      });

      keySession.addEventListener('keystatuseschange', (event) => {
        const session = event.target as MediaKeySession;
        for (const [keyId, status] of session.keyStatuses.entries()) {
          console.debug(`[EME] Key ${keyId} status: ${status}`);
          if (status === 'output-restricted' || status === 'output-downscaled') {
            console.warn('[EME] DRM output restriction detected');
          }
        }
      });

      keySession.addEventListener('error', (event) => {
        const error = new Error('MediaKeySession error');
        console.error('[EME] Key session error:', event);
        onDrmError?.(error);
      });

      console.info('[EME] DRM setup complete');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('EME setup failed');
      console.error('[EME] Setup failed:', error);
      onDrmError?.(error);
    }
  }, [drmConfig, videoElement, onDrmReady, onDrmError]);

  useEffect(() => {
    if (!drmConfig.enabled) return;

    const video = videoElement.current;
    if (!video) return;

    const onEncrypted = async (event: MediaEncryptedEvent) => {
      console.info('[EME] Encrypted event received:', event.initDataType);
      await setupEme();
    };

    video.addEventListener('encrypted', onEncrypted);

    return () => {
      video.removeEventListener('encrypted', onEncrypted);

      if (keySessionRef.current) {
        keySessionRef.current.close().catch(() => {});
        keySessionRef.current = null;
      }
      mediaKeysRef.current = null;
    };
  }, [drmConfig.enabled, videoElement, setupEme]);

  return {
    isDrmReady: mediaKeysRef.current !== null,
    setupEme,
  };
}
