export interface Root {
  data: Data
}

export interface Data {
  id: string
  type: string
  attributes: ILiveSessions
}

export interface ILiveSessions {
  chapter: Chapter
  progress_seconds: number
  is_completed: boolean
  last_watched_at: string
}

export interface Chapter {
  data: Data2
}

export interface Data2 {
  id: string
  type: string
  attributes: Attributes2
}

export interface Attributes2 {
  lecture_id: number
  course_id: number
  title: string
  thumbnail: string
  video: string
  duration: string
  is_free_preview: boolean
  max_views: number
  current_user_views: number
  is_activated: boolean
  is_locked: boolean
  can_watch: boolean
  created_at: string
  updated_at: string
}
