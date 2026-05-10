"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  BookOpen,
  ChevronLeft,
  Download,
  FileText,
  HelpCircle,
  Home,
  Library,
  NotebookText,
  Settings,
  User,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import Logout from "./Logout";

type SidebarItem = {
  key: string;
  href: string;
  icon: LucideIcon;
};

const sections: SidebarItem[][] = [
  [
    { key: "dashboard", href: "/", icon: Home },
    { key: "myCourses", href: "/student/courses", icon: BookOpen },
    { key: "community", href: "/student/community", icon: Users },
    { key: "liveSessions", href: "/student/live-sessions", icon: Video },
    { key: "examsAndQA", href: "/student/exams", icon: NotebookText },
    { key: "notesSummaries", href: "/student/notes", icon: FileText },
    { key: "electronicLibrary", href: "/student/library", icon: Library },
    { key: "downloads", href: "/student/downloads", icon: Download },
  ],
  [
    { key: "profile", href: "/student/profile", icon: User },
    { key: "settings", href: "/student/settings", icon: Settings },
    { key: "helpFaq", href: "/student/help", icon: HelpCircle },
  ],
];

function NavItem({
  item,
  label,
  collapsed,
  active,
}: {
  item: SidebarItem;
  label: string;
  collapsed: boolean;
  active: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      title={collapsed ? label : undefined}
      className={`group relative flex items-center rounded-xl border border-transparent text-sm font-medium transition-all duration-200 ${
        collapsed ? "justify-center py-3" : "gap-3 px-3 py-2.5"
      } ${
        active
          ? "border-blue-100 bg-primary/20 shadow-sm"
          : "hover:border-blue-100 hover:bg-primary/10"
      }`}
    >
      <span
        className={`absolute start-0 top-1/2 w-1 -translate-y-1/2 rounded-e-full bg-primary transition-all duration-200 ${
          active
            ? "h-6 opacity-100"
            : "h-0 opacity-0 group-hover:h-5 group-hover:opacity-70"
        }`}
      />

      <Icon
        size={18}
        className={`shrink-0 transition-all duration-200 ${
          active
            ? "text-primary"
            : "text-primary group-hover:scale-105"
        }`}
      />

      {!collapsed && (
        <span
          className={`transition-all duration-200 ${
            active
              ? "font-semibold text-primary"
              : "text-[var(--text-muted)] group-hover:text-primary"
          }`}
        >
          {label}
        </span>
      )}
    </Link>
  );
}

export default function Sidebar() {
  const t = useTranslations("sidebar");
  const common = useTranslations("common");
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside
      className={`sticky top-0 h-screen shrink-0 border-e border-[var(--border-color)] bg-[var(--card-bg)] transition-all duration-300 ${
        collapsed ? "w-[100px]" : "w-[240px]"
      }`}
    >
      <button
        type="button"
        onClick={() => setCollapsed((prev) => !prev)}
        aria-label="Toggle sidebar"
        className={`absolute -end-3 top-20 z-50 flex size-7 items-center justify-center rounded-full border shadow-md transition-all duration-300 ${
          collapsed
            ? "border-primary bg-primary text-white hover:opacity-90 border border-white"
            : "border-primary bg-[var(--card-bg)] text-primary hover:bg-blue-50 "
        }`}
      >
        <ChevronLeft
          size={16}
          className={`transition-transform duration-300 ${
            collapsed ? "rotate-180 " : ""
          }`}
        />
      </button>

      <div className="sidebar-scroll h-full overflow-y-auto px-3 py-3 pb-10">
        <div className="flex min-h-full flex-col">
          <Link href="/" className="mb-6 flex items-center justify-center">
            <div className="flex items-center ">
              <div className="relative size-12 shrink-0">
                <Image
                  src="/logo.svg"
                  alt="Learnoo Logo"
                  fill
                  sizes="50px"
                  className="object-contain"
                  priority
                />
              </div>

              {!collapsed && (
                <span className="text-xl font-bold text-primary">
                  Learnoo
                </span>
              )}
            </div>
          </Link>

          <div className="flex-1">
            {!collapsed && (
              <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-placeholder)]">
                {common("mainMenu")}
              </p>
            )}

            {sections.map((items, index) => (
              <nav
                key={index}
                className={
                  index
                    ? "mt-4 space-y-1 border-t border-[var(--border-color)] pt-4"
                    : "space-y-1"
                }
              >
                {items.map((item) => (
                  <NavItem
                    key={item.href}
                    item={item}
                    label={t(item.key)}
                    collapsed={collapsed}
                    active={isActive(item.href)}
                  />
                ))}
              </nav>
            ))}
          </div>

          <div className="mt-4 border-t border-[var(--border-color)] pt-4">
            {!collapsed && (
              <div className="mb-3 flex items-center gap-2 rounded-xl bg-gray-50 p-2.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  AH
                </div>

                <div className="min-w-0">
                  <h4 className="truncate text-sm font-semibold text-[var(--text-dark)]">
                    Ahmed Hassan
                  </h4>
                  <p className="truncate text-xs text-[var(--text-muted)]">
                    Online University
                  </p>
                </div>
              </div>
            )}

            <Logout collapsed={collapsed} />
          </div>
        </div>
      </div>
    </aside>
  );
}
