import type { PlatformFeature } from '@/src/types';
import { normalizePlatformFeatureList } from '@/src/services/student/platform-feature.service';
import {
  DEFAULT_WATERMARK_CONFIG,
  type WatermarkConfig,
  type WatermarkContentType,
} from '@/src/types/watermark-config';
import api from '@/src/lib/api';

export type WatermarkResolution = { config: WatermarkConfig; bucket: WatermarkContentType };

/**
 * First enabled bucket in order (chapter watch: chapters → videos → exams).
 */
export function resolveEnabledWatermarkBucket(
  features: PlatformFeature[],
  primary: WatermarkContentType
): WatermarkResolution | null {
  const order: WatermarkContentType[] =
    primary === 'chapters'
      ? ['chapters', 'videos', 'exams']
      : primary === 'videos'
        ? ['videos', 'chapters', 'exams']
        : [primary];
  for (const bucket of order) {
    const cfg = parseWatermarkConfigFromFeatures(features, bucket);
    if (cfg.enabled) return { config: cfg, bucket };
  }
  return null;
}

function featureValue(features: PlatformFeature[], key: string, fallback: string): string {
  const f = features.find((x) => x.attributes.key === key);
  const v = f?.attributes?.value;
  return v != null && String(v).length > 0 ? String(v) : fallback;
}

function featureBool(features: PlatformFeature[], key: string, fallback: boolean): boolean {
  const v = featureValue(features, key, fallback ? '1' : '0').trim().toLowerCase();
  return v === '1' || v === 'true';
}

function featureInt(features: PlatformFeature[], key: string, fallback: number): number {
  const v = featureValue(features, key, String(fallback)).trim();
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

function featureStringEnum<T extends string>(
  features: PlatformFeature[],
  key: string,
  fallback: T,
  allowed: readonly T[]
): T {
  const v = featureValue(features, key, fallback).trim();
  return (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}

/**
 * Parse watermark for one content bucket. Keys: `watermark_{contentType}_{field}` on each feature row.
 *
 * @param features Full or filtered list from `GET /v1/feature`
 * @param contentType e.g. `chapters` | `videos` | `exams`
 */
export function parseWatermarkConfigFromFeatures(
  features: PlatformFeature[],
  contentType: WatermarkContentType
): WatermarkConfig {
  const p = (suffix: string) => `watermark_${contentType}_${suffix}`;
  const d = DEFAULT_WATERMARK_CONFIG;

  return {
    enabled: featureBool(features, p('enabled'), d.enabled),
    text: featureValue(features, p('text'), d.text),
    useStudentCode: featureBool(features, p('use_student_code'), d.useStudentCode),
    usePhoneNumber: featureBool(features, p('use_phone_number'), d.usePhoneNumber),
    color: featureValue(features, p('color'), d.color),
    opacity: featureInt(features, p('opacity'), d.opacity),
    rotation: featureInt(features, p('rotation'), d.rotation),
    position: featureStringEnum(features, p('position'), d.position, [
      'topLeft',
      'topRight',
      'bottomLeft',
      'bottomRight',
      'center',
      'full',
    ] as const),
    size: featureStringEnum(features, p('size'), d.size, ['small', 'medium', 'large'] as const),
    dynamicPosition: featureBool(features, p('dynamic_position'), d.dynamicPosition),
    dynamicInterval: featureInt(features, p('dynamic_interval'), d.dynamicInterval),
    movementPattern: featureStringEnum(features, p('movement_pattern'), d.movementPattern, [
      'random',
      'circular',
      'zigzag',
      'bounce',
      'edge',
    ] as const),
    animationStyle: featureStringEnum(features, p('animation_style'), d.animationStyle, [
      'slide',
      'fade',
      'scale',
      'rotate',
      'glide',
    ] as const),
    easingType: featureStringEnum(features, p('easing_type'), d.easingType, [
      'linear',
      'ease',
      'easeInOut',
      'bounce',
      'elastic',
    ] as const),
    randomCoordinates: featureBool(features, p('random_coordinates'), d.randomCoordinates),
    voiceEnabled: featureBool(features, p('voice_enabled'), d.voiceEnabled),
    voiceInterval: featureInt(features, p('voice_interval'), d.voiceInterval),
  };
}

/**
 * Fetches `GET /v1/feature`, keeps rows whose key starts with `watermark_`, then parses one content type.
 */
export async function getWatermarkSettings(
  contentType: WatermarkContentType = 'chapters'
): Promise<WatermarkConfig> {
  const res = await api.platformFeature.get();
  const list = normalizePlatformFeatureList(res).filter((f) => f.attributes.key.startsWith('watermark_'));
  return parseWatermarkConfigFromFeatures(list, contentType);
}
