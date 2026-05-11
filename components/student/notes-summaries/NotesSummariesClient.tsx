"use client";

import { useMemo, useState } from "react";
import { BookOpen, FileText, NotebookPen, Search, Star } from "lucide-react";
import { useTranslations } from "next-intl";

type FilterType = "all" | "summary" | "highlights" | "notes";

interface StudentNote {
  id: string | number;
  type?: string;
  attributes?: {
    title?: string | null;
    type?: string | null;
    course_id?: number | string | null;
    course_title?: string | null;
    linked_lecture?: string | null;
    lecture_title?: string | null;
    content?: string | null;
    is_publish?: boolean | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
}

const filters: FilterType[] = ["all", "summary", "highlights", "notes"];

function normalizeType(type?: string | null): FilterType {
  if (type === "summary") return "summary";
  if (type === "highlights") return "highlights";
  return "notes";
}

function getIcon(type: FilterType) {
  if (type === "summary") return BookOpen;
  if (type === "highlights") return Star;
  return NotebookPen;
}

function getIconStyle(type: FilterType) {
  if (type === "summary") return "bg-yellow-100 text-yellow-600";
  if (type === "highlights") return "bg-orange-100 text-orange-600";
  return "bg-blue-100 text-blue-600";
}

function formatDate(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function NotesSummariesClient({
  notes,
}: {
  notes: StudentNote[];
}) {
  const t = useTranslations("notesSummaries");

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const filteredNotes = useMemo(() => {
    const value = search.toLowerCase().trim();

    return notes.filter((note) => {
      const attributes = note.attributes;
      const noteType = normalizeType(attributes?.type);

      const matchesFilter = activeFilter === "all" || noteType === activeFilter;

      const matchesSearch =
        !value ||
        attributes?.title?.toLowerCase().includes(value) ||
        attributes?.content?.toLowerCase().includes(value) ||
        attributes?.course_title?.toLowerCase().includes(value) ||
        attributes?.lecture_title?.toLowerCase().includes(value);

      return matchesFilter && matchesSearch;
    });
  }, [notes, search, activeFilter]);

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

      {!filteredNotes.length ? (
        <section className="flex min-h-[320px] items-center justify-center rounded-xl border border-dashed border-[var(--border-color)] bg-[var(--card-bg)] p-8 text-center">
          <div>
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-blue-50 text-[var(--primary)]">
              <FileText size={22} />
            </div>

            <p className="text-sm font-medium text-[var(--text-muted)]">
              {t("noNotes")}
            </p>
          </div>
        </section>
      ) : (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredNotes.map((note) => {
            const attributes = note.attributes;
            const noteType = normalizeType(attributes?.type);
            const Icon = getIcon(noteType);

            const date =
              attributes?.createdAt ||
              attributes?.created_at ||
              attributes?.updatedAt ||
              attributes?.updated_at;

            return (
              <article
                key={note.id}
                className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div
                    className={`flex size-11 items-center justify-center rounded-xl ${getIconStyle(
                      noteType,
                    )}`}
                  >
                    <Icon size={20} />
                  </div>

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-[10px] font-semibold text-[var(--text-muted)]">
                    {t(noteType)}
                  </span>
                </div>

                <h2 className="line-clamp-2 text-sm font-bold text-[var(--text-dark)]">
                  {attributes?.title || t(noteType)}
                </h2>

                <p className="mt-3 line-clamp-2 text-xs leading-5 text-[var(--text-muted)]">
                  {attributes?.content || ""}
                </p>

                <div className="mt-4 space-y-1.5 border-t border-[var(--border-color)] pt-3 text-xs text-[var(--text-muted)]">
                  <p>
                    {t("course")}:{" "}
                    {attributes?.course_title || attributes?.course_id || "-"}
                  </p>

                  <p>
                    {t("lecture")}:{" "}
                    {attributes?.lecture_title ||
                      attributes?.linked_lecture ||
                      "-"}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 text-xs">
                  <span className="text-[var(--text-placeholder)]">
                    {formatDate(date)}
                  </span>

                  <span
                    className={`rounded-full px-2.5 py-1 font-semibold ${
                      attributes?.is_publish
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-gray-100 text-[var(--text-muted)]"
                    }`}
                  >
                    {attributes?.is_publish ? t("published") : t("draft")}
                  </span>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
