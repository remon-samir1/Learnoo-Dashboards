export default function WatchChapterLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 h-5 w-40 animate-pulse rounded-md bg-slate-200" />
      <div className="mb-4 h-8 max-w-xl animate-pulse rounded-md bg-slate-200" />
      <div className="mb-6 h-4 w-64 animate-pulse rounded-md bg-slate-100" />
      <div className="aspect-video w-full animate-pulse rounded-2xl bg-slate-200" />
    </div>
  );
}
