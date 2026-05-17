"use client";

import {
  BookOpen,
  Building2,
  Download,
  Edit3,
  Mail,
  Monitor,
  Phone,
  Settings,
  UserRound,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import InfoRow from "./ProfileInfoRow";
import Link from "next/link";
import Image from "next/image";

type Props = {
  initials: string;
  fullName: string;
  university: string;
  center: string;
  email: string;
  phone: string;
  faculty: string;
  department?: string;
  status: string;
  device: string;
  image?: string;
};

export default function ProfileInfoCard({
  initials,
  fullName,
  university,
  center,
  email,
  phone,
  faculty,
  department,
  status,
  device,
  image,
}: Props) {
  const t = useTranslations("studentProfile");
const locale = useLocale();

  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-7 shadow-sm">
      <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--primary)] text-3xl font-bold text-white">
  {image ? (
    <Image
      src={image}
      alt="User avatar"
      width={96}
      height={96}
      className="h-full w-full object-cover"
    />
  ) : (
    <span>{initials}</span>
  )}
</div>

        <div className="flex-1">
          <h2 className="text-2xl font-bold text-[var(--text-dark)]">
            {fullName}
          </h2>

          <p className="mt-1 text-sm text-[var(--text-muted)]">{university}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/${locale}/student/profile/editPage`}
              className="flex h-10 items-center gap-2 rounded-lg bg-[var(--primary)] px-4 text-sm font-medium text-white transition hover:opacity-90"
            >
              <Edit3 size={16} />
              {t("editProfile")}
            </Link>

            <Link href={`/${locale}/student/settings`}>
            <button className="flex h-10 items-center gap-2 rounded-lg bg-gray-100 px-4 text-sm font-medium text-[var(--text-dark)] transition hover:bg-gray-200">
              <Settings size={16} />
              {t("settings")}
            </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <InfoRow
          icon={<Mail size={20} />}
          label={t("fields.email")}
          value={email}
        />

        <InfoRow
          icon={<Phone size={20} />}
          label={t("fields.phone")}
          value={phone}
        />

        <InfoRow
          icon={<Building2 size={20} />}
          label={t("academic.university")}
          value={university}
        />

        <InfoRow
          icon={<Building2 size={20} />}
          label={t("academic.center")}
          value={faculty}
        />
{/* 
        <InfoRow
          icon={<BookOpen size={20} />}
          label={t("academic.center")}
          value={center }
        /> */}

        {department ? (
          <InfoRow
            icon={<BookOpen size={20} />}
            label={t("academic.department")}
            value={department}
          />
        ) : null}

        <InfoRow
          icon={<UserRound size={20} />}
          label={t("fields.status")}
          value={status}
        />

        <InfoRow
          icon={<Monitor size={20} />}
          label={t("fields.device")}
          value={device}
        />
      </div>

      <div className="mt-6 border-t border-[var(--border-color)] pt-6">
        <h3 className="mb-4 text-base font-bold text-[var(--text-dark)]">
          {t("quickActions.title")}
        </h3>

        {/* <div className="grid gap-3 sm:grid-cols-2"> */}
          {/* <button className="flex h-14 items-center justify-center gap-2 rounded-xl bg-gray-50 text-sm font-semibold text-[var(--text-dark)] transition hover:bg-gray-100">
            <Download size={18} />
            {t("quickActions.downloads")}
          </button> */}

        <Link href={`/${locale}/student/settings`}>
          <button className="flex h-14 items-center justify-center gap-2 w-full rounded-xl bg-gray-50 text-sm font-semibold text-[var(--text-dark)] transition hover:bg-gray-100">
            <Settings size={18} />
            {t("quickActions.settings")}
          </button>
        </Link>
        {/* </div> */}
      </div>
    </div>
  );
}
