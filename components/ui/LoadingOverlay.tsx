"use client";

import { useTranslations } from "next-intl";

export default function LoadingOverlay() {
  const t = useTranslations("common");

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/60 backdrop-blur-[2px]">
      <div className="flex flex-col items-center rounded-2xl bg-white p-8 shadow-xl border border-slate-100">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent shadow-sm"></div>
        <p className="mt-4 text-sm font-semibold text-slate-700 animate-pulse">
          {t("loading") || "Loading..."}
        </p>
      </div>
    </div>
  );
}
