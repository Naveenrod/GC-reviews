import Link from "next/link";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CategoryNav({
  categories,
  locationSlug,
  activeSlug,
}: {
  categories: Category[];
  locationSlug: string;
  activeSlug?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/${locationSlug}`}
        className={cn(
          "rounded-full border px-4 py-2 text-sm font-medium transition",
          !activeSlug
            ? "border-brand bg-brand text-white"
            : "border-slate-200 bg-white text-slate-600 hover:border-brand hover:text-brand"
        )}
      >
        All
      </Link>
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/${locationSlug}/${c.slug}`}
          className={cn(
            "rounded-full border px-4 py-2 text-sm font-medium transition",
            activeSlug === c.slug
              ? "border-brand bg-brand text-white"
              : "border-slate-200 bg-white text-slate-600 hover:border-brand hover:text-brand"
          )}
        >
          {c.name}
        </Link>
      ))}
    </div>
  );
}
