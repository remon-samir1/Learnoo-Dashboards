"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, MessageSquare, ThumbsUp, User } from "lucide-react";
import type { Post } from "@/src/services/student/post.service";

function isLikelyInstructorRole(role: string | undefined): boolean {
  if (!role?.trim()) return false;
  const r = role.trim().toLowerCase();
  return (
    r.includes("instructor") ||
    r.includes("doctor") ||
    r.includes("teacher") ||
    r.includes("faculty") ||
    r === "admin"
  );
}

function getPostRelativeTime(isoString: string, locale: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(locale);
}

export default function LatestPostsSection({
  posts = [],
}: {
  posts: Post[];
}) {
  const t = useTranslations();
  const locale = useLocale();

  const visiblePosts = posts.slice(0, 3);

  return (
    <section className="rounded-2xl border border-[var(--border-color)] bg-white px-4 py-5 shadow-sm sm:px-6">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold text-[var(--text-dark)] sm:text-xl">
          {t("students.home.posts.title")}
        </h2>

        <Link
          href={`/${locale}/student/community`}
          className="shrink-0 text-sm font-bold text-primary transition hover:text-primary-blue"
        >
          {t("students.home.posts.viewAll")}
        </Link>
      </div>

      {!visiblePosts.length ? (
        <div className="rounded-2xl border border-dashed border-[var(--border-color)] bg-[#F7F8FA] px-5 py-8 text-center text-sm text-[var(--text-muted)]">
          {t("students.home.posts.empty")}
        </div>
      ) : (
        <div className="space-y-4">
          {visiblePosts.map((post) => {
            const user = post.attributes.user?.data.attributes;
            const userInitial = user?.first_name?.[0] || user?.full_name?.[0] || "?";
            const userName = user?.full_name || user?.first_name || t("community.posts.unknownUser");
            const instructor = isLikelyInstructorRole(user?.role);
            const typeKey = post.attributes.type;
            const typeLabel = t(`community.posts.type.${typeKey}`);
            const comments = post.attributes.comments_count ?? 0;
            const reactions = post.attributes.reactions_count ?? 0;

            return (
              <Link
                key={post.id}
                href={`/${locale}/student/community?post=${post.id}`}
                className="group block overflow-hidden rounded-2xl border border-[var(--border-color)] bg-white transition duration-300 hover:-translate-y-1 hover:border-[var(--primary)] hover:shadow-lg"
              >
                <div className="flex gap-4 p-4">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[var(--primary)] transition group-hover:bg-[var(--primary)] group-hover:text-white">
                    <User size={28} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="line-clamp-1 text-base font-bold text-[var(--text-dark)] sm:text-lg">
                            {post.attributes.title}
                          </span>
                          {instructor ? (
                            <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                              {t("courses.studentCommunity.badgeInstructor")}
                            </span>
                          ) : null}
                          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                            {typeLabel}
                          </span>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                          <span className="flex items-center gap-1">
                            <User size={13} />
                            {userName}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare size={13} />
                            {comments}
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp size={13} />
                            {reactions}
                          </span>
                        </div>
                      </div>

                      <ArrowRight
                        size={18}
                        className="shrink-0 text-[var(--text-placeholder)] transition group-hover:translate-x-1 group-hover:text-[var(--primary)]"
                      />
                    </div>

                    <p className="line-clamp-2 text-sm leading-6 text-[var(--text-muted)]">
                      {post.attributes.content}
                    </p>

                    <span className="mt-2 block text-xs text-[var(--text-placeholder)]">
                      {getPostRelativeTime(post.attributes.created_at, locale)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}