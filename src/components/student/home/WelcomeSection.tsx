"use client";

import { IStudent } from "@/src/interfaces/student.interface";
import { BookOpen, FileText, Video } from "lucide-react";
import { useTranslations } from "next-intl";

const WelcomeSection = ({
  coursesCount,
  progressCount,
  student,
  liveSessionsCount,
}: {
  student: IStudent;
  progressCount: number;
  coursesCount: number;
  liveSessionsCount: number;
}) => {
  const t = useTranslations("student.home.welcome");
  const tC = useTranslations("universities");

  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] px-4 py-5 text-white sm:gap-4 sm:px-6 sm:py-6 md:p-8">
      <h2 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl lg:text-5xl">
        {`${t("title")} ${student.first_name} 👋`}
      </h2>
      <p className="text-sm text-white/95 sm:text-base">
        {student?.university?.data?.attributes.name || tC("notFound")}
      </p>
      <div className="flex flex-col gap-3 text-sm text-white/90 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2">
        <div className="flex min-h-11 items-center gap-2 rounded-xl bg-white/10 px-3 py-2 sm:min-h-0 sm:bg-transparent sm:px-0 sm:py-0">
          <BookOpen size={18} className="shrink-0" aria-hidden />
          <span>
            {coursesCount} {t("activeCourses")}
          </span>
        </div>
        <div className="flex min-h-11 items-center gap-2 rounded-xl bg-white/10 px-3 py-2 sm:min-h-0 sm:bg-transparent sm:px-0 sm:py-0">
          <Video size={18} className="shrink-0" aria-hidden />
          <span>
            {liveSessionsCount} {t("liveToday")}
          </span>
        </div>
        <div className="flex min-h-11 items-center gap-2 rounded-xl bg-white/10 px-3 py-2 sm:min-h-0 sm:bg-transparent sm:px-0 sm:py-0">
          <FileText size={18} className="shrink-0" aria-hidden />
          <span>
            {progressCount} {t("upcomingExams")}
          </span>
        </div>
      </div>
    </section>
  );
};

export default WelcomeSection;
