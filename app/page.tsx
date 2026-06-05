export const dynamic = "force-dynamic";

import Link from "next/link";
import { Utensils, Bed, Ticket, Coffee, Wine, MapPin } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { VenueGrid } from "@/components/VenueGrid";
import { getCategories, getLocations, getVenues } from "@/lib/queries";

const ICONS: Record<string, React.ReactNode> = {
  restaurants: <Utensils size={24} />,
  hotels: <Bed size={24} />,
  entertainment: <Ticket size={24} />,
  cafes: <Coffee size={24} />,
  bars: <Wine size={24} />,
  "things-to-do": <MapPin size={24} />,
};

export default async function Home() {
  const [locations, categories, topRated, recent] = await Promise.all([
    getLocations(),
    getCategories(),
    getVenues({ orderBy: "rating", limit: 8 }),
    getVenues({ orderBy: "recent", limit: 4 }),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-dark via-brand to-teal-500 px-4 py-20 text-white sm:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            All the Gold Coast&apos;s best,
            <br /> reviewed in one place.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-teal-50">
            Find top-rated restaurants, hotels and entertainment across the Gold
            Coast &amp; Brisbane — read real reviews and book your spot.
          </p>
          <div className="mx-auto mt-8 max-w-3xl">
            <SearchBar locations={locations} categories={categories} />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4">
        {/* Categories */}
        <section className="-mt-10 relative z-10">
          <div className="grid grid-cols-3 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-6">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/search?category=${c.slug}`}
                className="flex flex-col items-center gap-2 rounded-xl p-3 text-center transition hover:bg-slate-50"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
                  {ICONS[c.slug] ?? <MapPin size={24} />}
                </span>
                <span className="text-xs font-medium text-slate-700">
                  {c.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Location picks */}
        <section className="mt-14 grid gap-5 sm:grid-cols-2">
          {locations.map((l) => (
            <Link
              key={l.id}
              href={`/${l.slug}`}
              className="group relative flex h-44 items-end overflow-hidden rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-600 p-6 text-white"
            >
              <div>
                <h3 className="text-2xl font-bold">{l.name}</h3>
                <p className="text-sm text-slate-200">
                  Explore venues in {l.name} →
                </p>
              </div>
            </Link>
          ))}
        </section>

        {/* Top rated */}
        <section className="mt-16">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-bold">Top rated</h2>
            <Link href="/search" className="text-sm font-semibold text-brand hover:underline">
              View all →
            </Link>
          </div>
          <VenueGrid venues={topRated} />
        </section>

        {/* Recently reviewed */}
        {recent.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 text-2xl font-bold">Recently added</h2>
            <VenueGrid venues={recent} />
          </section>
        )}
      </div>
    </div>
  );
}