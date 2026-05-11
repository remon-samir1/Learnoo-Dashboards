"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  Radio,
  Search,
  Users,
  Video,
} from "lucide-react";
import { useTranslations } from "next-intl";

type FilterType = "all" | "live" | "upcoming" | "ended";

interface LiveSession {
  id: string | number;
  type?: string;
  attributes?: {
    title?: string | null;
    description?: string | null;
    instructor?: string | null;
    course_title?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    date?: string | null;
    status?: string | null;
    thumbnail?: string | null;
    attendees_count?: number | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
}

const filters: FilterType[] = ["all", "live", "upcoming", "ended"];

function normalizeStatus(status?: string | null): FilterType {
  if (status === "live") return "live";
  if (status === "upcoming") return "upcoming";
  if (status === "ended") return "ended";
  return "upcoming";
}

function getStatusStyle(status: FilterType) {
  if (status === "live") return "bg-red-100 text-red-600";
  if (status === "ended") return "bg-gray-100 text-gray-600";
  return "bg-blue-100 text-blue-600";
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimeRange(start?: string | null, end?: string | null) {
  if (!start && !end) return "-";
  if (start && end) return `${start} - ${end}`;
  return start || end || "-";
}

export default function LiveSessionsClient({
  sessions,
}: {
  sessions: LiveSession[];
}) {
  const t = useTranslations("liveSessions");

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const filteredSessions = useMemo(() => {
    const value = search.toLowerCase().trim();

    return sessions.filter((session) => {
      const attributes = session.attributes;
      const status = normalizeStatus(attributes?.status);

      const matchesFilter = activeFilter === "all" || status === activeFilter;

      const matchesSearch =
        !value ||
        attributes?.title?.toLowerCase().includes(value) ||
        attributes?.description?.toLowerCase().includes(value) ||
        attributes?.course_title?.toLowerCase().includes(value);

      return matchesFilter && matchesSearch;
    });
  }, [sessions, search, activeFilter]);

  return (
    <main className="min-h-screen bg-[#FAFAF8] p-6">
      <header className="mb-5">
        <h1 className="text-2xl font-bold text-[var(--text-dark)]">
          {t("pageTitle")}
        </h1>

        <p className="mt-1 text-sm text-[var(--text-muted)]">
          {t("pageDescription")}
        </p>
      </header>

      <section className="mb-6 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 shadow-sm">
        <div className="relative mb-4">
          <Search
            size={16}
            className="absolute start-3 top-1/2 -translate-y-1/2 text-[var(--text-placeholder)]"
          />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-11 w-full rounded-lg border border-[var(--border-color)] bg-white px-10 text-sm text-[var(--text-dark)] outline-none transition placeholder:text-[var(--text-placeholder)] focus:border-[var(--primary)]"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => {
            const isActive = activeFilter === filter;

            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                  isActive
                    ? "bg-[var(--primary)] text-white"
                    : "bg-gray-100 text-[var(--text-muted)] hover:bg-gray-200"
                }`}
              >
                {t(filter)}
              </button>
            );
          })}
        </div>
      </section>

      {!filteredSessions.length ? (
        <section className="flex min-h-[320px] items-center justify-center rounded-xl border border-dashed border-[var(--border-color)] bg-[var(--card-bg)] p-8 text-center">
          <div>
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-blue-50 text-[var(--primary)]">
              <Video size={22} />
            </div>

            <p className="text-sm font-medium text-[var(--text-muted)]">
              {t("noSessions")}
            </p>
          </div>
        </section>
      ) : (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredSessions.map((session) => {
            const attributes = session.attributes;
            const status = normalizeStatus(attributes?.status);

            return (
              <article
                key={session.id}
                className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    {status === "live" ? (
                      <Radio size={20} />
                    ) : (
                      <Video size={20} />
                    )}
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-semibold ${getStatusStyle(
                      status,
                    )}`}
                  >
                    {t(status)}
                  </span>
                </div>

                <h2 className="line-clamp-2 text-sm font-bold text-[var(--text-dark)]">
                  {attributes?.title || t("upcoming")}
                </h2>

                <p className="mt-3 line-clamp-2 text-xs leading-5 text-[var(--text-muted)]">
                  {attributes?.description || "-"}
                </p>

                <div className="mt-4 space-y-2 border-t border-[var(--border-color)] pt-3 text-xs text-[var(--text-muted)]">
                  <p className="flex items-center gap-2">
                    <Video size={14} />
                    {attributes?.course_title || "-"}
                  </p>

                  <p className="flex items-center gap-2">
                    <CalendarDays size={14} />
                    {formatDate(attributes?.date)}
                  </p>

                  <p className="flex items-center gap-2">
                    <Clock3 size={14} />
                    {formatTimeRange(
                      attributes?.start_time,
                      attributes?.end_time,
                    )}
                  </p>

                  <p className="flex items-center gap-2">
                    <Users size={14} />
                    {attributes?.attendees_count || 0}
                  </p>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
