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



  relationships?: {



    user?: {



      data: {



        id: string;



        type: string;



      };



    };



    course?: {



      data: {



        id: string;



        type: string;



      };



    };



  };



  included?: Array<{



    id: string;



    type: string;



    attributes: Record<string, unknown>;



  }>;



}







// ============================================



// Authentication Types



// ============================================







export interface AuthMeta {



  token: string;



  token_type: string;



  /** ISO datetime or numeric TTL in seconds (register/login meta). */
  expires_at: string | number | null;



  logged_by?: string;



}







export interface RegisterRequest {



  first_name: string;



  last_name: string;



  /** E.164 or local digits as returned by the API (string). */
  phone: string;



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



  role: 'Admin' | 'Doctor' | 'Student' | 'Unknown' | 'Instructor';



  email: string;



  email_verified_at: string | null;



  created_at: string | null;



  updated_at: string | null;



  university_id?: number;



  faculty_id?: number;



  centers?: number[];



  image?: string | null;



  /** When true, user may use course/chapter activation flows (API-dependent). */
  can_use_activations?: boolean;

  //added by mohamed ahmed
  student_code: string;


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



  parent_id?: number;



  parent?: {



    data: {



      id: string;



      type: string;



      attributes: {



        name: string;



        image: string | null;



        created_at?: string;



        updated_at?: string;



      };



    };



  };



  childrens?: Array<{



    id: string;



    type: string;



    attributes: {



      name: string;



      image: string | null;



      code?: string | null;



      stats?: {



        courses: number;



        students: number;



      };



      parent_id?: number;



      created_at?: string;



      updated_at?: string;



    };



  }>;



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



  course_id?: number;



  title: string;



  thumbnail: string;



  video?: string;



  /** HLS master/playlist URL when provided separately from `video`. */
  playlist?: string | null;

  video_hls_url?: string | null;

  video_mp4_url?: string | null;



  duration: string;



  is_free_preview: 0 | 1;

  /** Student attachment/PDF visibility: show when true, hide when false (student UI). */
  is_free_preview_attachment?: 0 | 1 | boolean;



  max_views: number;



  current_user_views: number;



  is_activated: boolean;



  is_locked: boolean;



  can_watch: boolean;



  view_by_minute?: number | null;



  attachments?: Array<{



    id: string;



    type: string;



    attributes: {



      name?: string;



      path?: string;



      extension?: string;



      size?: string;



      downloadable?: boolean;



      created_at?: string;



    };



  }>;



  discussions?: any[];



  quizzes?: Quiz[];



  created_at: string | null;



  updated_at: string | null;



}







export type Chapter = JsonApiData<ChapterAttributes>;







export interface CreateChapterRequest {



  lecture_id?: number;



  title: string;



  thumbnail?: File;



  video?: File;



  duration: string;



  is_free_preview?: 0 | 1;



  /** When true, chapter free-preview includes attachment(s) per API. */
  is_free_preview_attachment?: boolean;



  attachments: File[];



  view_by_minute?: number | null;



  max_views?: number;



}







export interface UpdateChapterRequest {



  lecture_id?: number;



  title?: string;



  thumbnail?: File | null;



  video?: File | null;



  duration?: string;



  is_free_preview?: 0 | 1;



  max_views?: number;



  attachments?: File[];



  removed_attachments?: string[];



  view_by_minute?: number | null;



  view_at?: number | null;



}







// ============================================



// Code Types



// ============================================







export interface CodeAttributes {



  code: string;



  codeable_id: number;



  codeable_type: string;



  is_used: boolean;



  created_at: string | null;



  updated_at: string | null;



}







export type Code = JsonApiData<CodeAttributes>;







export interface CreateCodeRequest {



  codeable_id: number;



  codeable_type: string;



  codes: string[];



}







export interface UpdateCodeRequest {



  codeable_id: number;



  codeable_type: string;



  code: string;



}







export interface ActivateCodeRequest {



  code: string;



  item_id: number;



  item_type: string;



  user_id?: string;



}

/** Payload inside `ApiResponse.data` for `POST /v1/code/activate` (fields vary by backend). */
export interface ActivateCodeResponse {
  message?: string;
  done?: boolean;
  has_activation?: boolean;
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



  /** When true, student sees locked card UI until course is activated. */
  is_locked?: boolean;



  reason: string | null;



  chapter_attachments: any[];



  chapter_discussions: any[];



  category_id?: number;



  doctor_id?: number;



  instructor?: {



    data: {



      id: string;



      type: string;



      attributes: {



        full_name: string;



        image?: string | null;



      };



    };



  };



  category?: {



    data: {



      id: string;



      type: string;



      attributes: {



        image: string | null;



        name: string;



        stats?: {



          courses: number;



          students: number;



        };



        created_at?: string;



        updated_at?: string;



      };



    };



  };



  center?: {



    data: {



      id: string;



      type: string;



      attributes: {



        name: string;



      };



    };



  };



  department?: {



    data: {



      id: string;



      type: string;



      attributes: {



        name: string;



      };



    };



  };



  stats?: {



    lectures: number;



    chapters: number;



    notes: number;



    exams: number;



    students: number;



  };



  lectures?: Lecture[];



  notes?: any[];



  exams?: any[];



  created_at?: string;



  updated_at?: string;



}







export type Course = JsonApiData<CourseAttributes>;







export interface CreateCourseRequest {



  category_id: number;



  doctor_id?: number;



  user_id?: number;



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



  center_id?: number;



  order?: number;



  parent?: {



    data: {



      id: string;



      type: string;



      attributes: {



        name: string;



        image: string | null;



        stats?: {



          courses: number;



          students: number;



        };



        created_at?: string;



        updated_at?: string;



      };



    };



  };



  courses?: any[];



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



  center_id?: number;



  parent_id?: number | null;



  order?: number;



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



  /** e.g. `"text"` for watch-page comments */

  type?: string;



  /** Playback position in seconds (or API-specific unit). */

  moment?: number;



  /** Reply thread; send `null` when not replying. */

  parent_id?: number | null;



}







// ============================================



// Faculty Types



// ============================================







export interface FacultyStats {



  courses: number;



  students: number;



}







export interface FacultyParent {



  data: {



    id: string;



    type: string;



    attributes: {



      image: string | null;



      name: string;



      stats: FacultyStats;



      created_at: string;



      updated_at: string;



    };



  };



}







export interface FacultyAttributes {



  image: string | null;



  name: string;



  stats: FacultyStats;



  parent: FacultyParent;



  created_at: string;



  updated_at: string;



}







export interface Faculty {



  id: string;



  type: string;



  attributes: FacultyAttributes;



}







export interface CreateFacultyRequest {



  name: string;



  parent_id: number;



  image?: File;



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



  order?: number;



  chapters?: Chapter[];



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







export type MaterialType = 'booklet' | 'reference' | 'guide';







export interface AttachmentAttributes {



  name: string;



  path: string;



  extension: string;



  size: string;



  downloadable: boolean;



  created_at: string;



}







export type Attachment = JsonApiData<AttachmentAttributes>;







export interface LibraryAttributes {



  cover_image: string;



  title: string;



  description: string;



  course_id: number;



  material_type: MaterialType;



  code_activation: boolean;



  is_publish: boolean;



  is_locked: boolean;



  price: string;



  attachments: Attachment[];



  created_at: string | null;



  updated_at: string | null;



}







export type Library = JsonApiData<LibraryAttributes>;







export interface CreateLibraryRequest {



  cover_image: File;



  title: string;



  description: string;



  attachment: File;



  course_id: number;



  material_type: MaterialType;



  code_activation?: boolean;



  is_publish?: boolean;



  is_locked?: boolean;



  price: number;



}







export interface UpdateLibraryRequest {



  cover_image?: File;



  title?: string;



  description?: string;



  attachment?: File;



  course_id?: number;



  material_type?: MaterialType;



  code_activation?: boolean;



  is_publish?: boolean;



  is_locked?: boolean;



  price?: number;



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



  max_join_time: number | null;



  status?: 'pending' | 'live' | 'ended';



  enable_chat?: boolean;



  enable_recording?: boolean;



  chapter_id?: number | null;



  chapter?: {



    data: {



      id: string;



      type: string;



      attributes: {



        title: string;



      };



    };



  };



  user?: {



    data: {



      id: string;



      type: string;



      attributes: {



        first_name: string;



        last_name: string;



        full_name: string;



      };



    };



  };



  course?: {



    data: {



      id: string;



      type: string;



      attributes: {



        title: string;



      };



    };



  };



  created_at: string | null;



  updated_at: string | null;



}







export type LiveRoom = JsonApiData<LiveRoomAttributes>;







export interface CreateLiveRoomRequest {



  course_id: number;



  title: string;



  description?: string;



  started_at: string;



  ended_at?: string;



  max_students?: number;



  max_join_time?: number | null;



  enable_chat?: boolean;



  enable_recording?: boolean;



  chapter_id?: number | null;



}







export interface UpdateLiveRoomRequest {



  title?: string;



  description?: string;



  started_at?: string;



  ended_at?: string;



  max_students?: number;



  max_join_time?: number | null;



  enable_chat?: boolean;



  enable_recording?: boolean;



  chapter_id?: number | null;



}







// Note Types



// ============================================







export type NoteType = 'summary' | 'highlight' | 'key_point' | 'important_notice';







export interface NoteAttributes {



  title: string;



  type: NoteType;



  content: string;



  course_id?: number;



  linked_lecture?: string;



  is_publish?: boolean;



  user_id?: number;



  attachment?: {



    id: number;



    name: string;



    url: string;



    extension: string;



    size: string;



    downloadable: boolean;



  };



  created_at: string | null;



  updated_at: string | null;



}







export type Note = JsonApiData<NoteAttributes>;







export interface CreateNoteRequest {



  title: string;



  type: NoteType;



  content: string;



  course_id?: number;



  linked_lecture?: string;



  is_publish?: boolean;



  attachment?: File;



}







export interface UpdateNoteRequest {



  title?: string;



  type?: NoteType;



  content?: string;



  course_id?: number;



  linked_lecture?: string;



  is_publish?: boolean;



}







// ============================================



// Post Types



// ============================================







export interface PostAttributes {



  title: string;



  content: string;



  image?: string | null;



  /** Some API variants expose the URL under a different key. */
  image_url?: string | null;



  thumbnail?: string | null;



  /** File URL or nested `{ url }` from API. */
  attachment?: string | { url?: string | null; path?: string | null } | unknown[] | null;



  attachments?: { url?: string | null; path?: string | null }[];



  status: 'draft' | 'published';



  type: 'post' | 'question' | 'summary';



  /** When set, post belongs to this course (community / course tab). */
  course_id?: number;



  tags: string[];



  reactions_count: number;



  user_reaction: string | null;



  parent_id?: number | null;



  comments_count?: number;



  created_at: string | null;



  updated_at: string | null;



  user?: {



    data: {



      id: string;



      type: string;



      attributes: {



        student_id: string;



        first_name: string;



        last_name: string;



        full_name: string;



        role: string;



      };



    };



  };



  children?: Post[];



}







export type Post = JsonApiData<PostAttributes>;







export interface CreatePostRequest {



  title?: string;



  content?: string;



  image?: File;



  status?: 'draft' | 'published';



  type?: 'post' | 'question' | 'summary';



  tags?: string[];



  parent_id?: number | null;



  /** Associate a new top-level post with a course (multipart create). */
  course_id?: number;



}







// ============================================



// Comment Types



// ============================================







export interface CommentAttributes {



  parent_id: number;



  user_id: string;



  content: string;



  created_at: string | null;



  updated_at: string | null;



  user?: {



    data: {



      id: string;



      type: string;



      attributes: {



        first_name: string;



        last_name: string;



        full_name: string;



        role: string;



      };



    };



  };



}







export type Comment = JsonApiData<CommentAttributes>;







export interface CreateCommentRequest {



  /** Redundant with `commentsApi.create(parentId, …)`; optional for callers that still pass it. */
  parent_id?: number;



  content: string;



  /** Defaults to a trimmed prefix of `content` when omitted. */
  title?: string;



  status?: 'draft' | 'published';



  type?: 'post' | 'question' | 'summary';



  tags?: string[];



}







// ============================================



// Social Link Types



// ============================================







export interface SocialLinkAttributes {



  course_id?: number;

  courses?: { id: string; type: string; attributes: Record<string, unknown> }[];



  icon: string | null;



  link: string;



  title: string;



  subtitle: string;



  color: string;



  status: boolean;



  created_at: string | null;



  updated_at: string | null;



}







export type SocialLink = JsonApiData<SocialLinkAttributes>;







export interface CreateSocialLinkRequest {



  course_id?: number;

  course_ids?: number[];



  icon?: File | null;



  link: string;



  title: string;



  subtitle: string;



  color: string;



  status: boolean;



}







// ============================================



// Quiz & Exam Types



// ============================================







export type QuizType = 'exam' | 'homework';







export interface QuizAttributes {



  chapter_id: number | null;



  course_id?: number;



  title: string;



  description?: string;



  type: QuizType;



  duration: number;



  total_marks: number;



  passing_marks: number;



  max_attempts: number;



  is_public: boolean;



  has_activation?: boolean | number | string;



  status?: 'draft' | 'active';



  start_time: string | null;



  end_time: string | null;



  /** When false, API may restrict access; student UI can still show intro with messaging. */
  can_view?: boolean;



  created_at: string | null;



  updated_at: string | null;



  questions?: QuizQuestion[];



}







export type Quiz = JsonApiData<QuizAttributes>;







export interface CreateQuizRequest {



  chapter_id?: number;



  course_id: number;



  title: string;



  description?: string;



  type: QuizType;



  duration: number;



  total_marks?: number;



  passing_marks?: number;



  max_attempts?: number;



  is_public?: boolean;



  status?: 'draft' | 'active';



  start_time?: string | null;



  end_time?: string | null;



  questions?: CreateQuizQuestionRequest[];



}







// ============================================



// Quiz Question Types



// ============================================







export type QuestionType = 'single_choice' | 'multiple_choice' | 'true_false' | 'short_answer';







export interface QuizQuestionAttributes {



  quiz_id: number;



  text: string;



  type: QuestionType;



  score: number;



  /** Question image URL when present on the resource. */
  image?: string | null;



  auto_correct?: boolean;



  answers?: QuizQuestionAnswer[];



  created_at: string | null;



}







export type QuizQuestion = JsonApiData<QuizQuestionAttributes>;







export interface QuizQuestionAnswerAttributes {



  id: number;



  quiz_question_id: number;



  text: string;



  /** Answer image URL when present on the resource. */
  image?: string | null;



  is_correct: boolean;



  /** Optional per-option explanation shown after submission / in review. */
  reason?: string | null;



  created_at: string | null;



}







export type QuizQuestionAnswer = JsonApiData<QuizQuestionAnswerAttributes>;







export interface QuizAnswerRequest {



  text: string;



  is_correct?: boolean;



  /** Optional per-option explanation (matches QuizQuestionAnswerAttributes.reason). */
  reason?: string | null;



}







export interface CreateQuizQuestionRequest {



  quiz_id?: number;



  text: string;



  type: QuestionType;



  score: number;



  auto_correct?: boolean;



  answers?: QuizAnswerRequest[];



  order?: number;



}







// ============================================



// Quiz Attempt Types



// ============================================







export interface QuizAttemptAttributes {



  quiz_id: number;



  user_id: number | string;



  started_at: string;



  submitted_at?: string | null;



  finished_at?: string | null;



  score: number | null;



  total_score?: number | null;



  percentage?: number | null;



  /** When present on list/detail payloads, use for pass/fail UI. */
  passed?: boolean | null;



  status?: 'in_progress' | 'submitted' | 'graded';



  created_at: string | null;



  updated_at?: string | null;



  /** When provided by the API after finish, used for the attempts banner. */
  attempts_remaining?: number | null;



  /** Included on some payloads (e.g. list with nested quiz). */
  quiz?: unknown;



}







export type QuizAttempt = JsonApiData<QuizAttemptAttributes>;







export interface StartQuizAttemptRequest {



  quiz_id: number;



}







/** Body for PUT `/v1/quiz-attempt/{id}` (finish attempt). */
export interface FinishQuizAttemptRequest {



  score: number;



  total_score: number;



}



/** One answer row inside a `correct_answers` entry (may include extra keys from API). */
export interface QuizFinishAnswerReview {



  text?: string | null;



  image?: string | null;



  reason?: string | null;



}



/** One question row in the finish response `correct_answers` array. */
export interface QuizFinishCorrectAnswerEntry {



  question_text?: string | null;



  question_image?: string | null;



  correct_answer_ids?: (string | number)[] | null;



  correct_answers?: QuizFinishAnswerReview[] | null;



  [key: string]: unknown;



}



export interface QuizFinishResultsBlock {



  score: number;



  total_score: number;



  percentage: number;



  passed: boolean;



  finished_at: string;



  time_taken: number;



}



export interface QuizFinishQuizInfo {



  title: string;



  passing_marks: number;



  total_marks: number;



}



/** Response from PUT `/v1/quiz-attempt/{attemptId}` after finish. */
export interface FinishQuizAttemptResponse {



  attempt: {



    data?: QuizAttempt | null;



  };



  results: QuizFinishResultsBlock;



  quiz_info: QuizFinishQuizInfo;



  correct_answers?: QuizFinishCorrectAnswerEntry[] | null;



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



  image: string | null;



  created_at: string | null;



  updated_at: string | null;



}







export type University = JsonApiData<UniversityAttributes>;







export interface CreateUniversityRequest {



  name: string;



  code?: string;



  image?: File;



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







export type StudentStatus = 0 | 1 | 2;







export const StudentStatusLabels: Record<StudentStatus, string> = {



  0: 'Inactive',



  1: 'Active',



  2: 'Suspended'



};







export const StudentStatusValues: Record<string, StudentStatus> = {



  'inactive': 0,



  'active': 1,



  'suspended': 2,



  'Inactive': 0,



  'Active': 1,



  'Suspended': 2,



  '0': 0,



  '1': 1,



  '2': 2,



  '': 1



};







export const parseStudentStatus = (status: string | number | undefined | null): StudentStatus => {



  if (status === undefined || status === null) return 1;



  if (typeof status === 'number') return status as StudentStatus;



  return StudentStatusValues[status] ?? 1;



};







export const getStudentStatusColor = (status: StudentStatus | undefined): string => {



  switch (status) {



    case 0: return 'red';



    case 1: return 'emerald';



    case 2: return 'orange';



    default: return 'slate';



  }



};







export const getStudentStatusStyles = (status: StudentStatus | undefined): { bg: string; text: string; border: string } => {



  switch (status) {



    case 0:



      return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100' };



    case 1:



      return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' };



    case 2:



      return { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' };



    default:



      return { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100' };



  }



};







export interface StudentAttributes extends Omit<UserAttributes, 'centers'> {



  student_id?: string;



  student_code: string;



  full_name?: string;



  image?: string | null;



  status?: StudentStatus;



  joined?: string;

  specialization?: string;



  university?: {



    data: University;



  } | null;



  faculty?: {



    data: Faculty;



  } | null;



  centers: JsonApiData<Center>[];



  enrolled_courses?: any[];



  exam_results?: any[];



  quizzes?: any[];



  activity_stats?: {



    notes_created: number;



    downloads: number;



    live_attendance: number;



    community_posts: number;



  };



  device_access?: {



    device: string;



    last_ip: string;



  };



  /** When set, instructor may use course activation flows (API-dependent). */
  can_use_activations?: boolean;



  used_codes?: Code[];



}







export type Student = JsonApiData<StudentAttributes>;







export interface CreateStudentRequest {



  first_name: string;



  last_name: string;



  phone?: string;



  email: string;



  password?: string;



  university_id?: number;



  faculty_id?: number;



  center_id?: number | null;



  center_ids?: number[];

  specialization?: string;



  course_ids?: number[];



  status?: StudentStatus;



  /** Instructor-only: allow activation-related features. */
  can_use_activations?: boolean;



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







// ============================================



// Platform Feature Types (General Settings)



// ============================================







export interface PlatformFeatureAttributes {



  key: string;



  value: string;



  group: string;



  type: string;



  created_at?: string;



  updated_at?: string;



}







export type PlatformFeature = JsonApiData<PlatformFeatureAttributes>;







export type PlatformFeaturesResponse = ApiListResponse<PlatformFeature>;







export interface UpdatePlatformFeatureRequest {



  key: string;



  value: string;



}







// ============================================



// App Version Types (OTA)



// ============================================







export interface AppVersionAttributes {



  id: number;



  version_name: string;



  version_code: number;



  release_notes: string | null;



  download_url: string;



  file_size: number;



  file_size_human: string;



  is_force_update: boolean;



  released_at: string;



  created_at: string;



  updated_at: string;



}







export type AppVersion = JsonApiData<AppVersionAttributes>;







export interface CreateAppVersionRequest {



  version_name: string;



  version_code: number;



  release_notes?: string;



  apk_file: File;



  is_force_update?: boolean;



}



