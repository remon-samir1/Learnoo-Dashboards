import { ICourse } from "./courses.interface";
import { IStudent } from "./student.interface";

export interface LiveSessionsRoot {
  data: LiveSessionData | LiveSessionData[];
}

export interface LiveSessionData {
  id: string;
  type: "live-rooms";
  attributes: LiveSessionAttributes;
}

export interface LiveSessionAttributes {
  title: string;
  description: string;
  user: {
    data: IStudent;
  };
  course: {
    data: ICourse;
  };
  started_at: string;
  max_students: number;
  max_join_time: number;
  enable_chat: boolean;
  enable_recording: boolean;
  status: "upcoming" | "live" | "ended" | string;
  created_at: string | null;
  updated_at: string | null;
}


