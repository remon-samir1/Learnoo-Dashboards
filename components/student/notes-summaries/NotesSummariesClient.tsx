"use client";

import { useMemo, useState } from "react";
import { BookOpen, FileText, NotebookPen, Search, Star } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { IStudentNote } from "@/src/interfaces/notes.interface";
import Link from "next/link";

type FilterType = "all" | "summary" | "highlights" | "notes";

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

function formatDate(value?: string | null, locale?: string) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString(locale || "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function NotesSummariesClient({
  notes,
}: {
  notes: IStudentNote[];
}) {
  const t = useTranslations("notesSummaries");
  const locale = useLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";
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
    <div className="flex min-w-0 flex-col gap-5 sm:gap-6 lg:gap-8" dir={dir}>
      <header className="min-w-0">
        <h1 className="text-xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-2xl md:text-3xl">
          {t("pageTitle")}
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-[15px]">
          {t("pageDescription")}
        </p>
      </header>

      <section className="rounded-2xl border border-[#F1F5F9] bg-white p-3 shadow-sm sm:p-5">
        <div className="relative mb-3 sm:mb-4">
          <Search
            size={18}
            className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
            aria-hidden
          />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchPlaceholder")}
            enterKeyHint="search"
            className="h-12 w-full min-h-[48px] rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] py-3 ps-11 pe-3 text-base text-[#1E293B] outline-none transition placeholder:text-[#94A3B8] focus:border-[#2D43D1] focus:ring-2 focus:ring-[#2D43D1]/10 sm:h-11 sm:min-h-0 sm:text-sm"
          />
        </div>

        <div
          className="-mx-1 flex gap-2 overflow-x-auto overscroll-x-contain px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label={t("pageTitle")}
        >
          {filters.map((filter) => {
            const isActive = activeFilter === filter;

            return (
              <button
                key={filter}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveFilter(filter)}
                className={`shrink-0 snap-start rounded-xl px-4 py-2.5 text-xs font-semibold transition active:scale-[0.98] sm:py-2 ${
                  isActive
                    ? "bg-[#2137D6] text-white shadow-sm"
                    : "bg-[#F8FAFC] text-[#64748B] hover:bg-[#F1F5F9]"
                }`}
              >
                {t(filter)}
              </button>
            );
          })}
        </div>
      </section>

      {!filteredNotes.length ? (
        <section className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-[#E2E8F0] bg-white px-4 py-10 text-center shadow-sm sm:min-h-[280px] sm:py-12">
          <div className="max-w-sm">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-blue-50 text-[#2137D6]">
              <FileText size={22} aria-hidden />
            </div>

            <p className="text-sm font-medium text-[#64748B]">{t("noNotes")}</p>
          </div>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
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
              <Link
                href={`/${locale}/student/notes/${note.id}`}
                key={note.id}
                className="min-w-0 rounded-2xl border border-[#F1F5F9] bg-white p-4 shadow-sm transition active:bg-slate-50/80 sm:p-5 sm:hover:-translate-y-0.5 sm:hover:shadow-md"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div
                    className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${getIconStyle(
                      noteType,
                    )}`}
                  >
                    <Icon size={20} aria-hidden />
                  </div>

                  <span className="max-w-[45%] shrink-0 truncate rounded-full bg-[#F8FAFC] px-2.5 py-1 text-[10px] font-semibold text-[#64748B] sm:px-3">
                    {t(noteType)}
                  </span>
                </div>

                <h2 className="line-clamp-2 text-[15px] font-bold leading-snug text-[#1E293B] sm:text-sm">
                  {attributes?.title || t(noteType)}
                </h2>

                <p className="mt-2 line-clamp-3 text-xs leading-5 text-[#64748B] sm:line-clamp-2">
                  {attributes?.content || ""}
                </p>

                <div className="mt-3 space-y-1.5 border-t border-[#F1F5F9] pt-3 text-xs text-[#64748B]">
                  <p className="break-words">
                    <span className="font-medium text-[#475569]">{t("course")}:</span>{" "}
                    {attributes?.course_title || attributes?.course_id || "—"}
                  </p>

                  <p className="break-words">
                    <span className="font-medium text-[#475569]">{t("lecture")}:</span>{" "}
                    {attributes?.lecture_title ||
                      attributes?.linked_lecture ||
                      "—"}
                  </p>
                </div>

                <div className="mt-3 flex flex-col gap-2 border-t border-[#F1F5F9] pt-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-[#94A3B8]">{formatDate(date, locale)}</span>

                  <span
                    className={`self-start rounded-full px-2.5 py-1 font-semibold sm:self-auto ${
                      attributes?.is_publish
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-[#F8FAFC] text-[#64748B]"
                    }`}
                  >
                    {attributes?.is_publish ? t("published") : t("draft")}
                  </span>
                </div>
              </Link>
            );
          })}
        </section>
      )}
    </div>
  );
}
