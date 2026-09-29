// components/student/notifications/NotificationsClient.tsx

"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  BookOpen,
  CheckCircle2,
  FileText,
  MessageCircle,
  Search,
  Video,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  getStudentNotificationCategory,
  resolveStudentNotificationHref,
} from "@/src/lib/student-notification-target";
import {
  useNotificationActions,
  useNotifications,
  useNotificationStore,
} from "@/src/stores/notificationStore";
import type {
  StudentNotification,
  StudentNotificationCategory,
} from "@/src/types/student-notification";

function getCategoryIcon(category: string) {
  if (category === "live") return Video;
  if (category === "course") return BookOpen;
  if (category === "exam") return FileText;
  return MessageCircle;
}

function getCategoryStyle(category: string) {
  if (category === "live") return "bg-red-50 text-red-500";
  if (category === "course") return "bg-green-50 text-green-500";
  if (category === "exam") return "bg-orange-50 text-orange-500";
  return "bg-blue-50 text-[var(--primary)]";
}

function formatNotificationDate(value: string | null | undefined, locale: string) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString(locale === "ar" ? "ar-EG" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationsClient() {
  const t = useTranslations("notifications");
  const locale = useLocale();
  const router = useRouter();

  // The list is owned by the store, which `StudentNotificationsRuntime` keeps fresh.
  const { notifications, unreadCount, isMarkingAll, hasSeeded, error } =
    useNotifications();
  const { markAsRead, markAllAsRead, refresh } = useNotificationActions();

  // Keeps the page's "could not load / try again" state, which the list owned
  // before it moved into the store.
  const loadFailed = error != null && notifications.length === 0;

  const [activeFilter, setActiveFilter] = useState<StudentNotificationCategory>("all");
  const [search, setSearch] = useState("");

  const filteredNotifications = useMemo(() => {
    const value = search.toLowerCase().trim();

    return notifications.filter((item) => {
      const title = item?.data?.title || "";
      const message = item?.data?.message || "";

      const matchesSearch =
        !value ||
        title.toLowerCase().includes(value) ||
        message.toLowerCase().includes(value);

      const matchesFilter =
        activeFilter === "all" ||
        getStudentNotificationCategory(item) === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [notifications, search, activeFilter]);

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();

    // The store rolls the list back and records `error` when the request failed.
    if (useNotificationStore.getState().error) {
      toast.error(t("markAllFailed"));
      return;
    }

    toast.success(t("markedAllAsRead"));
  };

  const handleOpen = (notification: StudentNotification) => {
    if (!notification.read_at) {
      void markAsRead(notification.id);
    }

    const href = resolveStudentNotificationHref(notification, locale);
    if (href) router.push(href);
  };

  return (
    <main className="min-h-screen bg-[#FAFAF8] p-6">
      <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
          <div className="flex items-center gap-3">
            <Bell size={24} className="text-[var(--primary)]" />

            <h1 className="text-2xl font-bold text-[var(--text-dark)]">
              {t("title")}
            </h1>

            {unreadCount > 0 && (
              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-500">
                {t("newCount", { count: unreadCount })}
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {t("description")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleMarkAllAsRead()}
          disabled={unreadCount === 0 || isMarkingAll}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--border-color)] bg-white px-4 text-sm font-medium text-[var(--text-muted)] transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CheckCircle2 size={16} />
          {t("markAllAsRead")}
        </button>
      </div>

      <section className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[var(--border-color)] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-3">
            {(
              ["all", "live", "course", "exam", "general"] as StudentNotificationCategory[]
            ).map((filter) => {
              const isActive = activeFilter === filter;

              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`rounded-xl px-5 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-[var(--primary)] text-white"
                      : "text-[var(--text-muted)] hover:bg-gray-50"
                  }`}
                >
                  {t(`filters.${filter}`)}
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:w-72">
            <Search
              size={16}
              className="absolute start-3 top-1/2 -translate-y-1/2 text-[var(--text-placeholder)]"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("searchPlaceholder")}
              className="h-10 w-full rounded-xl border border-[var(--border-color)] bg-white px-10 text-sm outline-none placeholder:text-[var(--text-placeholder)] focus:border-[var(--primary)]"
            />
          </div>
        </div>

        {filteredNotifications.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 p-8 text-center text-sm text-[var(--text-muted)]">
            {loadFailed ? (
              <>
                {t("loadFailed")}
                <button
                  type="button"
                  onClick={() => refresh()}
                  className="rounded-lg border border-[var(--border-color)] px-4 py-1.5 text-sm font-medium text-[var(--text-dark)] transition hover:bg-gray-50"
                >
                  {t("retry")}
                </button>
              </>
            ) : (
              <>{hasSeeded ? t("empty") : t("loading")}</>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-color)]">
            {filteredNotifications.map((notification) => {
              const title = notification.data?.title || t("fallbackTitle");
              const message = notification.data?.message || t("fallbackMessage");

              const isUnread = !notification.read_at;
              const category = getStudentNotificationCategory(notification);
              const Icon = getCategoryIcon(category);
              const href = resolveStudentNotificationHref(notification, locale);

              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleOpen(notification)}
                  aria-label={title}
                  className={`flex w-full min-h-[120px] items-start justify-between gap-4 px-5 py-6 text-start transition hover:bg-[#FAFAF8] ${
                    isUnread ? "bg-blue-50/40" : ""
                  } ${href ? "cursor-pointer" : "cursor-default"}`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex size-11 shrink-0 items-center justify-center rounded-full shadow-sm ${getCategoryStyle(
                        category,
                      )}`}
                    >
                      <Icon size={18} />
                    </div>

                    <div>
                      <h2 className="text-sm font-bold text-[var(--text-dark)]">
                        {title}
                      </h2>

                      <p className="mt-2 text-sm text-[var(--text-muted)]">
                        {message}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2 pt-1 text-xs text-[var(--text-placeholder)]">
                    <span>
                      {formatNotificationDate(notification.created_at, locale) ||
                        t("justNow")}
                    </span>

                    {isUnread && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-[var(--primary)]">
                        <span className="size-1.5 rounded-full bg-[var(--primary)]" />
                        {t("unreadBadge")}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
