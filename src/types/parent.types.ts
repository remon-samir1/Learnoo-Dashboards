// Parent API specific types

export interface LinkedStudent {
  id: number | string;
  name?: string;
  relationship?: string;
  grade?: string;
  full_name?: string;
  attributes?: Record<string, any>;
}

export interface OverviewStats {
  attendance?: { value?: number | string; change?: number | string };
  attendance_rate?: number | string;
  course_progress?: number | string;
  progress?: number | string;
  exam_avg?: { value?: number | string; change?: number | string };
  exam_average?: number | string;
  engagement?: { value?: number | string; change?: number | string } | number | string;
  engagement_level?: number | string;
}

export interface RecentActivityItem {
  title?: string;
  name?: string;
  subject?: string;
  time?: string;
  date?: string;
  description?: string;
  detail?: string;
  summary?: string;
}

export interface AlertItem {
  id?: number | string;
  title?: string;
  subject?: string;
  message?: string;
  description?: string;
  category?: string;
  type?: string;
  date?: string;
  time?: string;
  priority?: string;
  importance?: string;
  status?: string;
  level?: string;
}

export interface ParentDashboardResponse {
  quick_overview?: OverviewStats;
  overview?: OverviewStats;
  recent_activity?: RecentActivityItem[];
  alerts?: AlertItem[];
  student?: { data?: { attributes?: Record<string, any> } };
  exam_results?: Array<Record<string, any>>;
}

export interface CourseProgressItem {
  id?: number | string;
  name?: string;
  title?: string;
  completed_lectures?: number;
  total_lectures?: number;
  completed?: number;
  total?: number;
  progress?: number;
  completion?: number;
  progress_count?: number;
  total_items?: number;
}

export interface ProgressResponse {
  overall_progress?: number;
  progress?: number;
  completion_rate?: number;
  courses?: CourseProgressItem[];
  subjects?: CourseProgressItem[];
}

export interface WeeklyStatsResponse {
  hours_by_day?: Array<{ day?: string; label?: string; hours?: number; value?: number }>;
  activity_breakdown?: Array<{ label?: string; activity?: string; value?: number; percentage?: number }>;
  metrics?: { time_this_week?: number; sessions_this_week?: number; questions_asked?: number; avg_per_day?: number };
}

export interface FeedbackItem {
  id?: number | string;
  teacher?: string;
  instructor?: string;
  course?: string;
  subject?: string;
  sentiment?: string;
  rating?: string | number;
  comments?: string;
  feedback?: string;
  details?: string;
  category?: string;
  date?: string;
  created_at?: string;
}

export interface ActivityItem {
  id?: number | string;
  status?: string;
  type?: string;
  title?: string;
  subject?: string;
  date?: string;
  time?: string;
  description?: string;
  details?: string;
  note?: string;
}

export type ParentLinkedStudentsResponse = LinkedStudent[];

export default {} as const;
