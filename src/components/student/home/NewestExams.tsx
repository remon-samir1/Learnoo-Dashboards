"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock,
  ClipboardList,
  FileText,
  Play,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import type { LatestExamSummary } from "@/src/services/student/exam.service";
import { buildStudentStartExamHref } from "@/src/lib/student-start-exam-href";

interface NewestExamsProps {
  exams?: LatestExamSummary[];
  /** Visible card limit (defaults to 3). */
  limit?: number;
}

function formatDate(iso: string | null | undefined, locale: string): string | null {
  if (!iso?.trim()) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "short",
      hour: "numeric",
      minute: "numeric",
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

export default function NewestExams({
  exams = [],
  limit = 3,
}: NewestExamsProps) {
  const t = useTranslations("students.home.exams");
  const locale = useLocale();

  const visibleExams = exams.slice(0, Math.max(0, limit));

  return (
    <section className="rounded-2xl border border-[var(--border-color)] bg-white px-4 py-5 shadow-sm sm:px-6">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold text-[var(--text-dark)] sm:text-xl">
          {t("title")}
        </h2>

        <Link
          href={`/${locale}/student/exams`}
          className="shrink-0 text-sm font-bold text-primary transition hover:text-primary-blue"
        >
          {t("viewAll")}
        </Link>
      </div>

      {!visibleExams.length ? (
        <div className="rounded-2xl border border-dashed border-[var(--border-color)] bg-[#F7F8FA] px-5 py-8 text-center text-sm text-[var(--text-muted)]">
          {t("empty")}
        </div>
      ) : (
        <div className="space-y-4">
          {visibleExams.map((exam) => {
            const isAvailable = exam.status === "available";
            const isHomework = exam.type === "homework";
            const typeLabel = isHomework ? t("homeworkType") : t("examType");
            const title = exam.title?.trim() || t("fallbackTitle");
            const startHref = buildStudentStartExamHref(
              locale,
              exam.id,
              exam.course_id,
            );
            const startStr = formatDate(exam.start_time, locale);
            const endStr = formatDate(exam.end_time, locale);
            const hasDuration =
              typeof exam.duration === "number" && exam.duration > 0;

            return (
              <article
                key={exam.id}
                className="group overflow-hidden rounded-2xl border border-[var(--border-color)] bg-white transition duration-300 hover:-translate-y-1 hover:border-[var(--primary)] hover:shadow-lg"
              >
                <div className="flex gap-4 p-4">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[var(--primary)] transition group-hover:bg-[var(--primary)] group-hover:text-white">
                    <ClipboardList size={28} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="line-clamp-1 text-base font-bold text-[var(--text-dark)] sm:text-lg">
                          {title}
                        </h3>

                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                          <span className="flex items-center gap-1">
                            <FileText size={13} />
                            {typeLabel}
                          </span>

                          {hasDuration ? (
                            <span className="flex items-center gap-1">
                              <Clock size={13} />
                              {t("durationMinutes", { count: exam.duration as number })}
                            </span>
                          ) : null}

                          {startStr ? (
                            <span className="flex items-center gap-1">
                              <CalendarDays size={13} />
                              {startStr}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <span
                        className={
                          isAvailable
                            ? "shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 sm:text-xs"
                            : "shrink-0 rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-semibold text-orange-700 sm:text-xs"
                        }
                      >
                        {isAvailable ? t("availableBadge") : t("upcomingBadge")}
                      </span>
                    </div>

                    {endStr ? (
                      <p className="text-xs text-[var(--text-placeholder)]">
                        {t("courseFallback")}: {endStr}
                      </p>
                    ) : null}

                    <div className="mt-3 flex items-center justify-between gap-3">
                      {isAvailable ? (
                        <Link
                          href={startHref}
                          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                        >
                          <Play size={14} fill="currentColor" />
                          <span>{t("startExam")}</span>
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="inline-flex h-10 cursor-not-allowed items-center gap-2 rounded-xl bg-[#F1F5F9] px-4 text-sm font-semibold text-[#94A3B8]"
                        >
                          <Clock size={14} />
                          <span>{t("upcomingBadge")}</span>
                        </button>
                      )}

                      <Link
                        href={`/${locale}/student/exams`}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--text-muted)] transition hover:text-[var(--primary)]"
                        aria-label={title}
                      >
                        <ArrowRight
                          size={18}
                          className="shrink-0 rtl:rotate-180 transition group-hover:translate-x-1 group-hover:text-[var(--primary)]"
                        />
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
