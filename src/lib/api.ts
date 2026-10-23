import Cookies from 'js-cookie';
import { getDeviceId } from './device-id';
import type {
  ApiResponse,
  ApiListResponse,
  PaginationMeta,
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
  ActivateCodeResponse,
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
  QuizListParams,
  CreateQuizRequest,
  QuizQuestion,
  CreateQuizQuestionRequest,
  QuizAttempt,
  StartQuizAttemptRequest,
  FinishQuizAttemptRequest,
  FinishQuizAttemptResponse,
  QuizAttemptListParams,
  QuizUserAnswer,
  CreateQuizUserAnswerRequest,
  UpdateQuizUserAnswerRequest,
  QuizAttemptResultResponse,
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
  StudentViewData,
  StudentQuestion,
} from '@/src/types';

// ============================================
// Configuration
// ============================================

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.learnoo.app';

// ============================================
// Error Handling
// ============================================

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public errors?: Record<string, string[]>,
    public code?: string,
    public transferToken?: string,
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

export function getApiErrorMessage(error: unknown, fallback: string = 'Request failed'): string {
  if (error instanceof ApiError) {
    if (error.errors) {
      const validationMessages = Object.values(error.errors).flat().filter(Boolean);
      return validationMessages.length > 0 ? validationMessages.join(' | ') : error.message || fallback;
    }
    return error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
}

// ============================================
// Request Helpers
// ============================================

function getAuthToken(): string | undefined {
  // Priority: permanent cookie → temporary sessionStorage (during phone verification flow)
  const cookieToken = Cookies.get('token');
  if (cookieToken) return cookieToken;
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('pending_auth_token') ?? undefined;
  }
  return undefined;
}

function buildUrl(path: string): string {
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

async function handleResponse<T>(response: Response, skipAuthRedirect: boolean = false): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    // Handle unauthorized errors - redirect to login (unless skipped)
    if ((response.status === 401) && !skipAuthRedirect) {
      if (typeof window !== 'undefined') {
        if (typeof document !== 'undefined') document.querySelectorAll<HTMLMediaElement>('video, audio').forEach(media => media.pause());
        window.location.replace(`/api/auth/session-end?reason=${errorData.code === 'account_inactive' ? 'inactive' : errorData.code === 'device_session_revoked' ? 'device-changed' : 'expired'}`);
      }
    }

    throw new ApiError(
      response.status,
      errorData.message || `HTTP ${response.status}: ${response.statusText}`,
      errorData.errors,
      errorData.code,
      errorData.transfer_token,
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

function createHeaders(includeAuth: boolean = true, isMultipart: boolean = false): HeadersInit {
  const currentLocale = Cookies.get('locale') || 'ar';

  const headers: Record<string, string> = {
    Accept: 'application/json',
    lang: currentLocale,
  };

  if (typeof window !== 'undefined') {
    headers['X-Device-ID'] = getDeviceId();
  }

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

async function get<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
  skipAuthRedirect: boolean = false
): Promise<T> {
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

  return handleResponse<T>(response, skipAuthRedirect);
}

async function post<T>(
  path: string,
  data?: unknown,
  includeAuth: boolean = true,
  skipAuthRedirect: boolean = false,
  options?: { keepalive?: boolean }
): Promise<T> {
  const response = await fetch(buildUrl(path), {
    method: 'POST',
    headers: createHeaders(includeAuth),
    body: data !== undefined && data !== null ? JSON.stringify(data) : undefined,
    keepalive: options?.keepalive,
  });

  return handleResponse<T>(response, skipAuthRedirect);
}

async function postMultipart<T>(path: string, formData: FormData, onProgress?: (progress: number) => void): Promise<T> {
  // Use XMLHttpRequest for progress tracking, fallback to fetch if no progress callback
  if (onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const url = buildUrl(path);
      const headers = createHeaders(true, true) as Record<string, string>;

      xhr.open('POST', url, true);
      xhr.timeout = 0;

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

async function patch<T>(path: string, data?: unknown): Promise<T> {
  const response = await fetch(buildUrl(path), { method: 'PATCH', headers: createHeaders(), body: data ? JSON.stringify(data) : undefined });
  return handleResponse<T>(response);
}

async function put<T>(
  path: string,
  data?: unknown,
  isMultipart: boolean = false,
  options?: { keepalive?: boolean }
): Promise<T> {
  const response = await fetch(buildUrl(path), {
    method: 'PUT',
    headers: createHeaders(true, isMultipart),
    body: data ? (isMultipart ? (data as FormData) : JSON.stringify(data)) : undefined,
    keepalive: options?.keepalive,
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
      xhr.timeout = 0;

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

async function del<T>(path: string, options?: { keepalive?: boolean }): Promise<T> {
  const response = await fetch(buildUrl(path), {
    method: 'DELETE',
    headers: createHeaders(),
    keepalive: options?.keepalive,
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
      value.forEach((item, index) => {
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
      // Don't convert to string for numeric fields that should remain as numbers
      // FormData always sends strings, but we send it as a string representation of the number
      // The backend should handle the conversion back to int
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

  requestDeviceTransfer: (transferToken: string) =>
    post<{ message: string }>('/v1/auth/device-transfer', { transfer_token: transferToken }, false, true),

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
    post<{ message: string; code: string }>('/v1/auth/phone/verification-notification'),

  verifyPhone: (code: string) =>
    post<ApiResponse<{ message: string }>>('/v1/auth/phone/verify', { code }, true, true),

  deleteAccount: (code: string) =>
    fetch(buildUrl('/v1/auth/account'), {
      method: 'DELETE',
      headers: createHeaders(),
      body: JSON.stringify({ code }),
    }).then((response) => handleResponse<{ message: string; scheduled_for: string }>(response, true)),

  cancelAccountDeletion: () =>
    post<{ message: string }>('/v1/auth/account/restore', {}, true, true),

  verifyEmail: (code: string) =>
    post<ApiResponse<{ message: string }>>('/v1/auth/email/verify', { code }),
};

// ============================================
// Parent API
// ============================================

export const parentApi = {
  linkStudents: (codes: string[]) =>
    post<ApiResponse<{ message: string }>>('/v1/parent/students', { codes }, true),
  linkStudent: (student_code: string) =>
    post<ApiResponse<{ message: string; data: { id: number; name: string; relationship: string } }>>('/v1/parent/students', { student_code }, true),
  linkedStudents: () =>
    get<ApiResponse<any[]>>('/v1/parent/students'),
  studentDashboard: (id: string | number) =>
    get<ApiResponse<any>>(`/v1/parent/students/${id}/dashboard`),
  studentProgress: (id: string | number) =>
    get<ApiResponse<any>>(`/v1/parent/students/${id}/progress`),
  studentWeeklyStats: (id: string | number) =>
    get<ApiResponse<any>>(`/v1/parent/students/${id}/weekly-stats`),
  studentAlerts: (id: string | number) =>
    get<ApiResponse<any[]>>(`/v1/parent/students/${id}/alerts`),
  studentFeedback: (id: string | number) =>
    get<ApiResponse<any[]>>(`/v1/parent/students/${id}/feedback`),
  studentActivity: (id: string | number) =>
    get<ApiResponse<any[]>>(`/v1/parent/students/${id}/activity`),
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

export interface LessonViewersResponse {
  data: { id: number; user: { id: string; first_name: string; last_name: string; email: string | null; student_code: string | null }; created_at: string | null; count: number; remaining_views: number | null }[];
  max_views: number;
  last_page: number;
}

export const chaptersApi = {
  viewers: (id: number, page = 1) => get<LessonViewersResponse>(`/v1/chapter/${id}/viewers`, { page }),
  list: (params?: { lecture_id?: number | string }) => get<ApiListResponse<Chapter>>('/v1/chapter', params),

  get: (id: number, options?: { skipAuthRedirect?: boolean }) =>
    get<ApiResponse<Chapter>>(`/v1/chapter/${id}`, undefined, options?.skipAuthRedirect ?? false),

  /** Registers one chapter view against the student's limit (POST /v1/chapter/:id/view). */
  recordView: (id: number) =>
    post<ApiResponse<Chapter>>(`/v1/chapter/${id}/view`, {}, true, true),

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

  /** Instructor/admin only — re-queues a failed or stuck video conversion. */
  retryConversion: (id: number) => post<ApiResponse<Chapter>>(`/v1/chapter/${id}/retry-conversion`, {}),
};

// ============================================
// Codes API
// ============================================

export const codesApi = {
  list: (params?: {
    search?: string;
    codeable_type?: string;
    codeable_id?: number | string;
    is_used?: boolean | number;
    per_page?: number;
    page?: number;
  }) => get<ApiListResponse<Code>>('/v1/code', params),

  get: (id: number) => get<ApiResponse<Code>>(`/v1/code/${id}`),

  create: (data: CreateCodeRequest) =>
    post<ApiListResponse<Code>>('/v1/code', data),

  update: (id: number, data: Partial<CreateCodeRequest>) =>
    put<ApiResponse<Code>>(`/v1/code/${id}`, data),

  delete: (id: number) => del<ApiResponse<Code>>(`/v1/code/${id}`),

  activate: (data: ActivateCodeRequest) =>
    post<ApiResponse<ActivateCodeResponse>>('/v1/code/activate', data),
};

// ============================================
// Pre-activation API
// ============================================

export interface PreActivationUploadRequest {
  item_id: number;
  item_type: 'course' | 'chapter' | 'library' | 'category' | 'quiz';
  file: File;
}

/** Flat JSON body from `POST /v1/pre-activation/upload` (field names depend on backend). */
export interface PreActivationUploadResponse {
  message?: string;
  count?: number;
  activated?: number;
  pending?: number;
  skipped?: number;
  total_phones?: number;
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
  upload: async (data: PreActivationUploadRequest) => {
    let file = data.file;
    if (/\.xlsx?$/i.test(file.name)) {
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      file = new File([XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]])], 'phones.csv', { type: 'text/csv' });
    }
    const formData = new FormData();
    formData.append('item_id', data.item_id.toString());
    formData.append('item_type', data.item_type);
    formData.append('file', file);
    return postMultipart<PreActivationUploadResponse>('/v1/pre-activation/upload', formData);
  },

  list: (itemId?: number, itemType?: string) =>
    get<ApiListResponse<PreActivation>>('/v1/pre-activation', itemId && itemType ? { item_id: itemId, item_type: itemType } : undefined),

  delete: (id: number) => del<ApiResponse<PreActivation>>(`/v1/pre-activation/${id}`),
};

// ============================================
// Courses API
// ============================================

export const coursesApi = {
  review: (id: number, approval: 0 | 1 | 2, reason?: string) =>
    patch<ApiResponse<Course>>(`/v1/course/${id}/approval`, { approval, reason }),
  list: (params?: { category_id?: number; activated?: number; per_page?: number } | Record<string, string | number>) =>
    get<ApiListResponse<Course>>('/v1/course', params),

  get: (id: number) => get<ApiResponse<Course>>(`/v1/course/${id}`),

  subscribers: (id: number, page = 1) => get<{ data: { id: string; first_name: string; last_name: string; phone: string }[]; last_page: number; total: number; pending_count: number }>(`/v1/course/${id}/subscribers`, { page }),
  removeSubscribers: (id: number, selection: { all: true } | { student_ids: string[] }) =>
    post<{ removed: number; pending_removed: number }>(`/v1/course/${id}/subscribers/remove`, selection),

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
  list: () => get<ApiListResponse<Department>>('/v1/department').catch(async (error: unknown) => {
    if (!(error instanceof TypeError)) throw error;
    await new Promise(resolve => setTimeout(resolve, 1000));
    return get<ApiListResponse<Department>>('/v1/department');
  }),

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
  list: (params?: any) => get<ApiListResponse<Discussion>>('/v1/discussion', params),

  get: (id: number) => get<ApiResponse<Discussion>>(`/v1/discussion/${id}`),

  create: (data: CreateDiscussionRequest | FormData) => {
    if (data instanceof FormData) {
      return postMultipart<ApiResponse<Discussion>>('/v1/discussion', data);
    }
    return post<ApiResponse<Discussion>>('/v1/discussion', data);
  },

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
// Lecture Analytics API
// ============================================

export const lectureAnalyticsApi = {
  list: (lectureId: number) => get<ApiResponse<StudentViewData[]>>(`/v1/lecture/${lectureId}/analytics`),
};

// ============================================
// Lecture Questions API
// ============================================

export const lectureQuestionsApi = {
  list: (lectureId: number) => get<ApiResponse<StudentQuestion[]>>(`/v1/lecture/${lectureId}/questions`),

  reply: (questionId: number, reply: string) =>
    post<ApiResponse<StudentQuestion>>(`/v1/lecture/question/${questionId}/reply`, { reply }),

  delete: (questionId: number) =>
    del<ApiResponse<void>>(`/v1/lecture/question/${questionId}`),
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
  list: (params?: { course_id?: number | string }) =>
    get<ApiListResponse<Library>>('/v1/library', params),

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
  list: (params?: { page?: number; search?: string; per_page?: number }) => get<ApiListResponse<LiveRoom>>('/v1/live-room', params),

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

  create: (data: CreateNoteRequest) => {
    // Use FormData for file uploads, JSON otherwise
    if (data.attachment) {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('type', data.type);
      formData.append('content', data.content || '');
      if (data.linked_lecture) {
        formData.append('linked_lecture', data.linked_lecture);
      }
      // Don't send is_publish in FormData - use query parameter instead
      // FormData converts bool to string which causes backend type error
      formData.append('attachment', data.attachment);
      // Send course_id and is_publish as query parameters to avoid FormData string conversion
      const params = new URLSearchParams();
      if (data.course_id) params.append('course_id', String(data.course_id));
      if (data.is_publish !== undefined) params.append('is_publish', data.is_publish ? '1' : '0');
      const url = `/v1/note${params.toString() ? '?' + params.toString() : ''}`;
      return postMultipart<ApiResponse<Note>>(url, formData);
    }
    return post<ApiResponse<Note>>('/v1/note', data);
  },

  update: (id: number, data: Partial<CreateNoteRequest>) => {
    // Use FormData for file uploads, JSON otherwise
    if (data.attachment) {
      const formData = new FormData();
      if (data.title) formData.append('title', data.title);
      if (data.type) formData.append('type', data.type);
      if (data.content !== undefined) formData.append('content', data.content);
      if (data.course_id !== undefined) formData.append('course_id', String(data.course_id));
      if (data.is_publish !== undefined) formData.append('is_publish', data.is_publish ? '1' : '0');
      if (data.remove_attachment !== undefined) formData.append('remove_attachment', data.remove_attachment ? '1' : '0');
      if (data.linked_lecture !== undefined) formData.append('linked_lecture', data.linked_lecture);
      formData.append('attachment', data.attachment);
      formData.append('_method', 'PUT');
      return postMultipart<ApiResponse<Note>>(`/v1/note/${id}`, formData);
    }
    return put<ApiResponse<Note>>(`/v1/note/${id}`, data);
  },

  delete: (id: number) => del<ApiResponse<Note>>(`/v1/note/${id}`),
};

// ============================================
// Posts API
// ============================================

export const postsApi = {
  list: (params?: { course_id?: number | string }) =>
    get<ApiListResponse<Post>>('/v1/post', params),

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

  /** POST `/v1/post/{post_id}/react` — body `{ type: string }` per API. */
  react: (postId: number | string, data: { type: string }) =>
    post<ApiResponse<Post>>(`/v1/post/${postId}/react`, data),
};

// ============================================
// Comments API (uses same endpoint as posts with parent_id)
// ============================================

export const commentsApi = {
  list: (parentId: number) => get<ApiListResponse<Comment>>('/v1/post', { parent_id: parentId }),

  /** POST `/v1/post` — reply/comment on a parent post (JSON body). */
  create: (parentId: number, data: CreateCommentRequest) => {
    const content = (data.content ?? '').trim();
    if (!content) {
      return Promise.reject(new ApiError(400, 'Content is required'));
    }
    const title = (data.title?.trim() || content.slice(0, 200)) || '—';
    const body: {
      parent_id: number;
      content: string;
      title: string;
      status: 'draft' | 'published';
      type: 'post' | 'question' | 'summary';
      tags?: string[];
    } = {
      parent_id: parentId,
      content,
      title,
      status: data.status ?? 'published',
      type: data.type ?? 'post',
    };
    if (data.tags && data.tags.length > 0) {
      body.tags = data.tags;
    }
    return post<ApiResponse<Comment>>('/v1/post', body);
  },

  delete: (commentId: number) =>
    del<ApiResponse<Comment>>(`/v1/post/${commentId}`),
};

// ============================================
// Quizzes API
// ============================================

export const quizzesApi = {
  list: (params?: QuizListParams) => get<ApiListResponse<Quiz>>('v1/quiz', params
    ? { page: params.page, title: params.title }
    : undefined),

  get: (id: number) => get<ApiResponse<Quiz>>(`v1/quiz/${id}`),

  create: (data: CreateQuizRequest | FormData) => {
    if (data instanceof FormData) {
      return postMultipart<ApiResponse<Quiz>>('/v1/quiz', data);
    }
    return post<ApiResponse<Quiz>>('/v1/quiz', data);
  },

  update: (id: number, data: Partial<CreateQuizRequest> | FormData) => {
    if (data instanceof FormData) {
      return putMultipart<ApiResponse<Quiz>>(`v1/quiz/${id}`, data);
    }
    return put<ApiResponse<Quiz>>(`v1/quiz/${id}`, data);
  },

  delete: (id: number) => del<void>(`v1/quiz/${id}`),
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
  list: (params?: QuizAttemptListParams) => {
    const query: Record<string, string | number | undefined> = {};
    if (params?.quiz_id !== undefined) query.quiz_id = params.quiz_id;
    if (params?.user_id !== undefined) query.user_id = params.user_id;
    if (params?.page !== undefined) query.page = params.page;
    if (params?.search !== undefined && params.search.trim() !== '') query.search = params.search.trim();
    const hasQuery = Object.keys(query).length > 0;
    return get<ApiListResponse<QuizAttempt>>(
      '/v1/quiz-attempt',
      hasQuery ? query : undefined,
    );
  },

  get: (id: number) => get<ApiResponse<QuizAttempt>>(`/v1/quiz-attempt/${id}`),

  /** `skipAuthRedirect`: business-rule 403 (e.g. max attempts) must not clear session like auth 403. */
  start: (data: StartQuizAttemptRequest) =>
    post<ApiResponse<QuizAttempt>>('/v1/quiz-attempt', data, true, true),

  submit: (id: number | string, data: FinishQuizAttemptRequest, options?: { keepalive?: boolean }) =>
    put<FinishQuizAttemptResponse>(`/v1/quiz-attempt/${id}`, data, false, options),
};

// ============================================
// Quiz User Answer API (per-answer persistence)
// ============================================

export const quizUserAnswerApi = {
  /** Create the answer row for a (quiz_attempt_id, quiz_question_id) pair. */
  create: (data: CreateQuizUserAnswerRequest) =>
    post<ApiResponse<QuizUserAnswer>>('/v1/quiz-user-answer', data),

  /** Update an existing answer row (text changes, multi-select toggles, etc.). */
  update: (id: number | string, data: UpdateQuizUserAnswerRequest) =>
    put<ApiResponse<QuizUserAnswer>>(`/v1/quiz-user-answer/${id}`, data),
};

// ============================================
// Quiz Attempt Result API (admin/doctor review)
// ============================================

export const quizAttemptResultApi = {
  /** `GET /v1/quiz-attempts/{id}/result` — full review payload for a single attempt. */
  result: (id: number | string) =>
    get<QuizAttemptResultResponse>(`/v1/quiz-attempts/${id}/result`),
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
    role?: number;
  }) => get<Omit<ApiListResponse<Student>, 'meta'> & { meta?: Partial<PaginationMeta> }>('/v1/student', { ...params, role: 0 }),

  get: (id: string) => get<ApiResponse<Student>>(`/v1/student/${id}`),

  create: (data: CreateStudentRequest, onProgress?: (progress: number) => void) => {
    const formData = buildFormData(data as unknown as Record<string, unknown>);
    return postMultipart<ApiResponse<Student>>('/v1/student', formData, onProgress);
  },

  update: (id: string, data: Partial<CreateStudentRequest>, onProgress?: (progress: number) => void) => {
    const formData = buildFormData(data as unknown as Record<string, unknown>);
    if (data.course_ids?.length === 0) formData.append('course_ids', '');
    return putMultipart<ApiResponse<Student>>(`/v1/student/${id}`, formData, onProgress);
  },

  delete: (id: string) => del<ApiResponse<Student>>(`/v1/student/${id}`),


  removeActivation: (studentId: string | number, data: { item_id: number; item_type: string }) =>
    post<ApiResponse<void>>(`/v1/student/${studentId}/remove-activation`, data),
};

// ============================================
// Instructors API (uses students endpoint with role filter)
// ============================================

export const instructorsApi = {
  list: (params?: {
    search?: string;
    university_id?: number | string;
    faculty_id?: number | string;
    center_id?: number | string;
    per_page?: number;
    page?: number;
    role?: number;
  }) => get<ApiListResponse<Student>>('/v1/student', { ...params, role: 1 }),

  get: (id: string) => get<ApiResponse<Student>>(`/v1/student/${id}`),

  create: (data: CreateStudentRequest, onProgress?: (progress: number) => void) => {
    const formData = buildFormData({ ...data, role: 1 } as unknown as Record<string, unknown>);
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
  list: (params?: { course_id?: number | string }) =>
    get<ApiListResponse<SocialLink>>('/v1/social-link', params),

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
    get<ApiResponse<ActivityData>>('/v1/dashboard/activity-revenue', params),

  getEngagement: (params?: { period?: string }) =>
    get<ApiResponse<ActivityData>>('/v1/dashboard/course-engagement', params),

  getRecentActivity: (params?: { limit?: number }) =>
    get<ApiResponse<RecentActivityItem[]>>('/v1/dashboard/recent-activity', params),
};

// ============================================
// Instructor Dashboard API
// ============================================

export const instructorDashboardApi = {
  getHeader: () => get<ApiResponse<any>>('v1/instructor/dashboard/header'),

  getStats: () => get<ApiResponse<any>>('v1/instructor/dashboard/stats'),

  getStudentGrowth: (params?: { period?: string }) =>
    get<ApiResponse<any>>('v1/instructor/dashboard/student-growth', params),

  getCourseActivity: () => get<ApiResponse<any>>('v1/instructor/dashboard/course-activity'),

  getRecentActivity: () => get<ApiResponse<any[]>>('v1/instructor/dashboard/recent-activity'),

  getUpcomingLiveClasses: () => get<ApiResponse<any[]>>('v1/instructor/dashboard/upcoming-live-classes'),

  getStudentsNeedingAttention: () => get<ApiResponse<any[]>>('v1/instructor/dashboard/students-needing-attention'),

  getPendingQuestions: () => get<ApiResponse<any>>('v1/instructor/dashboard/pending-questions'),

  getRecentEnrollments: () => get<ApiResponse<any[]>>('v1/instructor/dashboard/recent-enrollments'),

  getRevenue: () => get<ApiResponse<any>>('v1/instructor/dashboard/revenue'),
};

// ============================================
// Platform Feature API (General Settings)
// ============================================

export const platformFeatureApi = {
  /** Skip auth redirect on failure so student pages (e.g. watch) are not logged out if /v1/feature is restricted. */
  get: () => get<ApiResponse<PlatformFeature[]>>('/v1/feature', undefined, true),

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
// Issues API
// ============================================

export interface CreateIssueRequest {
  category: string;
  type: string;
  priority: string;
  description: string;
  steps_before_problem_appears: string;
  expected_result: string;
  actual_result: string;
  status: string;
}

export const issuesApi = {
  create: (data: CreateIssueRequest | FormData) => {
    if (data instanceof FormData) {
      return postMultipart<ApiResponse<any>>('/v1/issues', data);
    }

    return post<ApiResponse<any>>('/v1/issues', data);
  },

  list: () => get<ApiListResponse<any>>('/v1/issues'),

  update: (id: string | number, data: Partial<CreateIssueRequest>) =>
    put<ApiResponse<any>>(`/v1/issues/${id}`, data),

  delete: (id: string | number) => del<ApiResponse<any>>(`/v1/issues/${id}`),
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

export interface PlatformNotification {
  id: string;
  data: { title: string; message: string; type?: string; action?: string; event?: string; actor_name?: string; url?: string; content_id?: string | number; course_id?: string | number; post_id?: string | number; chapter_id?: string | number; discussion_id?: string | number; student_id?: string };
  read_at: string | null;
  created_at: string;
}

export const notificationsApi = {
  list: (page = 1) => get<{ data: PlatformNotification[]; meta: { last_page: number; unread_count: number } }>('/v1/notifications', { page }),
  send: (data: { title: string; message: string; course_id?: number }) => post<{ sent: number }>('/v1/notifications/send', data),
  read: (id: string) => patch(`/v1/notifications/${id}/read`),
  readAll: () => patch('/v1/notifications/read-all'),
};

export interface TimetableEntry { kind: 'course' | 'lecture' | 'exam' | 'live'; id: number; title: string; start: string | null; end: string | null; documents?: import('@/src/types').Attachment[] }
export interface DownloadRecord { id: number; file_name: string; first_name: string; last_name: string; created_at: string }
export const downloadsApi = {
  list: () => get<{ data: import('@/src/types').Attachment[] }>('/v1/downloads'),
  history: (page = 1) => get<{ data: DownloadRecord[]; last_page: number }>('/v1/downloads/history', { page }),
  download: async (id: string | number, name: string) => {
    const response = await fetch(buildUrl(`/v1/downloads/${id}`), { headers: createHeaders() });
    if (!response.ok) throw new ApiError(response.status, 'Download failed');
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement('a'); link.href = url; link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};
export const timetableApi = {
  list: () => get<{ entries: TimetableEntry[]; documents: import('@/src/types').Attachment[] }>('/v1/timetable'),
  upload: (id: string, form: FormData) => postMultipart(`/v1/timetable/${id}/documents`, form),
};

export interface ContentAuditSnapshot { id: number; title: string; video: string | null; lecture_id: number | null; course_id: number | null; status: number; max_views: number | null; view_by_minute: number | null }
export interface StaffActivity { id: number; action: string; first_name: string; last_name: string; created_at: string; details?: { before: ContentAuditSnapshot; after: ContentAuditSnapshot | null; view_history: { student_id: string; name: string; count: number }[] } | null }
export interface ArchivedStudent { id: string; first_name: string; last_name: string; phone: string; deleted_at: string }
export const archivedStudentsApi = {
  list: (page: number, search: string) => get<{ data: ArchivedStudent[]; last_page?: number; next_page_url?: string | null }>('/v1/student-archives', { page, search }),
  recover: (id: string, mode: 'restore' | 'new') => post(`/v1/student-archives/${id}`, { mode }),
};
export interface DeviceDetails { device: string; browser: string; identifier: string; ip: string; at: string }
export interface DeviceTransfer { id: string; first_name: string; last_name: string; phone: string; current_device: DeviceDetails | null; requested_device: DeviceDetails | null }
export const ownerOperationsApi = {
  activity: (page = 1, filters?: { from?: string; to?: string; role?: 'Instructor' | 'Admin'; type?: 'device-requests' | 'device-decisions' | 'courses' | 'lessons' | 'accounts' | 'activations' }) => get<{ data: StaffActivity[]; last_page: number }>('/v1/owner/activity', { page, ...filters }),
  devices: () => get<{ data: DeviceTransfer[] }>('/v1/owner/device-transfers'),
  approve: (id: string) => post(`/v1/owner/device-transfers/${id}/approve`),
  cancel: (id: string) => post(`/v1/owner/device-transfers/${id}/cancel`),
  resetDevice: (id: string) => post(`/v1/owner/device-transfers/${id}/reset`),
};

export interface GuardianStudent { id: string; first_name: string; last_name: string; phone?: string; email?: string; student_code?: string; university?: { name: string } | null; faculty?: { name: string } | null; centers?: { name: string }[]; activated_courses?: { id: string; title: string }[]; parents: { id: string; first_name: string; last_name: string; email: string; phone: string }[] }
export const guardiansApi = {
  list: (page = 1) => get<{ data: GuardianStudent[]; last_page: number }>('/v1/guardians', { page }),
  send: (data: { to_user_id: string; student_id: string; content: string }) => post('/v1/feedback', { ...data, type: 'general', category: 'neutral' }),
};

export const api = {
  guardians: guardiansApi,
  ownerOperations: ownerOperationsApi,
  downloads: downloadsApi,
  timetable: timetableApi,
  notifications: notificationsApi,
  auth: authApi,
  centers: centersApi,
  chapters: chaptersApi,
  codes: codesApi,
  preActivation: preActivationApi,
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
  instructorDashboard: instructorDashboardApi,
  posts: postsApi,
  comments: commentsApi,
  quizzes: quizzesApi,
  quizQuestions: quizQuestionsApi,
  quizAttempts: quizAttemptsApi,
  quizUserAnswers: quizUserAnswerApi,
  quizAttemptResults: quizAttemptResultApi,
  universities: universitiesApi,
  userProgress: userProgressApi,
  students: studentsApi,
  instructors: instructorsApi,
  search: searchApi,
  dashboard: dashboardApi,
  platformFeature: platformFeatureApi,
  socialLinks: socialLinksApi,
  appVersions: appVersionsApi,
  admin: adminApi,
  issues: issuesApi,
  lectureAnalytics: lectureAnalyticsApi,
  lectureQuestions: lectureQuestionsApi,
  parent: parentApi,
};

export default api;
