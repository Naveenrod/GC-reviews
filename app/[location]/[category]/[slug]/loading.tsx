export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8" aria-busy aria-label="Loading venue">
      <div className="skeleton h-4 w-56" />
      <div className="mt-4 grid grid-cols-4 gap-2">
        <div className="skeleton col-span-4 h-64 sm:col-span-2 sm:row-span-2" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton hidden h-[126px] sm:block" />
        ))}
      </div>
      <div className="mt-6 flex items-start justify-between">
        <div className="space-y-2">
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-9 w-72" />
          <div className="skeleton h-4 w-40" />
        </div>
        <div className="skeleton h-12 w-36" />
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="skeleton h-20 w-full" />
          <div className="skeleton h-40 w-full" />
        </div>
        <div className="skeleton h-56 w-full" />
      </div>
    </div>
  );
}
