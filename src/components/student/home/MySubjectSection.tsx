"use client";

import Image from "next/image";
import Link from "next/link";
import Cookies from 'js-cookie';

import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Loader2,
  Lock,
  Users,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { activateCourseCode } from "@/src/services/student/activation.service";

const GRADIENTS = [
  "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 50%, #60a5fa 100%)",
  "linear-gradient(135deg, #047857 0%, #0d9488 50%, #14b8a6 100%)",
  "linear-gradient(135deg, #4338ca 0%, #6366f1 50%, #8b5cf6 100%)",
  "linear-gradient(135deg, #be185d 0%, #ec4899 50%, #f472b6 100%)",
  "linear-gradient(135deg, #0369a1 0%, #0284c7 50%, #38bdf8 100%)",
  "linear-gradient(135deg, #c2410c 0%, #ea580c 50%, #f97316 100%)",
  "linear-gradient(135deg, #6d28d9 0%, #9333ea 50%, #c084fc 100%)",
];

function getGradientStyle(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % GRADIENTS.length;
  return { background: GRADIENTS[index] };
}

function CategoryCardThumbnail({
  image,
  title,
  coursesCount,
  coursesLabel,
}: {
  image?: string | null;
  title: string;
  coursesCount: number;
  coursesLabel: string;
}) {
  const [hasError, setHasError] = useState(false);
  const showFallback = !image || image.trim() === "" || hasError;

  return (
    <div className="relative h-52 w-full overflow-hidden bg-slate-900">
      {!showFallback ? (
        <Image
          src={image!}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          onError={() => setHasError(true)}
        />
      ) : (
        <div
          style={getGradientStyle(title)}
          className="relative flex h-full w-full flex-col justify-between overflow-hidden p-5 text-white transition-transform duration-500 group-hover:scale-[1.02]"
        >
          <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/20 blur-xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-black/25 blur-xl" />

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 shadow-inner backdrop-blur-md">
              <BookOpen size={20} className="text-white" />
            </div>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-md">
              {coursesCount} {coursesLabel}
            </span>
          </div>

          <div className="relative z-10 mt-auto pt-4">
            <span className="line-clamp-2 text-base font-black tracking-tight text-white drop-shadow-md sm:text-lg">
              {title}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function CourseCardThumbnail({
  thumbnail,
  title,
  categoryName,
  locked,
}: {
  thumbnail?: string | null;
  title: string;
  categoryName?: string;
  locked?: boolean;
}) {
  const [hasError, setHasError] = useState(false);
  const showFallback = !thumbnail || thumbnail.trim() === "" || hasError;

  return (
    <div className="relative h-52 w-full overflow-hidden bg-slate-900">
      {!showFallback ? (
        <Image
          src={thumbnail!}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          onError={() => setHasError(true)}
        />
      ) : (
        <div
          style={getGradientStyle(title)}
          className="relative flex h-full w-full flex-col justify-between overflow-hidden p-5 text-white transition-transform duration-500 group-hover:scale-[1.02]"
        >
          <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/20 blur-xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-black/25 blur-xl" />

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 shadow-inner backdrop-blur-md">
              <GraduationCap size={22} className="text-white" />
            </div>
            {categoryName && (
              <span className="max-w-[65%] truncate rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-md">
                {categoryName}
              </span>
            )}
          </div>

          <div className="relative z-10 mt-auto pt-4">
            <span className="line-clamp-2 text-base font-black tracking-tight text-white drop-shadow-md sm:text-lg">
              {title}
            </span>
          </div>
        </div>
      )}

      {locked && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-[2px]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/95 text-slate-800 shadow-xl ring-4 ring-black/10 transition-transform duration-300 group-hover:scale-110">
            <Lock size={22} className="text-[var(--primary)]" />
          </div>
        </div>
      )}
    </div>
  );
}

type Course = {
  id: string;
  type: string;
  attributes: {
    title: string;
    sub_title?: string | null;
    thumbnail?: string | null;
    is_locked?: boolean;
    stats?: {
      notes?: number;
      lectures?: number;
      exams?: number;
      students?: number;
    };
  };
};

type Category = {
  id: string;
  type: string;
  attributes: {
    image?: string | null;
    name: string;
    parent_id?: number | string | null;
    stats?: {
      courses?: number;
      students?: number;
    };
    childrens?: Category[];
    courses?: Course[];
  };
};

export default function MySubjectSection({
  categories = [],
}: {
  categories: Category[];
}) {
  const t = useTranslations("students.home.subjects");
  const locale = useLocale();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [activationCourse, setActivationCourse] =
    useState<Course | null>(null);
  const [activationCode, setActivationCode] = useState("");
  const [activationLoading, setActivationLoading] = useState(false);

  // 👇 جديد: هات بيانات اليوزر عشان تعرف الكلية بتاعته
  const [facultyId, setFacultyId] = useState<string | null>(null);
  const [meLoading, setMeLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const token = Cookies.get('token');

        const res = await fetch(
          "https://api.learnoo.app/v1/auth/me",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          },
        );

        if (!res.ok) {
          throw new Error("Failed to fetch /auth/me");
        }

        const json = await res.json();

        const fId =
          json?.data?.attributes?.faculty?.data?.id ?? null;

        setFacultyId(fId ? String(fId) : null);
      } catch (error) {
        console.error("Fetch me error:", error);
        setFacultyId(null);
      } finally {
        setMeLoading(false);
      }
    };

    fetchMe();
  }, []);

  const categoryMap = useMemo(() => {
    return new Map(categories.map((item) => [String(item.id), item]));
  }, [categories]);

  const rootCategories = useMemo(() => {
    if (facultyId) {
      const facultyFiltered = categories.filter(
        (item) => String(item.attributes.parent_id) === String(facultyId),
      );
      if (facultyFiltered.length > 0) return facultyFiltered;
    }

    return categories.filter(
      (item) =>
        !item.attributes.parent_id ||
        !categoryMap.has(String(item.attributes.parent_id)),
    );
  }, [categories, categoryMap, facultyId]);

  const selectedCategory = selectedId
    ? categoryMap.get(selectedId)
    : null;

  const currentCategories = useMemo(() => {
    if (!selectedCategory) return rootCategories;

    const apiChildren =
      selectedCategory.attributes.childrens || [];

    if (apiChildren.length) {
      return apiChildren.map((child) => {
        return categoryMap.get(String(child.id)) || child;
      });
    }

    return categories.filter(
      (item) =>
        String(item.attributes.parent_id) ===
        String(selectedCategory.id),
    );
  }, [
    categories,
    categoryMap,
    rootCategories,
    selectedCategory,
  ]);

  const currentCourses = useMemo(() => {
    const rawCourses = selectedCategory?.attributes.courses || [];
    return rawCourses.filter((c) => {
      const status = (c.attributes as any)?.status;
      if (status !== undefined && status !== null) {
        return status === 1 || status === "active" || status === true;
      }
      return true;
    });
  }, [selectedCategory]);

  const handleOpenCategory = (category: Category) => {
    setHistory((prev) => [
      ...prev,
      selectedId || "root",
    ]);

    setSelectedId(String(category.id));
  };

  const handleBack = () => {
    const previous = history[history.length - 1];

    setHistory((prev) => prev.slice(0, -1));

    setSelectedId(previous === "root" ? null : previous);
  };

  const closeActivationModal = () => {
    if (activationLoading) return;

    setActivationCourse(null);
    setActivationCode("");
  };

  const handleActivateCourse = async () => {
    if (!activationCourse) return;

    const code = activationCode.trim();

    if (!code) {
      toast.error(t("activation.codeRequired"));
      return;
    }

    try {
      setActivationLoading(true);

      const result = await activateCourseCode(
        code,
        activationCourse.id,
      );

      if (!result.success) {
        toast.error(
          result.message || t("activation.failed"),
        );

        return;
      }

      toast.success(t("activation.success"));

      setActivationCourse(null);
      setActivationCode("");

      window.location.href = `/${locale}/student/courses/course-details/${activationCourse.id}`;
    } catch (error) {
      console.error("Activate course error:", error);

      toast.error(t("activation.error"));
    } finally {
      setActivationLoading(false);
    }
  };

  if (meLoading) return null;

  if (!categories.length) return null;

  return (
    <>
      <section className="rounded-2xl border border-[var(--border-color)] bg-white px-4 py-5 shadow-sm sm:px-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-dark)]">
              {selectedCategory?.attributes.name ||
                t("title")}
            </h2>

            {selectedCategory && (
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {t("chooseLevel")}
              </p>
            )}
          </div>

          {history.length > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-white px-3 py-2 text-sm font-medium text-[var(--text-muted)] transition hover:bg-gray-50"
            >
              <ChevronRight size={18} />
              {t("back")}
            </button>
          )}
        </div>

        {currentCategories.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {currentCategories.map((category) => {
              const title =
                category.attributes.name ||
                t("fallbackTitle");

              const image = category.attributes.image;

              const coursesCount =
                category.attributes.stats?.courses ?? 0;

              const studentsCount =
                category.attributes.stats?.students ?? 0;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() =>
                    handleOpenCategory(category)
                  }
                  className="group flex min-h-[180px] flex-col overflow-hidden rounded-2xl border border-[var(--border-color)] bg-white text-start shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[var(--primary)] hover:shadow-md"
                >
                  <CategoryCardThumbnail
                    image={image}
                    title={title}
                    coursesCount={coursesCount}
                    coursesLabel={t("courses")}
                  />

                  <div className="flex flex-1 flex-col p-4 sm:p-5 w-full">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="line-clamp-2 text-lg font-bold leading-snug tracking-tight text-[var(--text-dark)]">
                        {title}
                      </h3>
                      <ChevronLeft
                        size={20}
                        className="mt-1 shrink-0 text-[var(--text-placeholder)] transition group-hover:text-[var(--primary)]"
                      />
                    </div>

                    <div className="mt-auto flex items-center gap-4 pt-4 text-sm font-medium text-[var(--text-muted)]">
                      <span className="flex items-center gap-1.5">
                        <BookOpen size={16} />
                        {coursesCount} {t("courses")}
                      </span>

                      <span className="flex items-center gap-1.5">
                        <Users size={16} />
                        {studentsCount} {t("students")}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : currentCourses.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {currentCourses.map((course) => {
              const locked =
                course.attributes.is_locked === true;

              const href = `/${locale}/student/courses/course-details/${course.id}`;

              const content = (
                <div className="flex h-full flex-col w-full">
                  <CourseCardThumbnail
                    thumbnail={course.attributes.thumbnail}
                    title={course.attributes.title}
                    categoryName={selectedCategory?.attributes.name}
                    locked={locked}
                  />

                  <div className="flex flex-1 flex-col p-4 sm:p-5">
                    <h3 className="line-clamp-2 text-lg font-bold leading-snug tracking-tight text-[var(--text-dark)]">
                      {course.attributes.title}
                    </h3>

                    {course.attributes.sub_title && (
                      <p className="mt-1 line-clamp-1 text-sm font-medium text-[var(--text-muted)]">
                        {
                          course.attributes
                            .sub_title
                        }
                      </p>
                    )}

                    <div className="mt-auto pt-4 flex items-center gap-4 text-sm font-medium text-[var(--text-muted)]">
                      <span className="flex items-center gap-1.5">
                        <BookOpen size={16} />
                        {course.attributes.stats
                          ?.notes ?? 0}{" "}
                        {t("notes")}
                      </span>

                      <span className="flex items-center gap-1.5">
                        <Users size={16} />
                        {course.attributes.stats
                          ?.lectures ?? 0}{" "}
                        {t("lectures")}
                      </span>
                    </div>

                    {locked && (
                      <div className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700">
                        {t(
                          "activation.button",
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );

              return (
                <Link
                  key={course.id}
                  href={href}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--border-color)] bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[var(--primary)] hover:shadow-md"
                >
                  {content}
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--border-color)] py-10 text-center text-sm text-[var(--text-muted)]">
            {t("empty")}
          </div>
        )}
      </section>

      {activationCourse && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-[var(--text-dark)]">
                  {t("activation.title")}
                </h3>

                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {t(
                    "activation.description",
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={closeActivationModal}
                disabled={activationLoading}
                className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4 rounded-2xl bg-blue-50 px-4 py-3">
              <p className="text-sm font-bold text-[var(--primary)]">
                {
                  activationCourse.attributes
                    .title
                }
              </p>
            </div>

            <input
              value={activationCode}
              onChange={(e) =>
                setActivationCode(
                  e.target.value,
                )
              }
              placeholder={t(
                "activation.placeholder",
              )}
              disabled={activationLoading}
              className="w-full rounded-2xl border border-[var(--border-color)] px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-blue-100 disabled:bg-gray-50"
            />

            <button
              type="button"
              onClick={
                handleActivateCourse
              }
              disabled={activationLoading}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-4 py-3 text-sm font-bold text-white transition hover:bg-[var(--primary-blue)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {activationLoading && (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              )}

              {activationLoading
                ? t(
                  "activation.loading",
                )
                : t(
                  "activation.submit",
                )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}