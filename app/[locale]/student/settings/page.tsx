"use client";
import { z } from "zod";

const changePasswordSchema = z
  .object({
    password: z.string().min(8, "passwordMin"),
    confirmPassword: z.string().min(1, "confirmRequired"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "passwordMismatch",
  });

type PasswordErrors = Partial<Record<"password" | "confirmPassword", string>>;


import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  FileText,
  Globe2,
  HelpCircle,
  Lock,
  Moon,
} from "lucide-react";
import Cookies from "@/lib/cookies";
import { toast } from "sonner";
import { updateUserPassword } from "@/src/services/student/user.service";

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

  const [openPassword, setOpenPassword] = useState(false);
  const [openLanguage, setOpenLanguage] = useState(false);
const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);
const [passwords, setPasswords] = useState({
  password: "",
  confirmPassword: "",
});

const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});

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

 const handleChangePassword = async() => {
  const result = changePasswordSchema.safeParse(passwords);

  if (!result.success) {
    const fieldErrors: PasswordErrors = {};

    result.error.issues.forEach((issue) => {
      const field = issue.path[0] as keyof PasswordErrors;
      fieldErrors[field] = issue.message;
    });

    setPasswordErrors(fieldErrors);
    return;
  }
 const res = await updateUserPassword(passwords.password);
 
 if (!res.success) {
  toast.error(res.message || t("errors.changePasswordFailed"));
 } else {
  toast.success(res.message || t("passwordChanged"));
 }
  setPasswordErrors({});
  setPasswords({ password: "", confirmPassword: "" });
  setOpenPassword(false);
  toast.success(t("passwordChanged"));
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
            onClick={() => setOpenPassword((prev) => !prev)}
            className="flex w-full items-center justify-between border-t border-[var(--border-color)] px-5 py-5 text-start transition hover:bg-gray-50"
          >
            <div className="flex items-center gap-4">
              <IconBox className="bg-orange-50 text-orange-500">
                <Lock size={18} />
              </IconBox>

              <div>
                <h3 className="text-sm font-semibold text-[var(--text-dark)]">
                  {t("account.changePassword.title")}
                </h3>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {t("account.changePassword.description")}
                </p>
              </div>
            </div>

            <ChevronDown
              size={18}
              className={`text-[var(--text-muted)] transition ${
                openPassword ? "rotate-180" : ""
              }`}
            />
          </button>

          {openPassword && (
            <div className="border-t border-[var(--border-color)] bg-gray-50 px-5 py-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-medium text-[var(--text-muted)]">
                    {t("account.changePassword.newPassword")}
                  </label>
                  <div>


  <div className="relative">
    <input
      type={showPassword ? "text" : "password"}
      value={passwords.password}
      onChange={(e) =>
        setPasswords((prev) => ({
          ...prev,
          password: e.target.value,
        }))
      }
      className="h-11 w-full rounded-xl border border-[var(--border-color)] bg-white px-4 pe-11 text-sm outline-none focus:border-[var(--primary)]"
    />

    <button
      type="button"
      onClick={() => setShowPassword((prev) => !prev)}
      className="absolute end-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition hover:text-[var(--primary)]"
    >
      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  </div>

  {passwordErrors.password && (
    <p className="mt-1 text-xs text-red-500">
      {t(`errors.${passwordErrors.password}`)}
    </p>
  )}
</div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-[var(--text-muted)]">
                    {t("account.changePassword.confirmPassword")}
                  </label>
                 <div>
 

  <div className="relative">
    <input
      type={showConfirmPassword ? "text" : "password"}
      value={passwords.confirmPassword}
      onChange={(e) =>
        setPasswords((prev) => ({
          ...prev,
          confirmPassword: e.target.value,
        }))
      }
      className="h-11 w-full rounded-xl border border-[var(--border-color)] bg-white px-4 pe-11 text-sm outline-none focus:border-[var(--primary)]"
    />

    <button
      type="button"
      onClick={() =>
        setShowConfirmPassword((prev) => !prev)
      }
      className="absolute end-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition hover:text-[var(--primary)]"
    >
      {showConfirmPassword ? (
        <EyeOff size={18} />
      ) : (
        <Eye size={18} />
      )}
    </button>
  </div>

  {passwordErrors.confirmPassword && (
    <p className="mt-1 text-xs text-red-500">
      {t(`errors.${passwordErrors.confirmPassword}`)}
    </p>
  )}
</div>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpenPassword(false)}
                  className="rounded-xl border border-[var(--border-color)] px-5 py-2 text-sm font-semibold text-[var(--text-muted)] hover:bg-white"
                >
                  {t("cancel")}
                </button>

                <button
                  type="button"
                  onClick={handleChangePassword}
                  className="rounded-xl bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                  {t("save")}
                </button>
              </div>
            </div>
          )}

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