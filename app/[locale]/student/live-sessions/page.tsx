// import LiveSessionsClient from "@/components/student/live-sessions/LiveSessionsClient";
// import { getStudentLiveRooms } from "@/src/services/student/live-room.service";

// export default async function StudentLiveSessionsPage() {
//   const res = await getStudentLiveRooms();
//   const rooms = res.success ? res.data ?? [] : [];

//   return (
//     <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
//       <LiveSessionsClient
//         success={res.success}
//         message={res.message}
//         rooms={rooms}
//       />
//     </div>
//   );
// }


"use client";

import { useLocale } from "next-intl";
import { Clock, Video } from "lucide-react";

const content = {
  ar: {
    title: "التحميلات",
    headline: "قريبًا جدًا",
    description:
      "نعمل حاليًا على تجهيز قسم التحميلات لتوفير جميع الملفات والمحاضرات الخاصة بك بسهولة وفي مكان واحد.",
  },

  en: {
    title: "Downloads",
    headline: "Coming Soon",
    description:
      "We are currently preparing the downloads section to provide all your files and lectures easily in one place.",
  },
};

export default function StudentLiveSessionsPage() {
  const locale = useLocale();

  const t = locale === "ar" ? content.ar : content.en;

  return (
    <div
      className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-6 px-4 py-12 sm:min-h-[60vh] sm:py-16"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className="flex size-24 shrink-0 items-center justify-center rounded-2xl border border-[#E2E8F0] bg-gradient-to-br from-[#EEF2FF] to-[#F1F5F9] shadow-sm">
        <Video
          className="size-12 text-[var(--primary)]"
          strokeWidth={1.75}
          aria-hidden
        />
      </div>

      <div className="text-center">
        <h1 className="mb-2 text-2xl font-bold text-[var(--text-dark,#1E293B)]">
          {t.title}
        </h1>

        <div className="inline-flex items-center gap-2 rounded-full bg-[#F8FAFC] px-4 py-2 text-[#64748B]">
          <Clock className="size-4 shrink-0" aria-hidden />

          <span className="text-sm font-medium">{t.headline}</span>
        </div>
      </div>

      <p className="max-w-md text-center text-sm leading-relaxed text-[#94A3B8]">
        {t.description}
      </p>
    </div>
  );
}