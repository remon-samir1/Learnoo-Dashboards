"use client";

import { KeyRound } from "lucide-react";
import { useTranslations } from "next-intl";

export default function QuickActivationCard() {
  const t = useTranslations("student.home.quickActivation");

  return (
    <section className="flex flex-col gap-5 rounded-2xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] px-4 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6 sm:py-6">
      <div className="min-w-0 flex-1">
        <h2 className="text-xl font-bold text-white sm:text-2xl">{t("title")}</h2>

        <p className="mt-2 text-sm text-white/90">{t("description")}</p>

        <button
          type="button"
          className="mt-4 flex h-11 w-full min-w-0 items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-primary transition duration-300 hover:opacity-90 active:translate-y-px sm:mt-5 sm:w-auto"
        >
          {t("button")}
        </button>
      </div>
      <KeyRound
        className="mx-auto shrink-0 text-white/90 sm:mx-0"
        size={56}
        strokeWidth={1.25}
        aria-hidden
      />
    </section>
  );
}
