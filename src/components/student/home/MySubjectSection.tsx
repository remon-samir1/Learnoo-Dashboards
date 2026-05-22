"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Lock,
  Users,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { activateCourseCode } from "@/src/services/student/activation.service";

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

  const categoryMap = useMemo(() => {
    return new Map(categories.map((item) => [String(item.id), item]));
  }, [categories]);

  const rootCategories = useMemo(() => {
    const ids = new Set(categories.map((item) => String(item.id)));

    return categories.filter((item) => {
      const parentId = item.attributes.parent_id;

      return !parentId || !ids.has(String(parentId));
    });
  }, [categories]);

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

  const currentCourses =
    selectedCategory?.attributes.courses || [];

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
                  className="group flex min-h-[180px] flex-col rounded-2xl border border-[var(--border-color)] bg-white p-4 text-start transition hover:-translate-y-1 hover:border-[var(--primary)] hover:shadow-md"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-gray-100">
                      {image ? (
                        <Image
                          src={image}
                          alt={title}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-blue-50">
                          <BookOpen
                            size={24}
                            className="text-[var(--primary)]"
                          />
                        </div>
                      )}
                    </div>

                    <ChevronLeft
                      size={20}
                      className="text-[var(--text-placeholder)] transition group-hover:text-[var(--primary)]"
                    />
                  </div>

                  <h3 className="line-clamp-2 text-lg font-bold text-[var(--text-dark)]">
                    {title}
                  </h3>

                  <div className="mt-auto flex items-center gap-4 pt-4 text-sm text-[var(--text-muted)]">
                    <span className="flex items-center gap-1">
                      <BookOpen size={15} />
                      {coursesCount} {t("courses")}
                    </span>

                    <span className="flex items-center gap-1">
                      <Users size={15} />
                      {studentsCount} {t("students")}
                    </span>
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
                <>
                  <div className="relative h-36 w-full overflow-hidden ">
                    {course.attributes.thumbnail ? (
                      <Image
                        src={
                          course.attributes.thumbnail
                        }
                        alt={
                          course.attributes.title
                        }
                        width={75}
                        height={75}
                        className="h-75 w-75 object-cover transition group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-blue-50">
                        <BookOpen
                          size={32}
                          className="text-[var(--primary)]"
                        />
                      </div>
                    )}

                    {locked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[var(--primary)] shadow">
                          <Lock size={20} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="line-clamp-1 font-bold text-[var(--text-dark)]">
                      {course.attributes.title}
                    </h3>

                    {course.attributes.sub_title && (
                      <p className="mt-1 line-clamp-1 text-sm text-[var(--text-muted)]">
                        {
                          course.attributes
                            .sub_title
                        }
                      </p>
                    )}

                    <div className="mt-3 flex items-center gap-3 text-xs text-[var(--text-muted)]">
                      <span>
                        {course.attributes.stats
                          ?.notes ?? 0}{" "}
                        {t("notes")}
                      </span>

                      <span>
                        {course.attributes.stats
                          ?.lectures ?? 0}{" "}
                        {t("lectures")}
                      </span>
                    </div>

                    {locked && (
                      <div className="mt-4 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-center text-sm font-bold text-white transition group-hover:bg-[var(--primary-blue)]">
                        {t(
                          "activation.button",
                        )}
                      </div>
                    )}
                  </div>
                </>
              );

              return (
                <Link
                  key={course.id}
                  href={href}
                  className="group overflow-hidden rounded-2xl border border-[var(--border-color)] bg-white transition hover:-translate-y-1 hover:border-[var(--primary)] hover:shadow-md"
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