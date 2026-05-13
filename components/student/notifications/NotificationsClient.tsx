// components/student/notifications/NotificationsClient.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCircle2, Search, Video } from "lucide-react";
import { useTranslations } from "next-intl";
import { getPusherClient } from "@/src/lib/pusher.client";

export type NotificationItem = {
  id: string;

  type: string;

  notifiable_type: string;

  notifiable_id: string;

  data: {
    title: string;

    message: string;

    type: string;

    device?: string;

    ip_address?: string;

    created_at: string;
  };

  read_at: string | null;

  created_at: string;

  updated_at: string;
};

type FilterType = "all" | "live" | "course" | "exam" | "general";

export default function NotificationsClient({
  initialNotifications,
}: {
  initialNotifications: NotificationItem[];
}) {
  const t = useTranslations("notifications");

  const [notifications, setNotifications] =
    useState<NotificationItem[]>(initialNotifications);

  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const pusher = getPusherClient();

    const channel = pusher.subscribe("notifications");

    channel.bind("new-notification", (data: NotificationItem) => {
      setNotifications((prev) => [data, ...prev]);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe("notifications");
    };
  }, []);

  const unreadCount = notifications.filter(
    (item) => !item.read_at,
  ).length;

const filteredNotifications = useMemo(() => {
  const value = search.toLowerCase().trim();

  return notifications.filter((item) => {
    const title = item?.data?.title || "";

    const message = item?.data?.message || "";

    const rawType =
      item?.data?.type ||
      item?.type ||
      "";

    let normalizedType: FilterType = "general";

    if (rawType.toLowerCase().includes("live")) {
      normalizedType = "live";
    } else if (rawType.toLowerCase().includes("course")) {
      normalizedType = "course";
    } else if (rawType.toLowerCase().includes("exam")) {
      normalizedType = "exam";
    }

    const matchesSearch =
      !value ||
      title.toLowerCase().includes(value) ||
      message.toLowerCase().includes(value);

    const matchesFilter =
      activeFilter === "all" ||
      normalizedType === activeFilter;

    return matchesSearch && matchesFilter;
  });
}, [notifications, search, activeFilter]);

  return (
    <main className="min-h-screen bg-[#FAFAF8] p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
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
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--border-color)] bg-white px-4 text-sm font-medium text-[var(--text-muted)] transition hover:bg-gray-50"
        >
          <CheckCircle2 size={16} />
          {t("markAllAsRead")}
        </button>
      </div>

      <section className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[var(--border-color)] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-3">
            {(["all", "live", "course", "exam", "general"] as FilterType[]).map(
              (filter) => {
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
              },
            )}
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
          <div className="flex min-h-[360px] items-center justify-center p-8 text-center text-sm text-[var(--text-muted)]">
            {t("empty")}
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-color)]">
            {filteredNotifications.map((notification) => {
              const title =
                notification.data.title || t("fallbackTitle");

              const message =
                notification.data.message ||
                notification.data.message ||
                t("fallbackMessage");

              const isUnread = !notification.read_at;

              return (
                <article
                  key={notification.id}
                  className="flex min-h-[120px] items-start justify-between gap-4 px-5 py-6 transition hover:bg-[#FAFAF8]"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500 shadow-sm">
                      <Video size={18} />
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

                  <div className="flex shrink-0 items-center gap-2 pt-1 text-xs text-[var(--text-placeholder)]">
                    {isUnread && (
                      <span className="size-2 rounded-full bg-[var(--primary)]" />
                    )}

                    <span>
                      {notification.created_at || t("justNow")}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}