"use client";

import Image from "next/image";
import Link from "next/link";
import { Lock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { ILibrary } from "@/src/interfaces/library.interface";

export default function ElectronicLibrarySection({
  library,
}: {
  library: ILibrary[];
}) {
  const t = useTranslations("student.home.library");
  const locale = useLocale();

  const visibleLibraries = library.slice(0, 2);
  return (
    <section className="rounded-2xl border border-[var(--border-color)] bg-white px-4 py-5 shadow-sm sm:px-5">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold text-[var(--text-dark)] sm:text-xl">
          {t("title")}
        </h2>

        <Link
          href={`/${locale}/student/library`}
          className="shrink-0 text-sm font-bold leading-6 text-primary transition duration-300 hover:text-primary-blue"
        >
          {t("viewAll")}
        </Link>
      </div>

      {!visibleLibraries.length ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-[var(--border-color)] bg-[#F7F8FA] px-4 text-center text-sm text-[var(--text-muted)] sm:min-h-[250px]">
          {t("empty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {visibleLibraries.map((library) => {
            const attrs = library.attributes;

            const image =
              attrs?.cover_image ||
              "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=1200";

            const title =
              attrs?.title || t("fallbackTitle");

            const description =
              attrs?.description || t("fallbackDescription");

            const isLocked = attrs?.is_locked;

            return (
              <article
                key={library.id}
                className="group"
              >
                <div className="relative overflow-hidden rounded-2xl">
                  <Image
                    src={image}
                    alt={title}
                    width={500}
                    height={320}
                    unoptimized
                    className="h-44 w-full object-cover transition duration-300 group-hover:scale-105 sm:h-[250px]"
                  />

                  {isLocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/65">
                      <div className="flex size-14 items-center justify-center rounded-full  backdrop-blur-md">
                        <Lock
                          size={26}
                          className="text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-3">
                  <h3 className="line-clamp-1 text-lg font-bold text-[var(--text-dark)]">
                    {title}
                  </h3>

                  <p className="mt-1 line-clamp-1 text-sm text-[var(--text-muted)]">
                    {description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}