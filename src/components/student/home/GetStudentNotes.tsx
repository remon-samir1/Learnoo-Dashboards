// import { useTranslations } from 'next-intl';
// import React from 'react'

// const GetStudentNotes = ({notes}:{notes:IStudentNote[]}) => {
//     const t = useTranslations("student.home.notes");
    
//   return (
//     <section className="rounded-2xl border border-[var(--border-color)] bg-white px-6 py-4 shadow-sm">
      
//     </section>
//   )
// }

// export default GetStudentNotes


"use client";

import { Notebook } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { IStudentNote } from "@/src/interfaces/notes.interface";





export default function GetStudentNotes({
  notes = [],
}: {
  notes: IStudentNote[];
}) {
  const t = useTranslations("student.home.notes");
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
          className="shrink-0 text-sm font-bold leading-6 text-primary transition duration-300 hover:text-primary-blue"
        >
          {t("viewAll")}
        </Link>
      </div>

      {!visibleNotes.length ? (
        <div className="rounded-2xl border border-dashed border-[var(--border-color)] bg-[#F7F8FA] px-5 py-8 text-center text-sm text-[var(--text-muted)]">
          {t("empty")}
        </div>
      ) : (
        <div className="space-y-3">
          {visibleNotes.map((note, index) => {
           const studentNote = note.attributes;
            
            return (
              <article
                key={`${studentNote?.course_id}-${index}`}
                className="flex items-center gap-4 rounded-2xl border border-[var(--border-color)] bg-white px-4 py-4"
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#F7F8FA] text-[var(--primary)]">
                  <Notebook size={24} />
                </div>

                <div className="min-w-0">
                  <h3 className="line-clamp-1 text-base font-bold text-[var(--text-dark)] sm:text-lg">
                    {studentNote?.title}
                  </h3>

                  <p className="mt-1 line-clamp-2 text-sm text-[var(--text-muted)] sm:line-clamp-1 sm:text-base">
                    {studentNote?.content}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}