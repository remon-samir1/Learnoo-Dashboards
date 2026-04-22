import Cookies from 'js-cookie';
import type {
  ApiResponse,
  ApiListResponse,
  ValidationError,
  // Auth types
  RegisterRequest,
  LoginRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UpdateUserRequest,
  User,
  PersonalAccessToken,
  AuthMeta,
  // Center types
  Center,
  CreateCenterRequest,
  // Chapter types
  Chapter,
  CreateChapterRequest,
  UpdateChapterRequest,
  // Code types
  Code,
  CreateCodeRequest,
  ActivateCodeRequest,
  // Course types
  Course,
  CreateCourseRequest,
  UpdateCourseRequest,
  // Department types
  Department,
  CreateDepartmentRequest,
  // Discussion types
  Discussion,
  CreateDiscussionRequest,
  // Faculty types
  Faculty,
  CreateFacultyRequest,
  // Language types
  Language,
  // Lecture types
  Lecture,
  CreateLectureRequest,
  // Level types
  Level,
  // Library types
  Library,
  CreateLibraryRequest,
  // Live Room types
  LiveRoom,
  CreateLiveRoomRequest,
  UpdateLiveRoomRequest,
  // Note types
  Note,
  CreateNoteRequest,
  // Post types
  Post,
  CreatePostRequest,
  // Social Link types
  SocialLink,
  CreateSocialLinkRequest,
  // Comment types
  Comment,
  CreateCommentRequest,
  // Quiz types
  Quiz,
  CreateQuizRequest,
  QuizQuestion,
  CreateQuizQuestionRequest,
  QuizAttempt,
  StartQuizAttemptRequest,
  SubmitQuizAttemptRequest,
  // University types
  University,
  CreateUniversityRequest,
  // User Progress types
  UserProgress,
  // Student types
  Student,
  CreateStudentRequest,
  StudentStatus,
  // Dashboard types
  DashboardStats,
  ActivityData,
  RecentActivityItem,
  // Platform Feature types
  PlatformFeature,
  UpdatePlatformFeatureRequest,
  // App Version types
  AppVersion,
  CreateAppVersionRequest,
} from '@/src/types';

// ============================================
// Configuration
// ============================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.learnoo.app';

// ============================================
// Error Handling
// ============================================

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function isValidationError(error: unknown): error is ValidationError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'errors' in error &&
    typeof (error as ValidationError).errors === 'object'
  );
}

// ============================================
// Request Helpers
// ============================================

function getAuthToken(): string | undefined {
  return Cookies.get('token');
}

function buildUrl(path: string): string {
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

async function handleResponse<T>(response: Response, skipAuthRedirect: boolean = false): Promise<T> {
  if (!response.ok) {
    // Handle unauthorized errors - redirect to login (unless skipped)
    if ((response.status === 401 || response.status === 403) && !skipAuthRedirect) {
      // Clear auth cookies
      Cookies.remove('token');
      Cookies.remove('user_role');
      Cookies.remove('user_data');

      // Redirect to login if in browser
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorData.message || `HTTP ${response.status}: ${response.statusText}`,
      errorData.errors
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

function createHeaders(includeAuth: boolean = true, isMultipart: boolean = false): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }

  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
}

// ============================================
// HTTP Methods
// ============================================

async function get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
  const url = new URL(buildUrl(path));
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: createHeaders(),
  });

  return handleResponse<T>(response);
}

async function post<T>(path: string, data?: unknown, includeAuth: boolean = true): Promise<T> {
  const response = await fetch(buildUrl(path), {
    method: 'POST',
    headers: createHeaders(includeAuth),
    body: data ? JSON.stringify(data) : undefined,
  });

  return handleResponse<T>(response);
}

async function postMultipart<T>(path: string, formData: FormData, onProgress?: (progress: number) => void): Promise<T> {
  // Use XMLHttpRequest for progress tracking, fallback to fetch if no progress callback
  if (onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const url = buildUrl(path);
      const headers = createHeaders(true, true) as Record<string, string>;

      xhr.open('POST', url, true);

      // Set headers
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = xhr.response ? JSON.parse(xhr.response) : undefined;
            resolve(data as T);
          } catch {
            resolve(undefined as T);
          }
        } else {
          try {
            const errorData = xhr.response ? JSON.parse(xhr.response) : {};
            reject(new ApiError(
              xhr.status,
              errorData.message || `HTTP ${xhr.status}: ${xhr.statusText}`,
              errorData.errors
            ));
          } catch {
            reject(new ApiError(xhr.status, `HTTP ${xhr.status}: ${xhr.statusText}`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new ApiError(0, 'Network error occurred'));
      });

      xhr.send(formData);
    });
  }

  // Fallback to fetch if no progress callback
  const response = await fetch(buildUrl(path), {
    method: 'POST',
    headers: createHeaders(true, true),
    body: formData,
  });

  return handleResponse<T>(response);
}

async function put<T>(path: string, data?: unknown, isMultipart: boolean = false): Promise<T> {
  const response = await fetch(buildUrl(path), {
    method: 'PUT',
    headers: createHeaders(true, isMultipart),
    body: data ? (isMultipart ? (data as FormData) : JSON.stringify(data)) : undefined,
  });

  return handleResponse<T>(response);
}

async function putMultipart<T>(path: string, formData: FormData, onProgress?: (progress: number) => void): Promise<T> {
  // Use XMLHttpRequest for progress tracking, fallback to fetch if no progress callback
  if (onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const url = buildUrl(path);
      const headers = createHeaders(true, true) as Record<string, string>;

      xhr.open('PUT', url, true);

      // Set headers
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = xhr.response ? JSON.parse(xhr.response) : undefined;
            resolve(data as T);
          } catch {
            resolve(undefined as T);
          }
        } else {
          try {
            const errorData = xhr.response ? JSON.parse(xhr.response) : {};
            reject(new ApiError(
              xhr.status,
              errorData.message || `HTTP ${xhr.status}: ${xhr.statusText}`,
              errorData.errors
            ));
          } catch {
            reject(new ApiError(xhr.status, `HTTP ${xhr.status}: ${xhr.statusText}`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new ApiError(0, 'Network error occurred'));
      });

      xhr.send(formData);
    });
  }

  // Fallback to fetch if no progress callback
  return put<T>(path, formData, true);
}

async function del<T>(path: string): Promise<T> {
  const response = await fetch(buildUrl(path), {
    method: 'DELETE',
    headers: createHeaders(),
  });

  return handleResponse<T>(response);
}

// ============================================
// FormData Builders
// ============================================

function buildFormData(data: Record<string, unknown>): FormData {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (value instanceof File) {
      formData.append(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item instanceof File) {
          formData.append(`${key}[${index}]`, item);
        } else if (typeof item === 'boolean') {
          formData.append(`${key}[${index}]`, item ? '1' : '0');
        } else if (typeof item === 'number') {
          formData.append(`${key}[${index}]`, String(item));
        } else {
          formData.append(`${key}[]`, String(item));
        }
      });
    } else if (typeof value === 'boolean') {
      formData.append(key, value ? '1' : '0');
    } else if (typeof value === 'number') {
      formData.append(key, String(value));
    } else {
      formData.append(key, String(value));
    }
  });

  return formData;
}

// ============================================
// Auth API
// ============================================

export const authApi = {
  register: (data: RegisterRequest) =>
    post<ApiResponse<User> & { meta: AuthMeta }>('/v1/auth/register', data, false),

  login: (data: LoginRequest) =>
    post<ApiResponse<User> & { meta: AuthMeta }>('/v1/auth/login', data, false),

  logout: () => post<undefined>('/v1/auth/logout'),

  me: () => get<ApiResponse<User>>('/v1/auth/me'),

  update: (data: UpdateUserRequest) =>
    put<ApiResponse<User>>('/v1/auth/update', data),

  forgotPassword: (data: ForgotPasswordRequest) =>
    post<ApiResponse<{ message: string }>>('/v1/auth/password/forgot', data, false),

  resetPassword: (data: ResetPasswordRequest) =>
    post<ApiResponse<{ message: string }>>('/v1/auth/password/reset', data, false),

  listTokens: () => get<ApiListResponse<PersonalAccessToken>>('/v1/auth/tokens'),

  revokeAllTokens: () => del<undefined>('/v1/auth/tokens'),

  revokeToken: (tokenId: number) =>
    del<undefined>(`/v1/auth/tokens/${tokenId}`),

  sendEmailVerification: () =>
    post<ApiResponse<{ message: string }>>('/v1/auth/email/verification-notification'),

  sendPhoneVerification: () =>
    post<ApiResponse<{ message: string }>>('/v1/auth/phone/verification-notification'),

  verifyEmail: (code: string) =>
    post<ApiResponse<{ message: string }>>('/v1/auth/email/verify', { code }),
};

// ============================================
// Centers API
// ============================================

export const centersApi = {
  list: () => get<ApiResponse<Center[]>>('/v1/center'),

  get: (id: number) => get<ApiResponse<Center>>(`/v1/center/${id}`),

  create: (data: CreateCenterRequest, onProgress?: (progress: number) => void) => {
    const formData = buildFormData(data as unknown as Record<string, unknown>);
    return postMultipart<ApiResponse<Center>>('/v1/center', formData, onProgress);
  },

  update: (id: number, data: Partial<CreateCenterRequest>, onProgress?: (progress: number) => void) => {
    const formData = buildFormData(data as unknown as Record<string, unknown>);
    return putMultipart<ApiResponse<Center>>(`/v1/center/${id}`, formData, onProgress);
  },

  delete: (id: number) => del<ApiResponse<Center>>(`/v1/center/${id}`),
};

// ============================================
// Chapters API
// ============================================

export const chaptersApi = {
  list: (params?: { lecture_id?: number | string }) => get<ApiListResponse<Chapter>>('/v1/chapter', params),

  get: (id: number) => get<ApiResponse<Chapter>>(`/v1/chapter/${id}`),

  create: (data: CreateChapterRequest, onProgress?: (progress: number) => void) => {
    const formData = buildFormData(data as unknown as Record<string, unknown>);
    return postMultipart<ApiResponse<Chapter>>('/v1/chapter', formData, onProgress);
  },

  update: (id: number, data: UpdateChapterRequest, onProgress?: (progress: number) => void) => {
    const formData = buildFormData(data as unknown as Record<string, unknown>);
    return putMultipart<ApiResponse<Chapter>>(`/v1/chapter/${id}`, formData, onProgress);
  },

  delete: (id: number) => del<ApiResponse<Chapter>>(`/v1/chapter/${id}`),

  copy: (id: number, lectureId?: number) => post<ApiResponse<Chapter>>(`/v1/chapter/${id}/copy`, { lecture_id: lectureId }),
};

// ============================================
// Codes API
// ============================================

export const codesApi = {
  list: () => get<ApiListResponse<Code>>('/v1/code'),

  get: (id: number) => get<ApiResponse<Code>>(`/v1/code/${id}`),

  create: (data: CreateCodeRequest) =>
    post<ApiListResponse<Code>>('/v1/code', data),

  update: (id: number, data: Partial<CreateCodeRequest>) =>
    put<ApiResponse<Code>>(`/v1/code/${id}`, data),

  delete: (id: number) => del<ApiResponse<Code>>(`/v1/code/${id}`),

  activate: (data: ActivateCodeRequest) =>
    post<ApiResponse<{ message: string }>>('/v1/code/activate', data),
};

// ============================================
// Pre-activation API
// ============================================

export interface PreActivationUploadRequest {
  item_id: number;
  item_type: 'course' | 'chapter' | 'library';
  file: File;
}

export interface PreActivation {
  id: number;
  attributes: {
    item_id: number;
    item_type: string;
    phone: string;
    code: string;
    status: 'pending' | 'activated' | 'failed';
    student_id?: number;
    created_at: string;
  };
}

export const preActivationApi = {
  upload: (data: PreActivationUploadRequest) => {
    const formData = new FormData();
    formData.append('item_id', data.item_id.toString());
    formData.append('item_type', data.item_type);
    formData.append('file', data.file);
    return postMultipart<ApiResponse<{ message: string; count: number }>>('/v1/pre-activation/upload', formData);
  },

  list: (itemId?: number, itemType?: string) =>
    get<ApiListResponse<PreActivation>>('/v1/pre-activation', itemId && itemType ? { item_id: itemId, item_type: itemType } : undefined),

  delete: (id: number) => del<ApiResponse<PreActivation>>(`/v1/pre-activation/${id}`),
};

// ============================================
// Courses API
// ============================================

export const coursesApi = {
  list: (params?: { category_id?: number }) =>
    get<ApiListResponse<Course>>('/v1/course', params),

  get: (id: number) => get<ApiResponse<Course>>(`/v1/course/${id}`),

  create: (data: CreateCourseRequest, onProgress?: (progress: number) => void) => {
    const formData = buildFormData(data as unknown as Record<string, unknown>);
    return postMultipart<ApiResponse<Course>>('/v1/course', formData, onProgress);
  },

  update: (id: number, data: UpdateCourseRequest, onProgress?: (progress: number) => void) => {
    const formData = buildFormData(data as unknown as Record<string, unknown>);
    return putMultipart<ApiResponse<Course>>(`/v1/course/${id}`, formData, onProgress);
  },

  delete: (id: number) => del<ApiResponse<Course>>(`/v1/course/${id}`),
};

// ============================================
// Departments API
// ============================================

export const departmentsApi = {
  list: () => get<ApiListResponse<Department>>('/v1/department'),

  get: (id: number) => get<ApiResponse<Department>>(`/v1/department/${id}`),

  create: (data: CreateDepartmentRequest, onProgress?: (progress: number) => void) => {
    const formData = buildFormData(data as unknown as Record<string, unknown>);
    return postMultipart<ApiResponse<Department>>('/v1/department', formData, onProgress);
  },

  update: (id: number, data: Partial<CreateDepartmentRequest>, onProgress?: (progress: number) => void) => {
    const formData = buildFormData(data as unknown as Record<string, unknown>);
    return putMultipart<ApiResponse<Department>>(`/v1/department/${id}`, formData, onProgress);
  },

  delete: (id: number) => del<ApiResponse<Department>>(`/v1/department/${id}`),
};

// ============================================
// Discussions API
// ============================================

export const discussionsApi = {
  list: () => get<ApiListResponse<Discussion>>('/v1/discussion'),

  get: (id: number) => get<ApiResponse<Discussion>>(`/v1/discussion/${id}`),

  create: (data: CreateDiscussionRequest) =>
    post<ApiResponse<Discussion>>('/v1/discussion', data),

  update: (id: number, data: CreateDiscussionRequest) =>
    put<ApiResponse<Discussion>>(`/v1/discussion/${id}`, data),

  delete: (id: number) => del<ApiResponse<Discussion>>(`/v1/discussion/${id}`),
};

// ============================================
// Faculties API
// ============================================

export const facultiesApi = {
  list: () => get<ApiListResponse<Faculty>>('/v1/faculty'),

  get: (id: number) => get<ApiResponse<Faculty>>(`/v1/faculty/${id}`),

  create: (data: CreateFacultyRequest, onProgress?: (progress: number) => void) => {
    const formData = buildFormData(data as unknown as Record<string, unknown>);
    return postMultipart<ApiResponse<Faculty>>('/v1/faculty', formData, onProgress);
  },

  update: (id: number, data: Partial<CreateFacultyRequest>, onProgress?: (progress: number) => void) => {
    const formData = buildFormData(data as unknown as Record<string, unknown>);
    return putMultipart<ApiResponse<Faculty>>(`/v1/faculty/${id}`, formData, onProgress);
  },

  delete: (id: number) => del<ApiResponse<Faculty>>(`/v1/faculty/${id}`),
};

// ============================================
// Languages API
// ============================================

export const languagesApi = {
  list: () => get<ApiListResponse<Language>>('/v1/language'),

  get: (id: number) => get<ApiResponse<Language>>(`/v1/language/${id}`),
};

// ============================================
// Lectures API
// ============================================

export const lecturesApi = {
  list: (params?: { course_id?: number | string }) => get<ApiListResponse<Lecture>>('/v1/lecture', params),

  get: (id: number) => get<ApiResponse<Lecture>>(`/v1/lecture/${id}`),

  create: (data: CreateLectureRequest) => {
    const formData = buildFormData(data as unknown as Record<string, unknown>);
    return postMultipart<ApiResponse<Lecture>>('/v1/lecture', formData);
  },

  update: (id: number, data: Partial<CreateLectureRequest>) => {
    const formData = buildFormData(data as unknown as Record<string, unknown>);
    return putMultipart<ApiResponse<Lecture>>(`/v1/lecture/${id}`, formData);
  },

  delete: (id: number) => del<ApiResponse<Lecture>>(`/v1/lecture/${id}`),
};

// ============================================
// Levels API
// ============================================

export const levelsApi = {
  list: () => get<ApiListResponse<Level>>('/v1/level'),

  get: (id: number) => get<ApiResponse<Level>>(`/v1/level/${id}`),

  create: (data: { name: string; description: string }) =>
    post<ApiResponse<Level>>('/v1/level', data),

  update: (id: number, data: { name: string; description: string }) =>
    put<ApiResponse<Level>>(`/v1/level/${id}`, data),

  delete: (id: number) => del<ApiResponse<Level>>(`/v1/level/${id}`),
};

// ============================================
// Libraries API
// ============================================

export const librariesApi = {
  list: () => get<ApiListResponse<Library>>('/v1/library'),

  get: (id: number) => get<ApiResponse<Library>>(`/v1/library/${id}`),

  create: (data: CreateLibraryRequest, onProgress?: (progress: number) => void) => {
    const formData = buildFormData(data as unknown as Record<string, unknown>);
    return postMultipart<ApiResponse<Library>>('/v1/library', formData, onProgress);
  },

  update: (id: number, data: Partial<CreateLibraryRequest>, onProgress?: (progress: number) => void) => {
    const formData = buildFormData(data as unknown as Record<string, unknown>);
    return putMultipart<ApiResponse<Library>>(`/v1/library/${id}`, formData, onProgress);
  },

  delete: (id: number) => del<ApiResponse<Library>>(`/v1/library/${id}`),
};

// ============================================
// Live Rooms API
// ============================================

export const liveRoomsApi = {
  list: () => get<ApiListResponse<LiveRoom>>('/v1/live-room'),

  get: (id: number) => get<ApiResponse<LiveRoom>>(`/v1/live-room/${id}`),

  create: (data: CreateLiveRoomRequest) =>
    post<ApiResponse<LiveRoom>>('/v1/live-room', data),

  update: (id: number, data: UpdateLiveRoomRequest) =>
    put<ApiResponse<LiveRoom>>(`/v1/live-room/${id}`, data),

  delete: (id: number) => del<ApiResponse<LiveRoom>>(`/v1/live-room/${id}`),
};

// ============================================
// Notes API
// ============================================

export const notesApi = {
  list: () => get<ApiListResponse<Note>>('/v1/note'),

  get: (id: number) => get<ApiResponse<Note>>(`/v1/note/${id}`),

  create: (data: CreateNoteRequest) =>
    post<ApiResponse<Note>>('/v1/note', data),

  update: (id: number, data: CreateNoteRequest) =>
    put<ApiResponse<Note>>(`/v1/note/${id}`, data),

  delete: (id: number) => del<ApiResponse<Note>>(`/v1/note/${id}`),
};

// ============================================
// Posts API
// ============================================

export const postsApi = {
  list: () => get<ApiListResponse<Post>>('/v1/post'),

  get: (id: number) => get<ApiResponse<Post>>(`/v1/post/${id}`),

  create: (data: CreatePostRequest) => {
    const formData = buildFormData(data as unknown as Record<string, unknown>);
    return postMultipart<ApiResponse<Post>>('/v1/post', formData);
  },

  update: (id: number, data: Partial<CreatePostRequest>) => {
    const formData = buildFormData(data as unknown as Record<string, unknown>);
    return putMultipart<ApiResponse<Post>>(`/v1/post/${id}`, formData);
  },

  delete: (id: number) => del<ApiResponse<Post>>(`/v1/post/${id}`),
};

// ============================================
// Comments API (uses same endpoint as posts with parent_id)
// ============================================

export const commentsApi = {
  list: (parentId: number) => get<ApiListResponse<Comment>>('/v1/post', { parent_id: parentId }),

  create: (parentId: number, data: CreateCommentRequest) =>
    post<ApiResponse<Comment>>('/v1/post', { ...data, parent_id: parentId }),

  delete: (commentId: number) =>
    del<ApiResponse<Comment>>(`/v1/post/${commentId}`),
};

// ============================================
// Quizzes API
// ============================================

export const quizzesApi = {
  list: () => get<ApiListResponse<Quiz>>('/v1/quiz'),

  get: (id: number) => get<ApiResponse<Quiz>>(`/v1/quiz/${id}`),

  create: (data: CreateQuizRequest) =>
    post<ApiResponse<Quiz>>('/v1/quiz', data),

  update: (id: number, data: Partial<CreateQuizRequest>) =>
    put<ApiResponse<Quiz>>(`/v1/quiz/${id}`, data),

  delete: (id: number) => del<ApiResponse<Quiz>>(`/v1/quiz/${id}`),
};

// ============================================
// Quiz Questions API
// ============================================

export const quizQuestionsApi = {
  list: () => get<ApiListResponse<QuizQuestion>>('/v1/quiz-question'),

  get: (id: number) => get<ApiResponse<QuizQuestion>>(`/v1/quiz-question/${id}`),

  create: (data: CreateQuizQuestionRequest) =>
    post<ApiResponse<QuizQuestion>>('/v1/quiz-question', data),

  update: (id: number, data: Partial<CreateQuizQuestionRequest>) =>
    put<ApiResponse<QuizQuestion>>(`/v1/quiz-question/${id}`, data),

  delete: (id: number) => del<ApiResponse<QuizQuestion>>(`/v1/quiz-question/${id}`),
};

// ============================================
// Quiz Attempts API
// ============================================

export const quizAttemptsApi = {
  list: () => get<ApiListResponse<QuizAttempt>>('/v1/quiz-attempt'),

  get: (id: number) => get<ApiResponse<QuizAttempt>>(`/v1/quiz-attempt/${id}`),

  start: (data: StartQuizAttemptRequest) =>
    post<ApiResponse<QuizAttempt>>('/v1/quiz-attempt', data),

  submit: (id: number, data: SubmitQuizAttemptRequest) =>
    put<ApiResponse<QuizAttempt>>(`/v1/quiz-attempt/${id}`, data),
};

// ============================================
// Universities API
// ============================================

export const universitiesApi = {
  list: () => get<ApiListResponse<University>>('/v1/university'),

  get: (id: number) => get<ApiResponse<University>>(`/v1/university/${id}`),

  create: (data: CreateUniversityRequest, onProgress?: (progress: number) => void) => {
    const formData = buildFormData(data as unknown as Record<string, unknown>);
    return postMultipart<ApiResponse<University>>('/v1/university', formData, onProgress);
  },

  update: (id: number, data: Partial<CreateUniversityRequest>, onProgress?: (progress: number) => void) => {
    const formData = buildFormData(data as unknown as Record<string, unknown>);
    return putMultipart<ApiResponse<University>>(`/v1/university/${id}`, formData, onProgress);
  },

  delete: (id: number) => del<void>(`/v1/university/${id}`),
};

// ============================================
// User Progress API
// ============================================

export const userProgressApi = {
  list: () => get<ApiListResponse<UserProgress>>('/v1/user-progress'),

  get: (id: number) => get<ApiResponse<UserProgress>>(`/v1/user-progress/${id}`),

  update: (id: number, data: { progress_percentage: number; is_completed: boolean }) =>
    put<ApiResponse<UserProgress>>(`/v1/user-progress/${id}`, data),
};

// ============================================
// Students API
// ============================================

export const studentsApi = {
  list: (params?: {
    search?: string;
    status?: StudentStatus;
    university_id?: number | string;
    faculty_id?: number | string;
    center_id?: number | string;
    per_page?: number;
    page?: number;
  }) => get<ApiListResponse<Student>>('/v1/student', params),

  get: (id: string) => get<ApiResponse<Student>>(`/v1/student/${id}`),

  create: (data: CreateStudentRequest, onProgress?: (progress: number) => void) => {
    const formData = buildFormData(data as unknown as Record<string, unknown>);
    return postMultipart<ApiResponse<Student>>('/v1/student', formData, onProgress);
  },

  update: (id: string, data: Partial<CreateStudentRequest>, onProgress?: (progress: number) => void) => {
    const formData = buildFormData(data as unknown as Record<string, unknown>);
    return putMultipart<ApiResponse<Student>>(`/v1/student/${id}`, formData, onProgress);
  },

  delete: (id: string) => del<ApiResponse<Student>>(`/v1/student/${id}`),

  resetPassword: (id: string, password: string) => {
    const formData = new FormData();
    formData.append('password', password);
    return putMultipart<ApiResponse<Student>>(`/v1/student/${id}`, formData);
  },
};

// ============================================
// Social Links API
// ============================================

export const socialLinksApi = {
  list: () => get<ApiListResponse<SocialLink>>('/v1/social-link'),

  get: (id: number) => get<ApiResponse<SocialLink>>(`/v1/social-link/${id}`),

  create: (data: CreateSocialLinkRequest) => {
    const formData = buildFormData(data as unknown as Record<string, unknown>);
    return postMultipart<ApiResponse<SocialLink>>('/v1/social-link', formData);
  },

  update: (id: number, data: Partial<CreateSocialLinkRequest>) => {
    const formData = buildFormData(data as unknown as Record<string, unknown>);
    return putMultipart<ApiResponse<SocialLink>>(`/v1/social-link/${id}`, formData);
  },

  delete: (id: number) =>
    del<ApiResponse<SocialLink>>(`/v1/social-link/${id}`),
};

// ============================================
// Search API
// ============================================

export const searchApi = {
  search: (q: string, type?: string) =>
    get<ApiListResponse<{ id: string; type: string; title: string }>>('/v1/search', { q, type }),
};

// ============================================
// Dashboard API (Mock endpoints for now)
// ============================================

export const dashboardApi = {
  getStats: () => get<ApiResponse<DashboardStats>>('/v1/dashboard/stats'),

  getActivity: (params?: { period?: string }) =>
    get<ApiResponse<ActivityData[]>>('/v1/dashboard/activity-revenue', params),

  getEngagement: (params?: { period?: string }) =>
    get<ApiResponse<ActivityData[]>>('/v1/dashboard/course-engagement', params),

  getRecentActivity: (params?: { limit?: number }) =>
    get<ApiResponse<RecentActivityItem[]>>('/v1/dashboard/recent-activity', params),
};

// ============================================
// Platform Feature API (General Settings)
// ============================================

export const platformFeatureApi = {
  get: () => get<ApiResponse<PlatformFeature[]>>('/v1/feature'),

  storeOrUpdate: (data: UpdatePlatformFeatureRequest) =>
    post<ApiResponse<PlatformFeature>>('/v1/feature/store-or-update', data),

  storeOrUpdateFile: (key: string, file: File) => {
    const formData = new FormData();
    formData.append('key', key);
    formData.append('value', file);
    return postMultipart<ApiResponse<PlatformFeature[]>>('/v1/feature/store-or-update', formData);
  },
};


// ============================================
// Admin API
// ============================================

export const adminApi = {
  clearSessionsCache: () =>
    post<ApiResponse<{ message: string }>>('/v1/admin/clear-sessions-cache'),
};

// ============================================
// OTA Key Helper
// ============================================

const OTA_KEY_BASE = 'base64:O1SYbrWf/E2F55hMwxyybGti4nt8tfO9LM56/7G3MDk=';

async function hashOTAKey(): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(OTA_KEY_BASE);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function createOTAHeaders(): Promise<HeadersInit> {
  return hashOTAKey().then(hashedKey => ({
    'Authorization': `Bearer ${getAuthToken() || ''}`,
    'Accept': 'application/json',
    'X-OTA-Key': hashedKey,
  }));
}

// ============================================
// App Versions API (OTA)
// ============================================

export const appVersionsApi = {
  list: async () => {
    const response = await fetch(buildUrl('/v1/ota'), {
      method: 'GET',
      headers: await createOTAHeaders(),
    });
    return handleResponse<ApiListResponse<AppVersion>>(response, true);
  },

  create: async (data: CreateAppVersionRequest, onProgress?: (progress: number) => void) => {
    const formData = buildFormData(data as unknown as Record<string, unknown>);
    // Use postMultipart for progress tracking, but need to use createOTAHeaders
    if (onProgress) {
      return new Promise<ApiResponse<AppVersion>>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const url = buildUrl('/v1/ota/upload');

        xhr.open('POST', url, true);

        // Set OTA headers
        createOTAHeaders().then((headers) => {
          Object.entries(headers).forEach(([key, value]) => {
            if (value) xhr.setRequestHeader(key, value);
          });

          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              onProgress(progress);
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                resolve(response as ApiResponse<AppVersion>);
              } catch (e) {
                reject(new Error('Invalid JSON response'));
              }
            } else {
              try {
                const error = JSON.parse(xhr.responseText);
                reject(error);
              } catch {
                reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
              }
            }
          });

          xhr.addEventListener('error', () => reject(new Error('Network error')));
          xhr.addEventListener('abort', () => reject(new Error('Request aborted')));

          xhr.send(formData);
        });
      });
    }

    // Fallback to fetch if no progress callback
    const response = await fetch(buildUrl('/v1/ota/upload'), {
      method: 'POST',
      headers: await createOTAHeaders(),
      body: formData,
    });
    return handleResponse<ApiResponse<AppVersion>>(response, true);
  },

  update: async (id: number, data: Partial<CreateAppVersionRequest>) => {
    const formData = buildFormData(data as unknown as Record<string, unknown>);
    const response = await fetch(buildUrl(`/v1/ota/${id}`), {
      method: 'PUT',
      headers: await createOTAHeaders(),
      body: formData,
    });
    return handleResponse<ApiResponse<AppVersion>>(response, true);
  },

  delete: async (id: number) => {
    const response = await fetch(buildUrl(`/v1/ota/${id}`), {
      method: 'DELETE',
      headers: await createOTAHeaders(),
    });
    return handleResponse<ApiResponse<AppVersion>>(response, true);
  },
};

// ============================================
// Export all APIs
// ============================================

export const api = {
  auth: authApi,
  centers: centersApi,
  chapters: chaptersApi,
  codes: codesApi,
  socialLinks: socialLinksApi,
  comments: commentsApi,
  courses: coursesApi,
  departments: departmentsApi,
  discussions: discussionsApi,
  faculties: facultiesApi,
  languages: languagesApi,
  lectures: lecturesApi,
  levels: levelsApi,
  libraries: librariesApi,
  liveRooms: liveRoomsApi,
  notes: notesApi,
  posts: postsApi,
  quizzes: quizzesApi,
  quizQuestions: quizQuestionsApi,
  quizAttempts: quizAttemptsApi,
  universities: universitiesApi,
  userProgress: userProgressApi,
  students: studentsApi,
  search: searchApi,
  dashboard: dashboardApi,
  platformFeature: platformFeatureApi,
  appVersions: appVersionsApi,
  admin: adminApi,
};

export default api;
