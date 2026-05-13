"use client";

import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { globalSearch, SearchItem } from "@/src/services/student/search.service";

export default function SearchBox() {
      const router = useRouter();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
const getSearchHref = (item: SearchItem) => {
  switch (item.type) {
    case "course":
    case "courses":
      return `/student/courses/${item.id}`;

    case "chapter":
    case "chapters":
      return `/student/chapters/${item.id}`;

    case "quiz":
    case "quizzes":
      return `/student/quizzes/${item.id}`;

    case "note":
    case "notes":
      return `/student/notes/${item.id}`;

    case "library":
    case "libraries":
      return `/student/libraries/${item.id}`;

    case "post":
    case "posts":
      return `/student/posts/${item.id}`;

    default:
      return `/student/search?q=${encodeURIComponent(
        item.attributes.title || item.attributes.name || ""
      )}`;
  }
};



  const handleSearch = async (value: string) => {
    setQuery(value);

    if (value.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);

    const res = await globalSearch({
      q: value,
      limit: 10,
    });

    setLoading(false);

    if (res.success) {
      setResults(res.data?.data || []);
    } else {
      setResults([]);
    }
  };

  const handleNavigate = (item: SearchItem) => {
    setQuery("");
    setResults([]);
    router.push(getSearchHref(item));
  };

  return (
    <div className="relative max-w-[760px] flex-1">
      <Search
        size={17}
        className="absolute start-4 top-1/2 -translate-y-1/2 text-[var(--text-placeholder)]"
      />

      <input
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search..."
        className="h-12 w-full rounded-2xl border border-[var(--border)] bg-white ps-11 pe-11 text-sm text-[var(--text-main)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10"
      />

      {loading && (
        <Loader2
          size={18}
          className="absolute end-4 top-1/2 -translate-y-1/2 animate-spin text-[var(--text-muted)]"
        />
      )}

      {query.trim().length >= 2 && (
        <div className="absolute start-0 top-[calc(100%+10px)] z-50 w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-xl">
          {results.length > 0 ? (
            <div className="max-h-[360px] overflow-y-auto p-2">
              {results.map((item) => {
                const title =
                  item.attributes.title || item.attributes.name || "Untitled";

                return (
                  <button
                    key={`${item.type}-${item.id}`}
                    type="button"
                    onClick={() => handleNavigate(item)}
                    className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-start transition hover:bg-[var(--primary)]/5"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-xs font-bold uppercase text-[var(--primary)]">
                      {item.type.slice(0, 2)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-[var(--text-main)]">
                          {title}
                        </p>

                        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium capitalize text-[var(--text-muted)]">
                          {item.type}
                        </span>
                      </div>

                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--text-muted)]">
                        {item.attributes.description ||
                          item.attributes.content ||
                          "No description available"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            !loading && (
              <div className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">
                No results found
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}