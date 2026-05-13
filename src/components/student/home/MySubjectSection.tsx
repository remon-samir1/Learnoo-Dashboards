"use client";

import {
  BarChart3,
  BriefcaseBusiness,
  Calculator,
  Landmark,
} from "lucide-react";
import { useTranslations } from "next-intl";

type Category = {
  id: string;
  type: string;
  attributes: {
    name: string;
    stats?: {
      courses?: number;
      students?: number;
    };
    courses?: unknown[];
  };
};

const icons = [
  {
    icon: BarChart3,
    bg: "bg-pink-100",
    iconColor: "text-pink-600",
  },
  {
    icon: Landmark,
    bg: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    icon: Calculator,
    bg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    icon: BriefcaseBusiness,
    bg: "bg-yellow-100",
    iconColor: "text-yellow-700",
  },
];

export default function MySubjectSection({
  categories = [],
}: {
  categories: Category[];
}) {
  const t = useTranslations("student.home.subjects");

  const visibleCategories = categories.slice(0, 4);

  if (!visibleCategories.length) return null;

  return (
    <section className="rounded-2xl border border-[var(--border-color)] bg-white px-4 py-5 shadow-sm sm:px-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold text-[var(--text-dark)]">
          {t("title")}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {visibleCategories.map((category, index) => {
          const IconData = icons[index % icons.length];
          const Icon = IconData.icon;

          const title = category?.attributes?.name || t("fallbackTitle");

          const coursesCount =
            category?.attributes?.stats?.courses ??
            category?.attributes?.courses?.length ??
            0;

          const studentsCount = category?.attributes?.stats?.students ?? 0;

          return (
            <div
              key={category.id}
              className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--border-color)] bg-white p-4 transition hover:-translate-y-1 hover:shadow-md sm:p-5 lg:items-start"
            >
              <span
                className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${IconData.bg}`}
              >
                <Icon className={IconData.iconColor} size={28} />
              </span>

              <h3 className="line-clamp-1 text-lg font-bold text-[var(--text-dark)]">
                {title}
              </h3>

              <div className="mt-3 space-y-1">
                <p className="text-sm text-[var(--text-muted)]">
                  {coursesCount} {t("lectures")}
                </p>

                <p className="text-sm text-[var(--text-muted)]">
                  {studentsCount} {t("exams")}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
