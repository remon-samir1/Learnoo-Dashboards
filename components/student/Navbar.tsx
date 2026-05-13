"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import {
  Bell,
  BookOpen,
  ChevronDown,
  FileText,
  Globe2,
  LogOut,
  MessageCircle,
  Search,
  Settings,
  User,
  Video,
} from "lucide-react";
import Cookies from "@/lib/cookies";
import { useDebouncedCallback } from "use-debounce";
import { getPusherClient } from "@/src/lib/pusher.client";
import type { CurrentUser } from "@/src/interfaces/current-user.interface";
import { getUserAttributes, getUserInitials } from "@/src/lib/current-user";
import { toast } from "sonner";
import { userLogout } from "@/src/services/student/auth.service";
import SearchBox from "./SearchBox";

type DropdownType = "language" | "notifications" | "profile" | null;

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

const languages = [
  { code: "en", label: "English", short: "EN" },
  { code: "ar", label: "العربية", short: "AR" },
];

function getNotificationIcon(type?: string | null) {
  if (type === "live") return Video;
  if (type === "course") return BookOpen;
  if (type === "exam") return FileText;
  return MessageCircle;
}

function getNotificationStyle(type?: string | null) {
  if (type === "live") return "bg-red-100 text-red-500";
  if (type === "course") return "bg-green-100 text-green-500";
  if (type === "exam") return "bg-orange-100 text-orange-500";
  return "bg-blue-100 text-primary";
}

function formatNotificationDate(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Navbar({
  initialNotifications = [],
  currentUser = null,
}: {
  initialNotifications?: NotificationItem[];
  currentUser?: CurrentUser | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("navbar");

  const user = useMemo(
    () => getUserAttributes(currentUser ?? null),
    [currentUser],
  );
  const handleLogout = async () => {
    const res = await userLogout();

    if (!res.success) {
      toast.error(res.message || "Logout failed");
      return;
    }

    toast.success(res.message || "Logged out successfully");

    Cookies.remove("token");

    router.push("/login");
    router.refresh();
  };
  const initials = useMemo(() => {
    const source =
      user.full_name?.trim() ||
      [user.first_name, user.last_name]
        .map((p) => (typeof p === "string" ? p.trim() : ""))
        .filter(Boolean)
        .join(" ")
        .trim();
    return getUserInitials(source || null);
  }, [user.first_name, user.full_name, user.last_name]);

  const displayName = useMemo(() => {
    const full = user.full_name?.trim();
    if (full) return full;
    return [user.first_name, user.last_name]
      .map((p) => (typeof p === "string" ? p.trim() : ""))
      .filter(Boolean)
      .join(" ")
      .trim();
  }, [user.first_name, user.full_name, user.last_name]);

  const emailDisplay = user.email?.trim() || "";
  const avatarSrc =
    typeof user.image === "string" && user.image.trim()
      ? user.image.trim()
      : null;

  const [search, setSearch] = useState("");
  const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(initialNotifications);

  const debounced = useDebouncedCallback((value: string) => {
    setSearch(value);
  }, 1000);

  useEffect(() => {
    const handleNavClick = () => {
      setOpenDropdown(null);
    };
  }, [pathname]);

  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe("global");
    channel.bind_global((eventName: string, data: unknown) => {
      if (eventName.includes("pusher_internal")) return;
      setNotifications((prev) => [data as NotificationItem, ...prev]);
    });
    return () => {
      channel.unbind_global();
      pusher.unsubscribe("global");
    };
  }, []);

  const unreadCount = useMemo(() => {
    return notifications.filter((item) => !item.read_at).length;
  }, [notifications]);
  const latestNotifications = notifications.slice(0, 4);

  const currentLanguage =
    languages.find((language) => language.code === locale) || languages[0];

  const toggleDropdown = (dropdown: Exclude<DropdownType, null>) => {
    setOpenDropdown((current) => (current === dropdown ? null : dropdown));
  };

  const changeLanguage = (language: string) => {
    Cookies.set("locale", language, {
      expires: 365,
      path: "/",
      sameSite: "lax",
    });

    setOpenDropdown(null);

    const segments = pathname.split("/").filter(Boolean);

    if (segments[0] === "en" || segments[0] === "ar") {
      segments[0] = language;
      router.replace(`/${segments.join("/")}`);
    } else {
      router.replace(`/${language}${pathname === "/" ? "" : pathname}`);
    }

    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between border-b border-[var(--border-color)] bg-[var(--card-bg)] px-5">
      <div className="relative max-w-[760px] flex-1">
        <SearchBox />
      </div>

      <div className="ms-4 flex items-center gap-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown("language")}
            className="flex h-10 items-center gap-2 rounded-full bg-gray-50 px-3 text-sm font-semibold text-[var(--text-muted)] transition hover:bg-blue-50 hover:text-primary"
          >
            <Globe2 size={17} />
            <span>{currentLanguage.short}</span>
            <ChevronDown size={15} />
          </button>

          {openDropdown === "language" && (
            <div className="absolute end-0 top-12 z-50 w-40 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-2 shadow-xl">
              {languages.map((language) => (
                <button
                  key={language.code}
                  type="button"
                  onClick={() => changeLanguage(language.code)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
                    locale === language.code
                      ? "bg-blue-50 text-primary"
                      : "text-[var(--text-muted)] hover:bg-blue-50 hover:text-primary"
                  }`}
                >
                  <span>{language.label}</span>
                  <span className="text-xs font-bold">{language.short}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown("notifications")}
            className="relative flex size-10 items-center justify-center rounded-full bg-gray-50 text-[var(--text-muted)] transition hover:bg-blue-50 hover:text-primary"
          >
            <Bell size={19} />

            {unreadCount > 0 && (
              <span className="absolute end-2.5 top-2.5 size-2 rounded-full bg-red-500 ring-2 ring-white" />
            )}
          </button>

          {openDropdown === "notifications" && (
            <div className="absolute end-0 top-12 z-50 w-[350px] overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-xl">
              <div className="flex items-center justify-between px-4 py-4">
                <h3 className="text-base font-bold text-dark">
                  {t("notifications")}
                </h3>

                {unreadCount > 0 && (
                  <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-500">
                    {unreadCount} {t("new")}
                  </span>
                )}
              </div>

              {latestNotifications.length === 0 ? (
                <div className="border-t border-[var(--border-color)] px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                  {t("noNotifications")}
                </div>
              ) : (
                latestNotifications.map((item, index) => {
                  const type = item.notifiable_type || item.type || "general";
                  const Icon = getNotificationIcon(type);

                  const title =
                    item?.data?.title || t("notificationFallbackTitle");

                  const message =
                    item?.data?.message || t("notificationFallbackMessage");

                  return (
                    <div
                      key={index}
                      className="flex gap-3 border-t border-[var(--border-color)] px-4 py-3 transition hover:bg-gray-50"
                    >
                      <div
                        className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${getNotificationStyle(
                          type,
                        )}`}
                      >
                        <Icon size={18} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="line-clamp-1 text-sm font-semibold text-dark">
                            {title}
                          </h4>

                          {!item.read_at && (
                            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                          )}
                        </div>

                        <p className="mt-1 line-clamp-2 text-sm leading-5 text-[var(--text-muted)]">
                          {message}
                        </p>

                        <span className="mt-1 block text-xs text-[var(--text-placeholder)]">
                          {formatNotificationDate(item.created_at) ||
                            t("justNow")}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}

              <Link
                href={`/${locale}/student/notifications`}
                onClick={() => setOpenDropdown(null)}
                className="block w-full border-t border-[var(--border-color)] py-3 text-center text-sm font-semibold text-primary transition hover:bg-blue-50"
              >
                {t("viewAllNotifications")}
              </Link>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown("profile")}
            className={`relative flex size-10 items-center justify-center overflow-hidden rounded-full border border-[var(--border-color)] text-xs font-bold transition hover:opacity-90 ${
              avatarSrc
                ? "bg-gray-50 text-[var(--text-dark)]"
                : "bg-[var(--primary)] text-white"
            }`}
            aria-expanded={openDropdown === "profile"}
            aria-haspopup="true"
          >
            {avatarSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarSrc} alt="" className="size-full object-cover" />
            ) : (
              <span>{initials}</span>
            )}
          </button>

          {openDropdown === "profile" && (
            <div className="absolute end-0 top-12 z-50 w-[min(100vw-2rem,280px)] overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-xl">
              <div className="border-b border-[var(--border-color)] px-4 py-4">
                <p className="truncate text-sm font-bold text-[var(--text-dark)]">
                  {displayName || "—"}
                </p>
                {emailDisplay ? (
                  <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
                    {emailDisplay}
                  </p>
                ) : null}
              </div>

              <div className="p-2">
                <Link
                  href={`/${locale}/student/profile`}
                  onClick={() => setOpenDropdown(null)}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-muted)] transition hover:bg-blue-50 hover:text-[var(--primary)]"
                >
                  <User size={18} className="shrink-0" />
                  {t("profile")}
                </Link>

                <Link
                  href={`/${locale}/student/settings`}
                  onClick={() => setOpenDropdown(null)}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-muted)] transition hover:bg-blue-50 hover:text-[var(--primary)]"
                >
                  <Settings size={18} className="shrink-0" />
                  {t("settings")}
                </Link>

                <button
                  onClick={handleLogout}
                  type="button"
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-muted)] transition hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut size={18} className="shrink-0" />
                  {t("logout")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
