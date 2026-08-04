import type { GeneratedExamQuestion } from '@/src/lib/exam-ai';
import type { Course } from '@/src/types';

export type ExamFormQuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'true_false'
  | 'short_answer';

export interface ExamFormAnswer {
  id: string;
  text: string;
  isCorrect: boolean;
  reason: string;
  image?: File | null;
  imagePreview?: string;
  reason_image?: File | null;
  reasonImagePreview?: string;
}

export interface ExamFormQuestion {
  id: string;
  quizId?: string;
  text: string;
  type: ExamFormQuestionType;
  score: number;
  autoCorrect: boolean;
  answers: ExamFormAnswer[];
  image?: File | null;
  imagePreview?: string;
}

export interface ExamFormDetails {
  title: string;
  courses: string[];
  chapter: string;
  type: 'exam' | 'homework';
  duration: string;
  totalMarks: string;
  passingMarks: string;
  maxAttempts: string;
  status: 'Draft' | 'Active';
  startTime: string;
  endTime: string;
  is_public: boolean;
}

export interface ApiErrorPayload {
  message?: string;
  details?: string;
  errors?: Record<string, unknown>;
  data?: unknown;
  id?: string | number;
}

export function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function getApiErrorMessages(errors: unknown): string[] {
  if (!errors || typeof errors !== 'object' || Array.isArray(errors)) return [];

  return Object.values(errors).flatMap((value) => {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string');
    }

    return typeof value === 'string' ? [value] : [];
  });
}

export function mapGeneratedQuestionsToForm(
  questions: GeneratedExamQuestion[],
  timestamp = Date.now()
): ExamFormQuestion[] {
  return questions.map((question, questionIndex) => ({
    id: `new-ai-q-${timestamp}-${questionIndex}`,
    quizId: '',
    text: question.text,
    type: question.type,
    score: question.score,
    autoCorrect: question.autoCorrect,
    image: null,
    imagePreview: '',
    answers: question.answers.map((answer, answerIndex) => ({
      id: `a-ai-${timestamp}-${questionIndex}-${answerIndex}`,
      text: answer.text,
      isCorrect: answer.isCorrect,
      reason: answer.reason,
      image: null,
      imagePreview: '',
      reason_image: null,
      reasonImagePreview: '',
    })),
  }));
}

export function getQuizCourseIds(
  courses: Course[] | undefined,
  courseId?: number,
  courseIds?: number[]
): string[] {
  if (Array.isArray(courses)) return courses.map((course) => String(course.id));
  if (courseId) return [String(courseId)];
  if (Array.isArray(courseIds)) return courseIds.map(String);
  return [];
}

export function isObjectUrl(value?: string): value is string {
  return typeof value === 'string' && value.startsWith('blob:');
}

export function revokeObjectUrl(value?: string) {
  if (isObjectUrl(value)) URL.revokeObjectURL(value);
}

export function revokeAnswerObjectUrls(answer: ExamFormAnswer) {
  revokeObjectUrl(answer.imagePreview);
  revokeObjectUrl(answer.reasonImagePreview);
}

export function revokeQuestionObjectUrls(question: ExamFormQuestion) {
  revokeObjectUrl(question.imagePreview);
  question.answers.forEach(revokeAnswerObjectUrls);
}

export function revokeQuestionsObjectUrls(questions: ExamFormQuestion[]) {
  questions.forEach(revokeQuestionObjectUrls);
}

export function createReplacementPreview(previousPreview: string | undefined, file: File | null) {
  revokeObjectUrl(previousPreview);
  return file ? URL.createObjectURL(file) : '';
}

function appendExamFields(formData: FormData, details: ExamFormDetails) {
  details.courses.forEach((courseId) => formData.append('course_ids[]', courseId));
  formData.append('course_id', details.courses[0]);
  if (details.chapter) formData.append('chapter_id', details.chapter);
  formData.append('title', details.title);
  formData.append('type', details.type);
  formData.append('duration', details.duration);
  formData.append('total_marks', details.totalMarks);
  formData.append('passing_marks', details.passingMarks);
  formData.append('max_attempts', details.maxAttempts);
  formData.append('is_public', details.is_public ? '1' : '0');
  formData.append('status', details.status.toLowerCase());
  if (details.startTime) formData.append('start_time', details.startTime);
  if (details.endTime) formData.append('end_time', details.endTime);
}

function isNewQuestionId(id: string) {
  return id.startsWith('new-') || id.startsWith('ai-q-');
}

function isNewAnswerId(id: string) {
  return id.startsWith('a-') || id.startsWith('ai-a-');
}

export function buildExamFormData(
  details: ExamFormDetails,
  questions: ExamFormQuestion[],
  mode: 'create' | 'edit'
): FormData {
  const formData = new FormData();
  appendExamFields(formData, details);

  questions.forEach((question, questionIndex) => {
    const questionKey = `questions[${questionIndex}]`;
    formData.append(`${questionKey}[id]`, mode === 'edit' && !isNewQuestionId(question.id) ? question.id : '');
    formData.append(`${questionKey}[text]`, question.text);
    formData.append(`${questionKey}[type]`, question.type);
    formData.append(`${questionKey}[score]`, String(question.score));
    formData.append(`${questionKey}[auto_correct]`, question.autoCorrect ? '1' : '0');
    formData.append(`${questionKey}[order]`, String(questionIndex + 1));
    if (question.image instanceof File) formData.append(`${questionKey}[image]`, question.image);

    if (question.type === 'short_answer') return;

    question.answers.forEach((answer, answerIndex) => {
      const answerKey = `${questionKey}[answers][${answerIndex}]`;
      formData.append(`${answerKey}[id]`, mode === 'edit' && !isNewAnswerId(answer.id) ? answer.id : '');
      formData.append(`${answerKey}[text]`, answer.text);
      formData.append(`${answerKey}[is_correct]`, answer.isCorrect ? '1' : '0');
      if (answer.reason) formData.append(`${answerKey}[reason]`, answer.reason);
      if (answer.image instanceof File) formData.append(`${answerKey}[image]`, answer.image);
      if (answer.reason_image instanceof File) {
        formData.append(`${answerKey}[reason_image]`, answer.reason_image);
      }
    });
  });

  return formData;
}
