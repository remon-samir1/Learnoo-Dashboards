"use client";

import { useLocale, useTranslations } from "next-intl";
import { Clock, Download } from "lucide-react";

/**
 * Placeholder only — mirrors admin `/downloads` coming-soon UX (no APIs or file logic).
 */
export default function StudentDownloadsPage() {
  const locale = useLocale();
  const t = useTranslations("studentDownloads");
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <div
      className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-6 px-4 py-12 sm:min-h-[60vh] sm:py-16"
      dir={dir}
    >
      <div className="flex size-24 shrink-0 items-center justify-center rounded-2xl border border-[#E2E8F0] bg-gradient-to-br from-[#EEF2FF] to-[#F1F5F9] shadow-sm">
        <Download
          className="size-12 text-[var(--primary)]"
          strokeWidth={1.75}
          aria-hidden
        />
      </div>

      <div className="text-center">
        <h1 className="mb-2 text-2xl font-bold text-[var(--text-dark,#1E293B)]">
          {t("title")}
        </h1>
        <div className="inline-flex items-center gap-2 rounded-full bg-[#F8FAFC] px-4 py-2 text-[#64748B]">
          <Clock className="size-4 shrink-0" aria-hidden />
          <span className="text-sm font-medium">{t("headline")}</span>
        </div>
      </div>

      <p className="max-w-md text-center text-sm leading-relaxed text-[#94A3B8]">
        {t("description")}
      </p>
    </div>
  );
}
