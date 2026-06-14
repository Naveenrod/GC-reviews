export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";

export const metadata: Metadata = {
  title: "Search restaurants, hotels & things to do",
  description:
    "Search the best-reviewed restaurants, hotels, bars and entertainment across the Gold Coast and Brisbane.",
  alternates: { canonical: "/search" },
};
import { VenueGrid } from "@/components/VenueGrid";
import { getCategories, getLocations, getVenues } from "@/lib/queries";
import { cn } from "@/lib/utils";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    location?: string;
    category?: string;
    rating?: string;
    sort?: string;
  }>;
}) {
  const sp = await searchParams;
  const sort = sp.sort === "recent" ? "recent" : "rating";
  const [locations, categories, venues] = await Promise.all([
    getLocations(),
    getCategories(),
    getVenues({
      query: sp.q,
      locationSlug: sp.location,
      categorySlug: sp.category,
      minRating: sp.rating ? Number(sp.rating) : undefined,
      orderBy: sort,
    }),
  ]);

  function buildHref(patch: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { ...sp, ...patch };
    Object.entries(merged).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    return `/search?${params.toString()}`;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <SearchBar
          locations={locations}
          categories={categories}
          defaultQuery={sp.q}
          defaultLocation={sp.location}
          defaultCategory={sp.category}
        />
      </div>

      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-4">
        {/* Results — first in DOM so mobile users see venues immediately */}
        <div className="lg:col-start-2 lg:col-span-3 lg:row-start-1">
          <p className="mb-4 text-sm text-slate-500">
            {venues.length} result{venues.length !== 1 ? "s" : ""}
            {sp.q ? ` for "${sp.q}"` : ""}
          </p>
          <VenueGrid venues={venues} />
        </div>

        {/* Filters — sidebar on desktop, below results on mobile */}
        <aside className="space-y-6 lg:col-start-1 lg:col-span-1 lg:row-start-1">
          <div>
            <h4 className="mb-2 font-semibold text-slate-800">Category</h4>
            <ul className="space-y-1 text-sm">
              <li>
                <Link
                  href={buildHref({ category: undefined })}
                  className={cn(
                    "block rounded px-2 py-1 hover:bg-slate-100",
                    !sp.category && "font-semibold text-brand"
                  )}
                >
                  All categories
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={buildHref({ category: c.slug })}
                    className={cn(
                      "block rounded px-2 py-1 hover:bg-slate-100",
                      sp.category === c.slug && "font-semibold text-brand"
                    )}
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-2 font-semibold text-slate-800">Location</h4>
            <ul className="space-y-1 text-sm">
              <li>
                <Link
                  href={buildHref({ location: undefined })}
                  className={cn(
                    "block rounded px-2 py-1 hover:bg-slate-100",
                    !sp.location && "font-semibold text-brand"
                  )}
                >
                  All locations
                </Link>
              </li>
              {locations.map((l) => (
                <li key={l.id}>
                  <Link
                    href={buildHref({ location: l.slug })}
                    className={cn(
                      "block rounded px-2 py-1 hover:bg-slate-100",
                      sp.location === l.slug && "font-semibold text-brand"
                    )}
                  >
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-2 font-semibold text-slate-800">Min rating</h4>
            <ul className="space-y-1 text-sm">
              {["", "3", "4", "4.5"].map((r) => (
                <li key={r}>
                  <Link
                    href={buildHref({ rating: r || undefined })}
                    className={cn(
                      "block rounded px-2 py-1 hover:bg-slate-100",
                      (sp.rating ?? "") === r && "font-semibold text-brand"
                    )}
                  >
                    {r ? `${r}+ stars` : "Any rating"}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-2 font-semibold text-slate-800">Sort by</h4>
            <ul className="space-y-1 text-sm">
              {[
                { value: "rating", label: "Top rated" },
                { value: "recent", label: "Newest" },
              ].map(({ value, label }) => (
                <li key={value}>
                  <Link
                    href={buildHref({ sort: value === "rating" ? undefined : value })}
                    className={cn(
                      "block rounded px-2 py-1 hover:bg-slate-100",
                      sort === value && "font-semibold text-brand"
                    )}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}