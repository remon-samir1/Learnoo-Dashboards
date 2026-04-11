// ============================================
// Base Types & Common Interfaces
// ============================================

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta | AuthMeta;
  message?: string;
}

export interface ApiListResponse<T> {
  data: T[];
  meta?: PaginationMeta;
  links?: PaginationLinks;
}

export interface PaginationMeta {
  current_page: number;
  from: number;
  last_page: number;
  per_page: number;
  to: number;
  total: number;
}

export interface PaginationLinks {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
}

export interface ValidationError {
  message: string;
  errors: Record<string, string[]>;
}

// JSON:API format
export interface JsonApiData<T> {
  id: string;
  type: string;
  attributes: T;
}

// ============================================
// Authentication Types
// ============================================

export interface AuthMeta {
  token: string;
  token_type: string;
  expires_at: string | null;
  logged_by?: string;
}

export interface RegisterRequest {
  first_name: string;
  last_name: string;
  phone?: number;
  email: string;
  password: string;
  device_name: string;
}

export interface LoginRequest {
  phone_or_email: string;
  password: string;
  device_name: string;
}

export interface ForgotPasswordRequest {
  phone_or_email: string;
}

export interface ResetPasswordRequest {
  type: 'verify' | 'reset';
  code: string;
  phone_or_email: string;
  password: string;
  password_confirmation: string;
}

export interface UpdateUserRequest {
  first_name: string;
  last_name: string;
  university_id: number;
  centers: number[];
  faculty_id: number;
  phone?: number;
  email?: string;
  password?: string;
  device_name?: string;
}

// ============================================
// User Types
// ============================================

export interface UserAttributes {
  first_name: string;
  last_name: string;
  phone: string | null;
  role: 'Admin' | 'Doctor' | 'Student' | 'Unknown';
  email: string;
  email_verified_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  university_id?: number;
  faculty_id?: number;
  centers?: number[];
}

export type User = JsonApiData<UserAttributes>;

export interface PersonalAccessTokenAttributes {
  name: string;
  abilities: string[];
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  is_current: boolean;
}

export type PersonalAccessToken = JsonApiData<PersonalAccessTokenAttributes>;

// ============================================
// Center Types
// ============================================

export interface Center {
  id: string;
  name: string;
  image: string | null;
  parent_id?: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateCenterRequest {
  image?: File;
  name: string;
  parent_id?: number;
}

// ============================================
// Chapter Types
// ============================================

export interface ChapterAttributes {
  lecture_id: number;
  title: string;
  thumbnail: string;
  duration: string;
  is_free_preview: 0 | 1;
  max_views: number;
  current_user_views: number;
  is_activated: boolean;
  is_locked: boolean;
  can_watch: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export type Chapter = JsonApiData<ChapterAttributes>;

export interface CreateChapterRequest {
  lecture_id: number;
  title: string;
  thumbnail?: File;
  duration: string;
  is_free_preview?: 0 | 1;
  attachments: File[];
}

export interface UpdateChapterRequest {
  lecture_id?: number;
  title?: string;
  thumbnail?: File;
  duration?: string;
  is_free_preview?: 0 | 1;
  attachments?: File[];
}

// ============================================
// Code Types
// ============================================

export interface CodeAttributes {
  code: string;
  codeable_id: number;
  codeable_type: string;
  created_at: string | null;
  updated_at: string | null;
}

export type Code = JsonApiData<CodeAttributes>;

export interface CreateCodeRequest {
  codeable_id: number;
  codeable_type: string;
  codes: string[];
}

export interface ActivateCodeRequest {
  code: string;
  item_id: number;
  item_type: 'chapter' | 'course' | 'library';
}

// ============================================
// Course Types
// ============================================

export type CourseVisibility = 'public' | 'private';
export type CourseApproval = 0 | 1;
export type CourseStatus = 0 | 1;

export interface CourseAttributes {
  title: string;
  sub_title: string;
  description: string;
  thumbnail: string;
  objectives: string;
  price: number;
  max_views_per_student: number;
  visibility: CourseVisibility;
  approval: CourseApproval;
  status: CourseStatus;
  reason: string | null;
  chapter_attachments: any[];
  chapter_discussions: any[];
  category_id?: number;
  doctor_id?: number;
  created_at?: string;
  updated_at?: string;
}

export type Course = JsonApiData<CourseAttributes>;

export interface CreateCourseRequest {
  category_id: number;
  doctor_id?: number;
  title: string;
  sub_title: string;
  description: string;
  thumbnail: File;
  objectives: string;
  price: number;
  max_views_per_student?: number;
  visibility: string;
  status: CourseStatus;
  attachments?: File[];
  video?: File;
}

export interface UpdateCourseRequest {
  title?: string;
  sub_title?: string;
  description?: string;
  thumbnail?: File;
  objectives?: string;
  price?: number;
  max_views_per_student?: number;
  visibility: CourseVisibility;
  status?: CourseStatus;
  category_id?: number;
  doctor_id?: number;
  attachments?: File[];
  video?: File;
}

// ============================================
// Department Types
// ============================================

export interface DepartmentAttributes {
  name: string;
  image: string | null;
  code?: string | null;
  faculty_id: number;
  stats?: {
    courses: number;
    students: number;
  };
  created_at: string | null;
  updated_at: string | null;
}

export type Department = JsonApiData<DepartmentAttributes>;

export interface CreateDepartmentRequest {
  name: string;
  image?: File;
  code?: string;
  faculty_id: number;
}

// ============================================
// Discussion Types
// ============================================

export interface DiscussionAttributes {
  user_id: number;
  chapter_id: number;
  content: string;
  created_at: string | null;
  updated_at: string | null;
}

export type Discussion = JsonApiData<DiscussionAttributes>;

export interface CreateDiscussionRequest {
  chapter_id: number;
  content: string;
}

// ============================================
// Faculty Types
// ============================================

export interface FacultyAttributes {
  name: string;
  code: string | null;
  university_id: number;
  created_at: string | null;
  updated_at: string | null;
}

export type Faculty = JsonApiData<FacultyAttributes>;

export interface CreateFacultyRequest {
  name: string;
  code?: string;
  university_id: number;
}

// ============================================
// Language Types
// ============================================

export interface LanguageAttributes {
  name: string;
  code: string;
  created_at: string | null;
  updated_at: string | null;
}

export type Language = JsonApiData<LanguageAttributes>;

// ============================================
// Lecture Types
// ============================================

export interface LectureAttributes {
  course_id: number;
  title: string;
  thumbnail: string;
  description: string;
  created_at: string | null;
  updated_at: string | null;
}

export type Lecture = JsonApiData<LectureAttributes>;

export interface CreateLectureRequest {
  course_id: number;
  title: string;
  thumbnail?: File;
  description: string;
}

// ============================================
// Level Types
// ============================================

export interface LevelAttributes {
  name: string;
  description: string;
  created_at: string | null;
  updated_at: string | null;
}

export type Level = JsonApiData<LevelAttributes>;

// ============================================
// Library Types
// ============================================

export interface LibraryAttributes {
  title: string;
  description: string;
  thumbnail: string;
  file_path: string;
  price: number;
  visibility: CourseVisibility;
  created_at: string | null;
  updated_at: string | null;
}

export type Library = JsonApiData<LibraryAttributes>;

export interface CreateLibraryRequest {
  title: string;
  description: string;
  thumbnail: File;
  file: File;
  price: number;
  visibility: CourseVisibility;
}

// ============================================
// Live Room Types
// ============================================

export interface LiveRoomAttributes {
  title: string;
  description: string;
  started_at: string;
  ended_at: string;
  max_students: number;
  max_join_time: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export type LiveRoom = JsonApiData<LiveRoomAttributes>;

export interface CreateLiveRoomRequest {
  course_id?: number;
  title: string;
  description?: string;
  started_at: string;
  ended_at: string;
  max_students?: number;
  max_join_time?: string | null;
}

// ============================================
// Note Types
// ============================================

export interface NoteAttributes {
  user_id: number;
  chapter_id: number;
  content: string;
  timestamp: string;
  created_at: string | null;
  updated_at: string | null;
}

export type Note = JsonApiData<NoteAttributes>;

export interface CreateNoteRequest {
  chapter_id: number;
  content: string;
  timestamp: string;
}

// ============================================
// Post Types
// ============================================

export interface PostAttributes {
  title: string;
  content: string;
  image: string | null;
  user_id: number;
  likes_count: number;
  comments_count: number;
  created_at: string | null;
  updated_at: string | null;
}

export type Post = JsonApiData<PostAttributes>;

export interface CreatePostRequest {
  title: string;
  content: string;
  image?: File;
}

// ============================================
// Quiz & Exam Types
// ============================================

export type QuizType = 'quiz' | 'exam';

export interface QuizAttributes {
  chapter_id: number | null;
  title: string;
  description: string;
  type: QuizType;
  duration: number;
  total_marks: number;
  passing_marks: number;
  max_attempts: number;
  is_published: boolean;
  start_time: string | null;
  end_time: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export type Quiz = JsonApiData<QuizAttributes>;

export interface CreateQuizRequest {
  chapter_id?: number;
  title: string;
  description: string;
  type: QuizType;
  duration: number;
  total_marks: number;
  passing_marks: number;
  max_attempts?: number;
  is_published?: boolean;
  start_time?: string;
  end_time?: string;
}

// ============================================
// Quiz Question Types
// ============================================

export type QuestionType = 'mcq' | 'true_false' | 'short_answer' | 'essay';

export interface QuizQuestionAttributes {
  quiz_id: number;
  question: string;
  type: QuestionType;
  options: string[] | null;
  correct_answer: string;
  marks: number;
  order: number;
  created_at: string | null;
  updated_at: string | null;
}

export type QuizQuestion = JsonApiData<QuizQuestionAttributes>;

export interface CreateQuizQuestionRequest {
  quiz_id: number;
  question: string;
  type: QuestionType;
  options?: string[];
  correct_answer: string;
  marks: number;
  order?: number;
}

// ============================================
// Quiz Attempt Types
// ============================================

export interface QuizAttemptAttributes {
  quiz_id: number;
  user_id: number;
  started_at: string;
  submitted_at: string | null;
  score: number | null;
  status: 'in_progress' | 'submitted' | 'graded';
  created_at: string | null;
  updated_at: string | null;
}

export type QuizAttempt = JsonApiData<QuizAttemptAttributes>;

export interface StartQuizAttemptRequest {
  quiz_id: number;
}

export interface SubmitQuizAttemptRequest {
  answers: {
    question_id: number;
    answer: string;
  }[];
}

// ============================================
// Quiz Answer Types
// ============================================

export interface QuizAnswerAttributes {
  attempt_id: number;
  question_id: number;
  answer: string;
  is_correct: boolean;
  marks_obtained: number;
  created_at: string | null;
  updated_at: string | null;
}

export type QuizAnswer = JsonApiData<QuizAnswerAttributes>;

// ============================================
// University Types
// ============================================

export interface UniversityAttributes {
  name: string;
  code: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export type University = JsonApiData<UniversityAttributes>;

export interface CreateUniversityRequest {
  name: string;
  code?: string;
}

// ============================================
// User Progress Types
// ============================================

export interface UserProgressAttributes {
  user_id: number;
  chapter_id: number;
  progress_percentage: number;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export type UserProgress = JsonApiData<UserProgressAttributes>;

// ============================================
// Student Types
// ============================================

export interface StudentAttributes extends Omit<UserAttributes, 'centers'> {
  university?: {
    data: University;
  } | null;
  faculty?: {
    data: Faculty;
  } | null;
  centers: JsonApiData<Center>[];
}

export type Student = JsonApiData<StudentAttributes>;

export interface CreateStudentRequest {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  password?: string;
  university_id: number;
  faculty_id: number;
  center_id?: number | null;
  center_ids?: number[];
  course_ids?: number[];
  status?: string;
  image?: File;
}

// ============================================
// Search Types
// ============================================

export interface SearchRequest {
  q: string;
  type?: 'course' | 'chapter' | 'lecture' | 'library' | 'user';
}

export interface SearchResult {
  id: string;
  type: string;
  title: string;
  description?: string;
}

// ============================================
// Dashboard Types
// ============================================

export interface StatItem {
  value: number | string;
  growth: number | string;
  trend: 'up' | 'down' | string;
}

export interface DashboardStats {
  total_students: StatItem;
  total_courses: StatItem;
  active_courses: StatItem;
  live_sessions_today: StatItem;
  notes_created: StatItem;
  monthly_revenue: StatItem;
  community_posts: StatItem;
}


export interface ActivityData {
  date: string;
  students: number;
  revenue: number;
  engagement?: number;
}

export interface EngagementData {
  category: string;
  value: number;
}

export interface RecentActivityItem {
  id?: string;
  type?: string;
  message?: string;
  title?: string;
  timestamp?: string;
  time?: string;
  color?: string;
  icon?: string;
  user?: {
    name?: string;
    avatar?: string;
  };
}
