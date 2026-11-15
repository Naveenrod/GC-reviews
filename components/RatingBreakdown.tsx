import { Star } from "lucide-react";

// Distribution bars (5 → 1 stars). Server component; bars animate in via CSS.
export function RatingBreakdown({
  ratings,
  average,
}: {
  ratings: number[];
  average: number;
}) {
  const total = ratings.length;
  if (total === 0) return null;
  const buckets = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    n: ratings.filter((r) => Math.round(r) === s).length,
  }));
  const recommend = Math.round(
    (ratings.filter((r) => r >= 4).length / total) * 100
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-end gap-4">
        <div>
          <p className="text-5xl font-bold leading-none text-slate-900">
            {average.toFixed(1)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            from {total} rating{total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="mb-1 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
          {recommend}% would recommend
        </div>
      </div>
      <ul className="mt-4 space-y-1.5">
        {buckets.map((b, i) => (
          <li key={b.star} className="flex items-center gap-2 text-xs text-slate-500">
            <span className="flex w-6 items-center gap-0.5 font-medium text-slate-700">
              {b.star}
              <Star size={11} className="fill-accent text-accent" />
            </span>
            <span className="rating-bar h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
              <i
                style={{
                  width: `${(b.n / total) * 100}%`,
                  animationDelay: `${i * 80}ms`,
                }}
              />
            </span>
            <span className="w-6 text-right tabular-nums">{b.n}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
