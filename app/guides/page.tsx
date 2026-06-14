export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getAllGuides } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Local Guides — Best Restaurants, Hotels & Things to Do",
  description:
    "Curated guides to the best of the Gold Coast and Brisbane — top-rated restaurants, hotels, bars, cafes and entertainment, ranked by real reviews.",
  alternates: { canonical: "/guides" },
};

export default async function GuidesIndex() {
  const guides = await getAllGuides();

  // Group by location for a tidy layout.
  const byLocation = new Map<string, typeof guides>();
  for (const g of guides) {
    const key = g.location.name;
    if (!byLocation.has(key)) byLocation.set(key, []);
    byLocation.get(key)!.push(g);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold">Local Guides</h1>
      <p className="mt-1 max-w-2xl text-slate-500">
        Hand-ranked roundups of the best places across the Gold Coast and
        Brisbane — updated automatically as new reviews come in.
      </p>

      {[...byLocation.entries()].map(([location, list]) => (
        <section key={location} className="mt-10">
          <h2 className="mb-4 text-xl font-bold">{location}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {list.map((g) => (
              <Link
                key={g.slug}
                href={`/guides/${g.slug}`}
                className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-brand hover:shadow-sm"
              >
                <span className="font-medium text-slate-800 group-hover:text-brand">
                  {g.title}
                </span>
                <ArrowRight
                  size={18}
                  className="text-slate-400 group-hover:text-brand"
                />
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
