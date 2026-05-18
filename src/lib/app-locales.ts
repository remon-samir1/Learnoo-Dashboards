/** Locales from `messages/*.json` (used for student routes). */
export const APP_LOCALES = ['en', 'ar'] as const;

export type AppLocale = (typeof APP_LOCALES)[number];
