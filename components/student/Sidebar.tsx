"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  BookOpen,
  ChevronLeft,
  Download,
  FileText,
  HelpCircle,
  Home,
  Library,
  Menu,
  NotebookText,
  Settings,
  User,
  Users,
  Video,
  X,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Logout from "./Logout";
import type { CurrentUser } from "@/src/interfaces/current-user.interface";
import { getUserAttributes, getUserInitials } from "@/src/lib/current-user";

type SidebarItem = {
  key: string;
  href: string;
  icon: LucideIcon;
  /** Matches admin sidebar “Soon” pill for non-functional modules */
  comingSoon?: boolean;
};

const sections: SidebarItem[][] = [
  [
    { key: "home", href: "/student", icon: Home },
    { key: "myCourses", href: "/student/courses", icon: BookOpen },
    { key: "community", href: "/student/community", icon: Users },
    { key: "liveSessions", href: "/student/live-sessions", icon: Video },
    { key: "examsAndQA", href: "/student/exams", icon: NotebookText },
    { key: "notesSummaries", href: "/student/notes", icon: FileText },
    { key: "electronicLibrary", href: "/student/library", icon: Library },
    // {
    //   key: "downloads",
    //   href: "/student/downloads",
    //   icon: Download,
    //   comingSoon: true,
    // },
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
  href,
  collapsed,
  active,
  soonLabel,
  onNavigate,
}: {
  item: SidebarItem;
  label: string;
  href: string;
  collapsed: boolean;
  active: boolean;
  soonLabel: string;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={href}
      title={
        collapsed
          ? item.comingSoon
            ? `${label} (${soonLabel})`
            : label
          : undefined
      }
      onClick={onNavigate}
      className={`group relative flex items-center rounded-xl border border-transparent text-sm font-medium transition-all duration-200 ${collapsed ? "justify-center py-3" : "gap-3 px-3 py-2.5"
        } ${active
          ? "border-blue-100 bg-blue-50 shadow-sm"
          : "hover:border-blue-100 hover:bg-blue-50/70"
        }`}
    >
      <span
        className={`absolute start-0 top-1/2 w-1 -translate-y-1/2 rounded-e-full bg-[var(--primary)] transition-all duration-200 ${active
          ? "h-6 opacity-100"
          : "h-0 opacity-0 group-hover:h-5 group-hover:opacity-70"
          }`}
      />

      <Icon
        size={18}
        className="shrink-0 text-[var(--primary)] transition-all duration-200 group-hover:scale-105"
      />

      {!collapsed && (
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <span
            className={`min-w-0 truncate transition-all duration-200 ${active
              ? "font-semibold text-[var(--primary)]"
              : "text-[var(--text-muted)] group-hover:text-[var(--primary)]"
              }`}
          >
            {label}
          </span>
          {item.comingSoon ? (
            <span className="shrink-0 rounded-full bg-[#FEF3C7] px-1.5 py-0.5 text-[9px] font-semibold text-[#D97706]">
              {soonLabel}
            </span>
          ) : null}
        </span>
      )}
    </Link>
  );
}

const MOBILE_BREAKPOINT_QUERY = "(max-width: 767px)";

export default function Sidebar({
  currentUser = null,
}: {
  currentUser?: CurrentUser | null;
}) {
  const t = useTranslations("sidebar");
  const common = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const user = useMemo(
    () => getUserAttributes(currentUser ?? null),
    [currentUser],
  );

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
    const combined = [user.first_name, user.last_name]
      .map((p) => (typeof p === "string" ? p.trim() : ""))
      .filter(Boolean)
      .join(" ")
      .trim();
    return combined || "—";
  }, [user.first_name, user.full_name, user.last_name]);

  const emailDisplay = user.email?.trim() || "";
  const roleStatusLine = [user.role, user.status_name]
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter(Boolean)
    .join(" · ");

  const avatarSrc =
    typeof user.image === "string" && user.image.trim() ? user.image.trim() : null;

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_BREAKPOINT_QUERY);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const handleNavigate = () => {
      if (isMobile) {
        setMobileOpen(false);
      }
    };
  }, [pathname, closeMobile]);



  useEffect(() => {
    if (!isMobile || !mobileOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobile();
    };

    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isMobile, mobileOpen, closeMobile]);

  const withLocale = (href: string) => `/${locale}${href}`;

  const isActive = (href: string) => {
    const localizedHref = withLocale(href);

    if (href === "/student") {
      return pathname === localizedHref;
    }

    return pathname.startsWith(localizedHref);
  };

  const onItemNavigate = isMobile ? closeMobile : undefined;

  const sidebarInner = (effectiveCollapsed: boolean) => (
    <div className="sidebar-scroll h-full overflow-y-auto px-3 py-3 pb-10">
      <div className="flex min-h-full flex-col">
        <Link
          href={withLocale("/student")}
          className="mb-6 flex items-center justify-center"
          onClick={onItemNavigate}
        >
          <div className="flex items-center">
            <div className="relative size-12 shrink-0">
              <Image
                src="/logo.svg"
                alt="Learnoo Logo"
                fill
                sizes="48px"
                className="object-contain"
                priority
              />
            </div>

            {!effectiveCollapsed && (
              <span className="text-xl font-bold text-[var(--primary)]">
                Learnoo
              </span>
            )}
          </div>
        </Link>

        <div className="flex-1">
          {!effectiveCollapsed && (
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
                  href={withLocale(item.href)}
                  collapsed={effectiveCollapsed}
                  active={isActive(item.href)}
                  soonLabel={common("soon")}
                  onNavigate={onItemNavigate}
                />
              ))}
            </nav>
          ))}
        </div>

        <div className="mt-4 border-t border-[var(--border-color)] pt-4">
          {effectiveCollapsed ? (
            <Link
              href={withLocale("/student/profile")}
              onClick={onItemNavigate}
              className="mb-3 flex justify-center"
              title={displayName}
            >
              {avatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarSrc}
                  alt=""
                  className="size-9 shrink-0 rounded-full border border-[var(--border-color)] object-cover"
                />
              ) : (
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[10px] font-bold text-white">
                  {initials}
                </div>
              )}
            </Link>
          ) : (
            <Link
              href={withLocale("/student/profile")}
              onClick={onItemNavigate}
              className="mb-3 flex items-center gap-2.5 rounded-2xl border border-[var(--border-color)] bg-white p-2.5 shadow-sm transition hover:bg-[#F8FAFC]"
            >
              {avatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarSrc}
                  alt=""
                  className="size-9 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-white">
                  {initials}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <h4 className="truncate text-sm font-semibold text-[var(--text-dark)]">
                  {displayName}
                </h4>
                {emailDisplay ? (
                  <p className="truncate text-xs text-[var(--text-muted)]">
                    {emailDisplay}
                  </p>
                ) : null}
                {roleStatusLine ? (
                  <p className="mt-0.5 truncate text-[10px] text-[var(--text-placeholder)]">
                    {roleStatusLine}
                  </p>
                ) : null}
              </div>
            </Link>
          )}

          <Logout collapsed={effectiveCollapsed} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative w-0 shrink-0 overflow-visible md:w-auto md:shrink-0">
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          aria-controls="student-sidebar-drawer"
          className={`fixed end-3 bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] z-[100] flex size-11 items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--primary)] shadow-md shadow-black/10 transition hover:bg-blue-50 ${mobileOpen ? "pointer-events-none opacity-0" : ""
            }`}
        >
          <Menu size={22} />
        </button>

        <div
          className={`fixed inset-0 z-[90] bg-black/40 transition-opacity duration-300 md:hidden ${mobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
            }`}
          aria-hidden={!mobileOpen}
          onClick={closeMobile}
        />

        <aside
          id="student-sidebar-drawer"
          className={`fixed inset-y-0 start-0 z-[95] flex h-[100dvh] w-[min(100vw-3rem,280px)] max-w-[100vw] border-e border-[var(--border-color)] bg-[var(--card-bg)] shadow-xl transition-transform duration-300 ease-out md:hidden ${mobileOpen
            ? "translate-x-0"
            : "pointer-events-none ltr:-translate-x-full rtl:translate-x-full"
            }`}
          aria-hidden={!mobileOpen}
        >
          <button
            type="button"
            onClick={closeMobile}
            aria-label="Close menu"
            className="absolute end-3 top-3 z-10 flex size-9 items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-muted)] transition hover:bg-blue-50 hover:text-[var(--primary)]"
          >
            <X size={18} />
          </button>

          {sidebarInner(false)}
        </aside>
      </div>

      <aside
        className={`sticky top-0 z-50 hidden h-screen shrink-0 border-e border-[var(--border-color)] bg-[var(--card-bg)] transition-all duration-300 md:block ${collapsed ? "w-[100px]" : "w-[240px]"
          }`}
      >
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-label="Toggle sidebar"
          className={`absolute -end-3 top-20 z-50 hidden size-7 items-center justify-center rounded-full border shadow-md transition-all duration-300 md:flex ${collapsed
            ? "border-white bg-[var(--primary)] text-white hover:opacity-90"
            : "border-[var(--primary)] bg-[var(--card-bg)] text-[var(--primary)] hover:bg-blue-50"
            }`}
        >
          <ChevronLeft
            size={16}
            className={`transition-transform duration-300 ${collapsed
              ? locale === "en"
                ? "rotate-180"
                : ""
              : locale === "ar"
                ? "rotate-180"
                : ""
              }`}
          />
        </button>

        {sidebarInner(collapsed)}
      </aside>
    </div>
  );
}
