// src/services/student/exam.service.ts
import getUserDataFromJWT from "@/lib/server.utils";
import type { Quiz, QuizAttributes } from "@/src/types";

export interface LatestExamSummary {
  id: string;
  title: string;
  type: QuizAttributes["type"];
  start_time: string | null;
  end_time: string | null;
  duration: number | null;
  total_marks: number | null;
  passing_marks: number | null;
  course_id: number | string | null;
  created_at: string | null;
  /** Status derived from start_time/end_time comparison vs current time. */
  status: "available" | "upcoming" | "expired";
}

export type LatestExamsServiceResult = {
  success: boolean;
  data?: LatestExamSummary[];
  message?: string;
};

const API_BASE = "https://api.learnoo.app/v1/quiz";
const DEFAULT_LIMIT = 4;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readAttributes(raw: unknown): QuizAttributes | null {
  const top = asRecord(raw);
  if (!top) return null;
  const attrs = asRecord(top.attributes);
  if (!attrs) return null;
  return attrs as unknown as QuizAttributes;
}

function normalizeQuizRow(raw: unknown): Quiz | null {
  const top = asRecord(raw);
  if (!top || top.id == null) return null;
  const attrs = readAttributes(raw);
  return {
    id: String(top.id),
    type: typeof top.type === "string" ? top.type : "quizzes",
    attributes: attrs as QuizAttributes,
  } as Quiz;
}

function isQuizRow(raw: unknown): raw is Quiz {
  const top = asRecord(raw);
  return !!top && top.id != null;
}

function normalizeQuizList(payload: unknown): Quiz[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;

  const direct = root.data;
  if (Array.isArray(direct)) {
    return direct.filter(isQuizRow).map(normalizeQuizRow).filter((q): q is Quiz => !!q);
  }

  const nested = asRecord(direct);
  if (nested) {
    const inner = nested.data;
    if (Array.isArray(inner)) {
      return inner.filter(isQuizRow).map(normalizeQuizRow).filter((q): q is Quiz => !!q);
    }
    if (nested.id != null) {
      const single = normalizeQuizRow(nested);
      return single ? [single] : [];
    }
  }

  return [];
}

function pickFirstCourseId(quiz: Quiz): number | string | null {
  const attrs = (quiz.attributes ?? null) as QuizAttributes | null;
  if (!attrs) return null;

  const courseIdRaw: unknown = attrs.course_id;
  if (typeof courseIdRaw === "number") return courseIdRaw;
  if (typeof courseIdRaw === "string" && courseIdRaw.trim() !== "") {
    return courseIdRaw;
  }

  const courses = (attrs as unknown as { courses?: { data?: Array<{ id?: string | number }> } })
    .courses;
  const first = courses?.data?.[0]?.id;
  if (first == null) return null;
  return typeof first === "number" ? first : String(first);
}

function deriveStatus(quiz: Quiz, nowMs: number): LatestExamSummary["status"] {
  const attrs = quiz.attributes ?? null;
  if (!attrs) return "upcoming";
  const start = attrs.start_time ? Date.parse(attrs.start_time) : NaN;
  const end = attrs.end_time ? Date.parse(attrs.end_time) : NaN;

  if (Number.isFinite(end) && end < nowMs) return "expired";
  if (Number.isFinite(start) && start > nowMs) return "upcoming";
  return "available";
}

function summarize(quiz: Quiz, nowMs: number): LatestExamSummary | null {
  if (!quiz || quiz.id == null) return null;
  const attrs = quiz.attributes ?? null;
  if (!attrs) return null;

  const title = typeof attrs.title === "string" ? attrs.title.trim() : "";
  const status = deriveStatus(quiz, nowMs);

  return {
    id: String(quiz.id),
    title,
    type: attrs.type ?? "exam",
    start_time: attrs.start_time ?? null,
    end_time: attrs.end_time ?? null,
    duration: typeof attrs.duration === "number" ? attrs.duration : null,
    total_marks: typeof attrs.total_marks === "number" ? attrs.total_marks : null,
    passing_marks: typeof attrs.passing_marks === "number" ? attrs.passing_marks : null,
    course_id: pickFirstCourseId(quiz),
    created_at: attrs.created_at ?? null,
    status,
  };
}

/**
 * Sort key — prefer start_time (newest coming-soon first), fall back to created_at.
 * Items without a parseable timestamp are pushed to the end.
 */
function sortKey(exam: LatestExamSummary): number {
  const candidates = [exam.start_time, exam.created_at];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim() !== "") {
      const ts = Date.parse(c);
      if (Number.isFinite(ts)) return ts;
    }
  }
  return 0;
}

/**
 * Fetch the student's latest exams (quizzes) — server-side only.
 *
 * Behaviour:
 *  - Calls `GET /v1/quiz` with a single page.
 *  - Returns up to `limit` exams, sorted newest-first by start_time (or created_at fallback).
 *  - `expired` exams (past `end_time`) are filtered out — this view is about new/upcoming work.
 */
export async function getLatestStudentExams(
  limit: number = DEFAULT_LIMIT,
): Promise<LatestExamsServiceResult> {
  const userData = await getUserDataFromJWT();
  const token = userData?.token;

  if (!token) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const res = await fetch(`${API_BASE}?page=1`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const payload = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message =
        (typeof payload?.message === "string" && payload.message) ||
        `Failed to fetch exams (HTTP ${res.status})`;
      return { success: false, message };
    }

    const quizzes = normalizeQuizList(payload);
    const nowMs = Date.now();

    const summaries: LatestExamSummary[] = [];
    for (const quiz of quizzes) {
      const summary = summarize(quiz, nowMs);
      if (!summary) continue;
      if (summary.status === "expired") continue;
      summaries.push(summary);
    }

    summaries.sort((a, b) => sortKey(b) - sortKey(a));

    return {
      success: true,
      data: summaries.slice(0, Math.max(0, limit)),
    };
  } catch (error) {
    return {
      success: false,
      message: (error as Error).message,
    };
  }
}
