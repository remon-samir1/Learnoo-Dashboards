export type DrmKeySystem = 'widevine' | 'fairplay' | 'playready' | 'clearkey';

export interface DrmLicenseServer {
  widevine?: string;
  fairplay?: string;
  playready?: string;
  clearkey?: string;
}

export interface DrmConfig {
  enabled: boolean;
  licenseServers: DrmLicenseServer;
  /** Optional headers to attach to license requests (e.g., Authorization). */
  licenseRequestHeaders?: Record<string, string>;
  /** Optional function to transform license request body before sending. */
  getLicense?: (keySystem: DrmKeySystem, message: ArrayBuffer) => Promise<ArrayBuffer>;
}

export interface DrmKeySystemConfig {
  keySystem: string;
  licenseServerUrl: string;
  serverCertificateUrl?: string;
  distinctiveIdentifier?: 'required' | 'optional' | 'denied';
  persistentState?: 'required' | 'optional' | 'denied';
  sessionTypes?: string[];
  videoCapabilities?: MediaKeySystemMediaCapability[];
  audioCapabilities?: MediaKeySystemMediaCapability[];
}

export function getDrmKeySystemConfigs(config: DrmConfig): DrmKeySystemConfig[] {
  const configs: DrmKeySystemConfig[] = [];

  if (config.licenseServers.widevine) {
    configs.push({
      keySystem: 'com.widevine.alpha',
      licenseServerUrl: config.licenseServers.widevine,
      videoCapabilities: [{ contentType: 'video/mp4; codecs="avc1.42E01E"' }],
      audioCapabilities: [{ contentType: 'audio/mp4' }],
    });
  }

  if (config.licenseServers.fairplay) {
    configs.push({
      keySystem: 'com.apple.fps',
      licenseServerUrl: config.licenseServers.fairplay,
      videoCapabilities: [{ contentType: 'video/mp4; codecs="avc1.42E01E"' }],
      audioCapabilities: [{ contentType: 'audio/mp4' }],
    });
  }

  if (config.licenseServers.playready) {
    configs.push({
      keySystem: 'com.microsoft.playready',
      licenseServerUrl: config.licenseServers.playready,
      videoCapabilities: [{ contentType: 'video/mp4; codecs="avc1.42E01E"' }],
      audioCapabilities: [{ contentType: 'audio/mp4' }],
    });
  }

  if (config.licenseServers.clearkey) {
    configs.push({
      keySystem: 'org.w3.clearkey',
      licenseServerUrl: config.licenseServers.clearkey,
      videoCapabilities: [{ contentType: 'video/mp4; codecs="avc1.42E01E"' }],
      audioCapabilities: [{ contentType: 'audio/mp4' }],
    });
  }

  return configs;
}

export async function isDrmSupported(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.requestMediaKeySystemAccess) {
    return false;
  }

  const testConfigs: MediaKeySystemConfiguration[] = [
    {
      initDataTypes: ['cenc'],
      videoCapabilities: [{ contentType: 'video/mp4; codecs="avc1.42E01E"' }],
      audioCapabilities: [{ contentType: 'audio/mp4' }],
    },
  ];

  const keySystems = [
    'com.widevine.alpha',
    'com.apple.fps',
    'com.microsoft.playready',
    'org.w3.clearkey',
  ];

  for (const keySystem of keySystems) {
    try {
      await navigator.requestMediaKeySystemAccess(keySystem, testConfigs);
      return true;
    } catch {
      continue;
    }
  }

  return false;
}

export function getSupportedKeySystems(): string[] {
  if (typeof navigator === 'undefined' || !navigator.requestMediaKeySystemAccess) {
    return [];
  }

  const keySystems = [
    'com.widevine.alpha',
    'com.apple.fps',
    'com.microsoft.playready',
    'org.w3.clearkey',
  ];

  const supported: string[] = [];

  for (const keySystem of keySystems) {
    try {
      navigator.requestMediaKeySystemAccess(keySystem, [
        {
          initDataTypes: ['cenc'],
          videoCapabilities: [{ contentType: 'video/mp4; codecs="avc1.42E01E"' }],
          audioCapabilities: [{ contentType: 'audio/mp4' }],
        },
      ]).then(() => {
        supported.push(keySystem);
      }).catch(() => {});
    } catch {
      continue;
    }
  }

  return supported;
}
