export interface IUserProgress {
  id: string;
  type: "user-progress";
  attributes: IUserProgressAttributes;
}

export interface IUserProgressAttributes {
  chapter: IUserProgressChapter;
  progress_seconds: number;
  is_completed: boolean;
  last_watched_at: string | null;
}

export interface IUserProgressChapter {
  data: IUserProgressChapterData;
}

export interface IUserProgressChapterData {
  id: string;
  type: "chapters";
  attributes: IUserProgressChapterAttributes;
}

export interface IUserProgressChapterAttributes {
  lecture_id: number;
  course_id: number;
  title: string;
  thumbnail: string | null;
  video: string | null;
  playlist: string | null;
  video_hls_url?: string | null;
  video_mp4_url?: string | null;
  duration: string;
  is_free_preview: boolean;
  max_views: number;
  current_user_views: number;
  view_by_minute: number;
  is_activated: boolean;
  is_locked: boolean;
  can_watch: boolean;
  watch_access_state:
    | "available"
    | "activation_required"
    | "view_limit_reached"
    | "not_published"
    | "video_not_ready"
    | "authentication_required";
  video_ready: boolean;
  video_status: "none" | "queued" | "processing" | "ready" | "failed";
  created_at: string;
  updated_at: string;
}
