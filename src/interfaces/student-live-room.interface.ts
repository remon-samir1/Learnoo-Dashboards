/**
 * Student live-room API (JSON:API-style). All fields optional — API may omit or null.
 */

export interface StudentLiveRoomUserAttributes {
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  peer_id?: string | null;
  host_peer_id?: string | null;
  /** Alternate API naming */
  live_peer_id?: string | null;
}

export interface StudentLiveRoomUser {
  data?: {
    id?: string;
    type?: string;
    attributes?: StudentLiveRoomUserAttributes | null;
  } | null;
}

export interface StudentLiveRoomCourseInstructor {
  data?: {
    attributes?: {
      full_name?: string | null;
    } | null;
  } | null;
}

export interface StudentLiveRoomCourseAttributes {
  title?: string | null;
  sub_title?: string | null;
  thumbnail?: string | null;
  description?: string | null;
  instructor?: StudentLiveRoomCourseInstructor | null;
}

export interface StudentLiveRoomCourse {
  data?: {
    id?: string;
    type?: string;
    attributes?: StudentLiveRoomCourseAttributes | null;
  } | null;
}

export interface StudentLiveRoomAttributes {
  title?: string | null;
  description?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  max_students?: number | null;
  max_join_time?: string | number | null;
  enable_chat?: boolean | null;
  enable_recording?: boolean | null;
  status?: string | null;
  /** Host / instructor PeerJS id (API may use different key names). */
  host_peer_id?: string | null;
  peer_id?: string | null;
  instructor_peer_id?: string | null;
  live_peer_id?: string | null;
  recording_url?: string | null;
  playback_url?: string | null;
  video_url?: string | null;
  user?: StudentLiveRoomUser | null;
  course?: StudentLiveRoomCourse | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface StudentLiveRoom {
  id: string;
  type?: string | null;
  attributes?: StudentLiveRoomAttributes | null;
}

export type StudentLiveRoomListResponse = {
  data?: StudentLiveRoom[] | { data?: StudentLiveRoom[] } | StudentLiveRoom | null;
};

export type StudentLiveRoomDetailResponse = {
  data?: StudentLiveRoom | null;
};
