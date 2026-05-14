"use client";

/**
 * Static UI only via `t()` / messages. Course titles, names, category, status, etc. come from the API as-is.
 */
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { StudentCourseActivationModal } from "@/components/student/StudentCourseActivationModal";
import { StudentCourseCard } from "@/components/student/StudentCourseCard";
import { CourseCardSkeleton } from "@/src/components/ui/Skeleton";
import { STUDENT_COURSES_LIST_PARAMS, useCourses } from "@/src/hooks/useCourses";
import { useStudentCourseListActivation } from "@/src/hooks/useStudentCourseListActivation";
import { courseIsLocked } from "@/src/lib/student-course-lock";
import type { Course } from "@/src/types";
import Link from "next/link";

export default function MyCoursesSection() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("courses");
  const tH = useTranslations("student.home.courses");
  const { data: courses, isLoading, error, refetch } = useCourses(STUDENT_COURSES_LIST_PARAMS);
  const activation = useStudentCourseListActivation();
   
  function getCourseProgress(course: Course) {
    const lectures = course.attributes.stats?.lectures ?? 0;
    const exams = course.attributes.stats?.exams ?? 0;
    const base = lectures * 8 + exams * 5;
    return Math.min(98, Math.max(12, base || 35));
  }

  const goToCourse = (courseId: string) => {
    router.push(`/${locale}/student/courses/course-details/${courseId}`);
  };

  return (
    <section className="rounded-2xl border border-[var(--border-color)] bg-white px-4 py-4 shadow-sm sm:px-6 sm:py-4">
      <div className="mb-6 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl md:text-3xl">
          {t("studentPageTitle")}
        </h1>
        <Link
          href={`/${locale}/student/courses`}
          className="shrink-0 text-sm font-bold leading-6 text-primary transition duration-300 hover:text-primary-blue sm:pt-1"
        >
          {tH("seeAll")}
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3 xl:gap-5">
        {isLoading &&
          Array.from({ length: 6 }).map((_, index) => (
            <CourseCardSkeleton key={index} />
          ))}

        {!isLoading && error && (
          <div className="col-span-full rounded-3xl border border-red-100 bg-red-50 px-6 py-8 text-sm text-red-700">
            {t("view.error")}: {error}
          </div>
        )}

        {!isLoading && !error && courses?.length === 0 && (
          <div className="col-span-full rounded-3xl border border-slate-200 bg-white px-8 py-10 text-center text-sm text-slate-600">
            {t("noCourses")}
          </div>
        )}

        {!isLoading &&
          !error &&
          courses?.map((course, index) => {
            if (index > 2) return null;
            
            const categoryName =
              course.attributes.category?.data?.attributes?.name ?? "";
            const instructorName =
              course.attributes.instructor?.data?.attributes?.full_name ?? "";
            const locationName =
              course.attributes.center?.data?.attributes?.name ?? "";
            const thumbnail = course.attributes.thumbnail || "/logo.svg";
            const locked = courseIsLocked(course);
            
            return (
              <StudentCourseCard
                key={course.id}
                image={thumbnail}
                title={course.attributes.title}
                instructor={instructorName}
                location={locationName}
                subTitle={course.attributes.sub_title ?? ""}
                lectures={course.attributes.stats?.lectures ?? 0}
                exams={course.attributes.stats?.exams ?? 0}
                progress={getCourseProgress(course)}
                typeLabel={categoryName}
                statusLabel={String(course.attributes.status)}
                statusCode={course.attributes.status}
                locked={locked}
                onView={locked ? undefined : () => goToCourse(course.id)}
                onActivate={locked ? () => activation.openForCourse(course) : undefined}
              />
            );
          })}
      </div>

      <StudentCourseActivationModal
        open={activation.open}
        onClose={activation.close}
        courseId={activation.courseId}
        courseTitle={activation.courseTitle}
        onActivated={async () => {
          await refetch();
        }}
      />
    </section>
  );
}
