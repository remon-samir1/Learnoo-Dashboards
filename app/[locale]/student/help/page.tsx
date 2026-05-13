"use client";

import { ChevronDown, MessageCircle, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

const categories = [
  "all",
  "account",
  "courses",
  "exams",
  "payments",
  "technical",
];

const faqs = [
  {
    category: "account",
    key: "resetPassword",
  },
  {
    category: "courses",
    key: "accessPurchasedCourses",
  },
  {
    category: "exams",
    key: "retakeExam",
  },
  {
    category: "payments",
    key: "activationCode",
  },
  {
    category: "technical",
    key: "videoPlayerIssue",
  },
  {
    category: "courses",
    key: "lectureWatchLimit",
  },
  {
    category: "account",
    key: "changeCenter",
  },
  {
    category: "technical",
    key: "downloadMaterials",
  },
];

function FaqItem({
  faq,
}: {
  faq: {
    category: string;
    key: string;
  };
}) {
  const t = useTranslations("studentHelp.help");
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-start justify-between gap-4 p-4 text-left"
      >
        <div>
          <span className="rounded-md bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-600">
            {t(`categories.${faq.category}`)}
          </span>

          <h3 className="mt-2 text-sm font-semibold text-gray-900">
            {t(`faqs.${faq.key}.question`)}
          </h3>
        </div>

        <ChevronDown
          size={16}
          className={`mt-1 shrink-0 text-gray-400 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="px-4 pb-4">
          <div className="border-t border-gray-100 pt-4 text-sm leading-6 text-gray-500">
            {t(`faqs.${faq.key}.answer`)}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  const t = useTranslations("studentHelp.help");
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchValue, setSearchValue] = useState("");

  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const question = t(`faqs.${faq.key}.question`).toLowerCase();

      const answer = t(`faqs.${faq.key}.answer`).toLowerCase();

      const category = t(`categories.${faq.category}`).toLowerCase();

      const search = searchValue.toLowerCase().trim();

      const matchesCategory =
        activeCategory === "all" || faq.category === activeCategory;

      const matchesSearch =
        question.includes(search) ||
        answer.includes(search) ||
        category.includes(search);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchValue, t]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>

        <p className="mt-1 text-sm text-gray-500">{t("description")}</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-600"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((category) => {
            const isActive = activeCategory === category;

            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`rounded-md px-4 py-2 text-xs font-medium transition ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {t(`categories.${category}`)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq) => <FaqItem key={faq.key} faq={faq} />)
        ) : (
          <div className="p-6 text-center text-sm text-gray-500">
            {t("noResults")}
          </div>
        )}
      </div>

      <div className="rounded-xl bg-gradient-to-r from-blue-700 to-indigo-900 p-10 text-center text-white">
        <MessageCircle className="mx-auto mb-4" size={32} />

        <h2 className="text-lg font-bold">{t("stillNeedHelp")}</h2>

        <p className="mt-2 text-sm text-blue-100">
          {t("stillNeedHelpDescription")}
        </p>

        <button
          type="button"
          className="mt-5 rounded-lg bg-white px-5 py-2 text-sm font-semibold text-blue-700"
        >
          {t("contactSupport")}
        </button>
      </div>
    </div>
  );
}
