"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowRight,
  CalendarDays,
  FileText,
  NotebookPen,
} from "lucide-react";

import NoteAttachment from '@/components/student/notes-summaries/NoteAttachment';
import { IStudentNote } from "@/src/interfaces/notes.interface";

export default function GetStudentNotes({
  notes = [],
}: {
  notes: IStudentNote[];
}) {
  const t = useTranslations("students.home.notes");
  const locale = useLocale();

  const visibleNotes = notes.slice(0, 2);

  return (
    <section className="rounded-2xl border border-[var(--border-color)] bg-white px-4 py-5 shadow-sm sm:px-6">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold text-[var(--text-dark)] sm:text-xl">
          {t("title")}
        </h2>

        <Link
          href={`/${locale}/student/notes`}
          className="shrink-0 text-sm font-bold text-primary transition hover:text-primary-blue"
        >
          {t("viewAll")}
        </Link>
      </div>

      {!visibleNotes.length ? (
        <div className="rounded-2xl border border-dashed border-[var(--border-color)] bg-[#F7F8FA] px-5 py-8 text-center text-sm text-[var(--text-muted)]">
          {t("empty")}
        </div>
      ) : (
        <div className="space-y-4">
          {visibleNotes.map((note) => {
            const studentNote = note.attributes;
            const attachmentUrl = studentNote?.attachment?.url;

            return (
              <div
                key={note.id}
                className="group block overflow-hidden rounded-2xl border border-[var(--border-color)] bg-white transition duration-300 hover:-translate-y-1 hover:border-[var(--primary)] hover:shadow-lg"
              >
                <div className="flex gap-4 p-4">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[var(--primary)]">
                    <NotebookPen size={28} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="line-clamp-1 text-base font-bold text-[var(--text-dark)] sm:text-lg">
                          <Link href={`/${locale}/student/notes/${note.id}`}>{studentNote?.title}</Link>
                        </h3>

                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                          <span className="flex items-center gap-1">
                            <FileText size={13} />
                            {studentNote?.type}
                          </span>

                          <span className="flex items-center gap-1">
                            <CalendarDays size={13} />
                            {studentNote?.created_at
                              ? new Date(studentNote.created_at).toLocaleDateString(locale)
                              : ""}
                          </span>
                        </div>
                      </div>

                      <ArrowRight
                        size={18}
                        className="shrink-0 text-[var(--text-placeholder)] transition group-hover:translate-x-1 group-hover:text-[var(--primary)]"
                      />
                    </div>

                    <p className="line-clamp-2 text-sm leading-6 text-[var(--text-muted)]">
                      {studentNote?.content}
                    </p>
                  </div>
                </div>
                <div className="px-4 pb-4"><NoteAttachment attachment={studentNote?.attachment} title={studentNote?.title || 'Note'} /></div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}