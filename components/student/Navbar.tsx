"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useDebounce } from "@uidotdev/usehooks";
import {
  Bell,
  BookOpen,
  ChevronDown,
  FileText,
  Globe2,
  MessageCircle,
  Search,
  Video,
} from "lucide-react";

type DropdownType = "language" | "notifications" | null;

const languages = [
  { code: "en", short: "EN" },
  { code: "ar", short: "AR" },
];

const notificationItems = [
  {
    id: 1,
    title: "Live Session Starting",
    message: "Advanced Spring Algorithms starts in 15 minutes",
    time: "2 min ago",
    icon: Video,
    color: "bg-red-100 text-red-500",
    unread: true,
  },
  {
    id: 2,
    title: "New Lecture Available",
    message: "Chapter 3: Data Structures is now available",
    time: "1 hour ago",
    icon: BookOpen,
    color: "bg-green-100 text-green-500",
    unread: true,
  },
  {
    id: 3,
    title: "Exam Reminder",
    message: "Midterm Exam starts tomorrow at 6:00 PM",
    time: "3 hours ago",
    icon: FileText,
    color: "bg-orange-100 text-orange-500",
    unread: false,
  },
  {
    id: 4,
    title: "New Reply",
    message: "Dr. Sarah Ahmed replied to your question",
    time: "Yesterday",
    icon: MessageCircle,
    color: "bg-blue-100 text-primary",
    unread: false,
  },
];

export default function Navbar() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("navbar");

  const [search, setSearch] = useState("");
  const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);

  const debouncedSearch = useDebounce(search, 500);

  console.log("Search:", debouncedSearch);

  const currentLanguage =
    languages.find((language) => language.code === locale) || languages[0];

  const toggleDropdown = (dropdown: Exclude<DropdownType, null>) => {
    setOpenDropdown((current) => (current === dropdown ? null : dropdown));
  };

  const changeLanguage = (language: string) => {
    document.cookie = `locale=${language}; path=/; max-age=31536000`;
    setOpenDropdown(null);
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[var(--border-color)] bg-[var(--card-bg)] px-5">
      <div className="relative max-w-[760px] flex-1">
        <Search
          size={17}
          className="absolute start-4 top-1/2 -translate-y-1/2 text-[var(--text-placeholder)]"
        />

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="h-10 w-full rounded-xl border border-[var(--border-color)] bg-gray-50 ps-11 pe-4 text-sm text-[var(--text-main)] outline-none transition placeholder:text-[var(--text-placeholder)] focus:border-[var(--primary-blue)] focus:bg-white"
        />
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
                  <span>
                    {language.code === "en" ? t("english") : t("arabic")}
                  </span>
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
            <span className="absolute end-2.5 top-2.5 size-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          {openDropdown === "notifications" && (
            <div className="absolute end-0 top-12 z-50 w-[330px] overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-xl">
              <div className="flex items-center justify-between px-4 py-4">
                <h3 className="text-base font-bold text-dark">Notifications</h3>

                <button
                  type="button"
                  className="text-xs font-semibold text-primary transition hover:opacity-80"
                >
                  Mark all as read
                </button>
              </div>

              <div>
                {notificationItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.id}
                      className="flex gap-3 border-t border-[var(--border-color)] px-4 py-3 transition hover:bg-gray-50"
                    >
                      <div
                        className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${item.color}`}
                      >
                        <Icon size={18} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="text-sm font-semibold text-dark">
                            {item.title}
                          </h4>

                          {item.unread && (
                            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                          )}
                        </div>

                        <p className="mt-1 text-sm leading-5 text-[var(--text-muted)]">
                          {item.message}
                        </p>

                        <span className="mt-1 block text-xs text-[var(--text-placeholder)]">
                          {item.time}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                className="w-full border-t border-[var(--border-color)] py-3 text-center text-sm font-semibold text-primary transition hover:bg-blue-50"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white"
        >
          AH
        </button>
      </div>
    </header>
  );
}
