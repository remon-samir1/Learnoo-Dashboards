"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  Globe2,
  HelpCircle,
  Moon,
} from "lucide-react";
import Cookies from "@/lib/cookies";

type ToggleKey = "notifications" | "darkMode" | "autoDownload";

const languages = [
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
];

export default function StudentSettingsPage() {
  const t = useTranslations("studentSettings");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [toggles, setToggles] = useState<Record<ToggleKey, boolean>>({
    notifications: true,
    darkMode: false,
    autoDownload: true,
  });

  const [openLanguage, setOpenLanguage] = useState(false);

  const toggleValue = (key: ToggleKey) => {
    setToggles((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const changeLanguage = (language: string) => {
    Cookies.set("locale", language, {
      expires: 365,
      path: "/",
      sameSite: "lax",
    });

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
    <main className=" bg-[#FAFAF8] p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--text-dark)]">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {t("description")}
          </p>
        </div>

        {/* <section className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-white shadow-sm">
          <SectionTitle title={t("preferences.title")} />

          <SettingToggle
            icon={<Bell size={18} />}
            iconClass="bg-blue-50 text-[var(--primary)]"
            title={t("preferences.notifications.title")}
            description={t("preferences.notifications.description")}
            checked={toggles.notifications}
            onClick={() => toggleValue("notifications")}
          />

          <SettingToggle
            icon={<Moon size={18} />}
            iconClass="bg-purple-50 text-purple-600"
            title={t("preferences.darkMode.title")}
            description={t("preferences.darkMode.description")}
            checked={toggles.darkMode}
            onClick={() => toggleValue("darkMode")}
          />

          <SettingToggle
            icon={<Download size={18} />}
            iconClass="bg-emerald-50 text-emerald-600"
            title={t("preferences.autoDownload.title")}
            description={t("preferences.autoDownload.description")}
            checked={toggles.autoDownload}
            onClick={() => toggleValue("autoDownload")}
          />
        </section> */}

        <section className="mt-5 overflow-hidden rounded-2xl border border-[var(--border-color)] bg-white shadow-sm">
          <SectionTitle title={t("account.title")} />

          <button
            type="button"
            onClick={() => setOpenLanguage((prev) => !prev)}
            className="flex w-full items-center justify-between border-t border-[var(--border-color)] px-5 py-5 text-start transition hover:bg-gray-50"
          >
            <div className="flex items-center gap-4">
              <IconBox className="bg-blue-50 text-blue-600">
                <Globe2 size={18} />
              </IconBox>

              <div>
                <h3 className="text-sm font-semibold text-[var(--text-dark)]">
                  {t("account.language.title")}
                </h3>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {languages.find((lang) => lang.code === locale)?.label ||
                    "English"}
                </p>
              </div>
            </div>

            <ChevronDown
              size={18}
              className={`text-[var(--text-muted)] transition ${
                openLanguage ? "rotate-180" : ""
              }`}
            />
          </button>

          {openLanguage && (
            <div className="border-t border-[var(--border-color)] bg-gray-50 px-5 py-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {languages.map((language) => (
                  <button
                    key={language.code}
                    type="button"
                    onClick={() => changeLanguage(language.code)}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      locale === language.code
                        ? "border-[var(--primary)] bg-blue-50 text-[var(--primary)]"
                        : "border-[var(--border-color)] bg-white text-[var(--text-muted)] hover:bg-gray-50"
                    }`}
                  >
                    {language.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="mt-5 overflow-hidden rounded-2xl border border-[var(--border-color)] bg-white shadow-sm">
          <SectionTitle title={t("support.title")} />

          <SettingLink
            href={`/${locale}/student/help`}
            icon={<HelpCircle size={18} />}
            iconClass="bg-yellow-50 text-yellow-500"
            title={t("support.help")}
          />

          <SettingLink
            href={`/${locale}/student/terms`}
            icon={<FileText size={18} />}
            iconClass="bg-gray-100 text-gray-500"
            title={t("support.terms")}
          />
        </section>
      </div>
    </main>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="px-5 py-4">
      <h2 className="text-base font-bold text-[var(--text-dark)]">{title}</h2>
    </div>
  );
}

function IconBox({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <div
      className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${className}`}
    >
      {children}
    </div>
  );
}

function SettingToggle({
  icon,
  iconClass,
  title,
  description,
  checked,
  onClick,
}: {
  icon: React.ReactNode;
  iconClass: string;
  title: string;
  description: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-t border-[var(--border-color)] px-5 py-5">
      <div className="flex items-center gap-4">
        <IconBox className={iconClass}>{icon}</IconBox>

        <div>
          <h3 className="text-sm font-semibold text-[var(--text-dark)]">
            {title}
          </h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {description}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onClick}
        className={`relative h-6 w-11 rounded-full transition ${
          checked ? "bg-[var(--primary)]" : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-1 size-4 rounded-full bg-white transition ${
            checked ? "end-1" : "start-1"
          }`}
        />
      </button>
    </div>
  );
}

function SettingLink({
  href,
  icon,
  iconClass,
  title,
}: {
  href: string;
  icon: React.ReactNode;
  iconClass: string;
  title: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between border-t border-[var(--border-color)] px-5 py-5 transition hover:bg-gray-50"
    >
      <div className="flex items-center gap-4">
        <IconBox className={iconClass}>{icon}</IconBox>

        <h3 className="text-sm font-semibold text-[var(--text-dark)]">
          {title}
        </h3>
      </div>

      <ChevronRight size={18} className="text-[var(--text-muted)]" />
    </Link>
  );
}
