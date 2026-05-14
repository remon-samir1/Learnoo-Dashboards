"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  Edit3,
  Save,
  Trash2,
  X,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import { deleteNote, updateNote } from "@/src/services/student/note.service";
import { IStudentNote } from "@/src/interfaces/notes.interface";

type NoteType = "note" | "summary" | "highlights";

const normalizeNoteType = (value?: string | null): NoteType => {
  if (value === "summary") return "summary";
  if (value === "highlights") return "highlights";
  return "note";
};

export default function NoteDetailsClient({ note }: { note: IStudentNote }) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("notesDetails");
  const isArabic = locale === "ar";
  const dir = isArabic ? "rtl" : "ltr";
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(note.attributes?.title || "");
  const [content, setContent] = useState(note.attributes?.content || "");
  const [type] = useState<NoteType>(normalizeNoteType(note.attributes?.type));

  const courseId = note.attributes?.course_id;

  const courseDetailsHref = courseId
    ? `/${locale}/student/courses/course-details/${courseId}`
    : `/${locale}/student/notes`;

  const handleDownload = () => {
    const fileContent = content || note.attributes?.content || "";

    if (!fileContent.trim()) {
      toast.error(`${t("errorDownload")}`);
      return;
    }

    const blob = new Blob([fileContent], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${title || "note"}.txt`;
    document.body.appendChild(link);
    link.click();

    link.remove();
    URL.revokeObjectURL(url);

    toast.success(`${t("noteDownloaded")}`);
  };

  const handleUpdate = () => {
    startTransition(async () => {
      const res = await updateNote(note.id, {
        title,
        content,
      });

      if (!res.success) {
        toast.error(`${t("updateFailed")}`);
        return;
      }

      toast.success(`${t("updateSuccess")}`);
      setIsEditing(false);
      router.refresh();
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteNote(note.id);

      if (!res.success) {
        toast.error(`${t("failedDelete")}`);
        return;
      }

      toast.success(`${t("deleteSuccess")}`);

      setTimeout(() => {
        router.push(`/${locale}/student/notes`);
        router.refresh();
      }, 700);
    });
  };

  return (
    <div className="flex min-w-0 flex-col gap-5 sm:gap-8" dir={dir}>
      <Link
        href={`/${locale}/student/notes`}
        className="inline-flex min-h-[44px] w-fit items-center gap-2 text-sm font-medium text-[#64748B] transition hover:text-[#0F172A]"
      >
        {isArabic ? <ArrowRight size={18} aria-hidden /> : <ArrowLeft size={18} aria-hidden />}
        <span>{t("backToNotes")}</span>
      </Link>

      <section className="min-w-0 overflow-hidden rounded-2xl border border-[#F1F5F9] bg-white shadow-sm sm:rounded-[20px]">
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 px-4 py-6 text-white sm:px-6 sm:py-8 md:px-8 md:py-10">
          <span className="mb-3 inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold capitalize backdrop-blur-sm">
            {type}
          </span>

          {isEditing ? (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/25 bg-white/15 px-3 py-3 text-lg font-bold text-white outline-none placeholder:text-white/70 sm:text-2xl"
              placeholder="Note title"
            />
          ) : (
            <h1 className="text-xl font-bold leading-tight tracking-tight sm:text-2xl md:text-3xl">
              {note.attributes?.title || "Untitled Note"}
            </h1>
          )}

          <div className="mt-3 flex flex-col gap-1.5 text-xs leading-relaxed text-white/95 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2 sm:text-sm">
            <span className="break-words">
              {note.attributes?.course_title || "No course"}
            </span>
            <span className="hidden text-white/50 sm:inline" aria-hidden>
              •
            </span>
            <span className="break-words">
              {note.attributes?.lecture_title ||
                note.attributes?.linked_lecture ||
                "No lecture"}
            </span>
          </div>
        </div>

        <div className="border-t border-[#F1F5F9] px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8">
          {isEditing ? (
            <div className="space-y-4">
              <p className="text-sm font-medium text-[#64748B]">{t("summary")}</p>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                className="min-h-[200px] w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-base leading-6 text-[#1E293B] outline-none transition focus:border-[#2D43D1] focus:ring-2 focus:ring-[#2D43D1]/10 sm:min-h-[280px] sm:text-sm"
                placeholder="Write note content..."
              />
            </div>
          ) : (
            <article className="max-w-none text-base leading-7 text-[#475569] sm:text-sm sm:leading-7">
              <p className="whitespace-pre-line break-words">
                {note.attributes?.content || "No content available."}
              </p>
            </article>
          )}

          <div className="mt-6 flex flex-col gap-3 border-t border-[#F1F5F9] pt-5 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-stretch sm:gap-3">
            <Link
              href={courseDetailsHref}
              className="inline-flex h-12 min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#2137D6] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1a2bb3] active:scale-[0.99] sm:h-11 sm:min-h-[44px] sm:flex-initial sm:px-5"
            >
              <BookOpen size={18} className="shrink-0" aria-hidden />
              {t("goToLecture")}
            </Link>
            {/* <button
              type="button"
              onClick={handleDownload}
              className="inline-flex h-12 min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 text-sm font-semibold text-[#1E293B] shadow-sm transition hover:bg-[#F8FAFC] active:scale-[0.99] sm:h-11 sm:min-h-[44px] sm:flex-initial"
            >
              <Download size={18} className="shrink-0" aria-hidden />
              {t("download")}
            </button> */}
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={isPending}
                  className="inline-flex h-12 min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 text-sm font-semibold text-[#64748B] transition hover:bg-[#F8FAFC] disabled:opacity-60 sm:h-11 sm:min-h-[44px] sm:flex-initial"
                >
                  <X size={18} aria-hidden />
                  {t("cancel")}
                </button>

                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={isPending}
                  className="inline-flex h-12 min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#0F172A] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60 sm:h-11 sm:min-h-[44px] sm:flex-initial"
                >
                  <Save size={18} aria-hidden />
                  {isPending ? `${t("saving")}` : `${t("save")}`}
                </button>
              </>
            ) : (
              <div className="flex w-full flex-col gap-3 sm:ms-auto sm:w-auto sm:flex-1 sm:flex-row sm:justify-end">
                {/* <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex h-12 min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 text-sm font-semibold text-[#1E293B] transition hover:bg-[#F1F5F9] active:scale-[0.99] sm:h-11 sm:min-h-[44px] sm:flex-initial"
                >
                  <Edit3 size={18} aria-hidden />
                  {t("edit")}
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="inline-flex h-12 min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-60 sm:h-11 sm:min-h-[44px] sm:flex-initial"
                >
                  <Trash2 size={18} aria-hidden />
                  {isPending ? `${t("deleting")}` : `${t("delete")}`}
                </button> */}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
