/**
 * Platform video / page watermark configuration — aligned with Admin
 * `app/(admin)/settings/watermark/page.tsx` and `GET /v1/feature` keys
 * `watermark_{contentType}_*`.
 */

export type WatermarkPosition = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'center' | 'full';

export type WatermarkSize = 'small' | 'medium' | 'large';

export type WatermarkContentType =
  | 'chapters'
  | 'exams'
  | 'library'
  | 'videos'
  | 'liveStreams'
  | 'files';

export type MovementPattern = 'random' | 'circular' | 'zigzag' | 'bounce' | 'edge';

export type AnimationStyle = 'slide' | 'fade' | 'scale' | 'rotate' | 'glide';

export type EasingType = 'linear' | 'ease' | 'easeInOut' | 'bounce' | 'elastic';

/** Mirrors Admin `WatermarkConfig` (stored as string values per feature key). */
export interface WatermarkConfig {
  enabled: boolean;
  text: string;
  useStudentCode: boolean;
  usePhoneNumber: boolean;
  color: string;
  /** Admin UI: 10–50 (percent). CSS opacity = `opacity / 100`. */
  opacity: number;
  rotation: number;
  position: WatermarkPosition;
  size: WatermarkSize;
  dynamicPosition: boolean;
  /** Seconds (Admin slider 1–5, label "{n}s"). */
  dynamicInterval: number;
  movementPattern: MovementPattern;
  animationStyle: AnimationStyle;
  easingType: EasingType;
  randomCoordinates: boolean;
  voiceEnabled: boolean;
  /** Seconds in Admin (voice watermark interval). */
  voiceInterval: number;
}

export const DEFAULT_WATERMARK_CONFIG: WatermarkConfig = {
  enabled: false,
  text: 'Learnoo',
  useStudentCode: false,
  usePhoneNumber: false,
  color: '#000000',
  opacity: 10,
  rotation: -12,
  position: 'full',
  size: 'medium',
  dynamicPosition: false,
  dynamicInterval: 2,
  movementPattern: 'random',
  animationStyle: 'glide',
  easingType: 'easeInOut',
  randomCoordinates: false,
  voiceEnabled: false,
  voiceInterval: 5,
};

/** Admin preview tiles this many copies when `position === 'full'` and not dynamic. */
export const WATERMARK_FULL_POSITION_COPY_COUNT = 4;
