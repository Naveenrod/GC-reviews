export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10" aria-busy aria-label="Loading">
      <div className="skeleton h-9 w-72" />
      <div className="skeleton mt-3 h-4 w-48" />
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="skeleton aspect-[4/3] rounded-none" />
            <div className="space-y-2 p-4">
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-3 w-full" />
              <div className="skeleton h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
