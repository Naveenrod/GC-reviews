import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

// Server-safe. Renders fractional (half/partial) stars so 4.3 looks like 4.3,
// not 4, and exposes the value to screen readers.
export function StarRating({
  value,
  size = 16,
  className,
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  const v = Math.max(0, Math.min(5, value));
  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      role="img"
      aria-label={v > 0 ? `Rated ${v.toFixed(1)} out of 5` : "Not yet rated"}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, v - (i - 1)));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} className="absolute inset-0 fill-transparent text-slate-300" />
            {fill > 0 && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Star size={size} className="fill-accent text-accent" />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
