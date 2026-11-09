/**
 * Video settings — `/v1/video-settings`.
 *
 * `sleep_per_minute` is the number of **minutes** the mobile app keeps the phone
 * screen awake while a lecture video is playing.
 *
 * `GET /v1/video-settings` answers with the flat object `{ "sleep_per_minute": 5 }`.
 * The response type stays tolerant because the write endpoint is not verified yet and
 * may echo the value inside a JSON:API-style `data` envelope like the rest of the API.
 * Use `parseSleepPerMinute()` from `@/src/lib/video-settings` to read either shape.
 */
export interface VideoSettings {
  sleep_per_minute: number;
}

/** Either the flat payload above or anything wrapped in `data` — read it with `parseSleepPerMinute()`. */
export type VideoSettingsResponse = Partial<VideoSettings> & { data?: unknown };

/** Body of `POST /v1/video-settings`. */
export interface UpdateVideoSettingsRequest {
  sleep_per_minute: number;
}
