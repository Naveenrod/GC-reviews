export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryNav } from "@/components/CategoryNav";
import { VenueGrid } from "@/components/VenueGrid";
import { BreadcrumbJsonLd } from "@/components/JsonLd";
import { getCategories, getLocations, getVenues } from "@/lib/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ location: string }>;
}): Promise<Metadata> {
  const { location } = await params;
  const locations = await getLocations();
  const loc = locations.find((l) => l.slug === location);
  if (!loc) return { title: "Not found" };
  return {
    title: `Best of ${loc.name} — Restaurants, Hotels & Things to Do`,
    description: `Discover the best-reviewed restaurants, hotels, bars and entertainment in ${loc.name}. Read reviews and book your visit.`,
    alternates: { canonical: `/${location}` },
  };
}

export default async function LocationPage({
  params,
}: {
  params: Promise<{ location: string }>;
}) {
  const { location } = await params;
  const locations = await getLocations();
  const loc = locations.find((l) => l.slug === location);
  if (!loc) notFound();

  const [categories, venues] = await Promise.all([
    getCategories(),
    getVenues({ locationSlug: location, orderBy: "rating" }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: loc.name, path: `/${location}` },
        ]}
      />
      <h1 className="text-3xl font-bold">Best of {loc.name}</h1>
      <p className="mt-1 text-slate-500">
        {venues.length} venues reviewed across {loc.name}.
      </p>

      <div className="my-6">
        <CategoryNav categories={categories} locationSlug={location} />
      </div>

      <VenueGrid venues={venues} />
    </div>
  );
}