"use client";

import { useLocale } from "next-intl";
import { useCountdown } from "@/src/hooks/useCountdown";

export function ScheduledCountdown({ date }: { date?: string | null }) {
  const locale = useLocale();
  const countdown = useCountdown(date, { dayLabel: locale === "ar" ? "يوم" : "d" });
  if (!date || !countdown.isReady || countdown.isPast) return null;
  return <span className="inline-block rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700" aria-label={locale === "ar" ? "الوقت المتبقي" : "Time remaining"}>
    <bdi dir="ltr">{countdown.formatted}</bdi>
  </span>;
}
