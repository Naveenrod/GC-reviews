export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryNav } from "@/components/CategoryNav";
import { VenueGrid } from "@/components/VenueGrid";
import { BreadcrumbJsonLd } from "@/components/JsonLd";
import { getCategories, getLocations, getVenues } from "@/lib/queries";
import { getLocationBanner } from "@/lib/unsplash";

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

  const [categories, venues, banner] = await Promise.all([
    getCategories(),
    getVenues({ locationSlug: location, orderBy: "rating" }),
    getLocationBanner(loc.slug, loc.name),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: loc.name, path: `/${location}` },
        ]}
      />
      <div className="relative flex h-56 items-end overflow-hidden rounded-3xl bg-gradient-to-tr from-brand-dark via-brand to-violet p-6 text-white shadow-lg sm:h-72 sm:p-8">
        {banner && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={banner.url} alt={banner.alt} className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
        <div className="relative">
          <h1 className="text-3xl font-bold sm:text-5xl">Best of {loc.name}</h1>
          <p className="mt-1 text-white/85">{venues.length} venues reviewed across {loc.name}.</p>
        </div>
        {banner && (
          <a
            href={banner.photoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-2 right-3 text-[10px] text-white/70 hover:text-white"
          >
            Photo by {banner.photographer} on Unsplash
          </a>
        )}
      </div>

      <div className="my-6">
        <CategoryNav categories={categories} locationSlug={location} />
      </div>

      <VenueGrid venues={venues} />
    </div>
  );
}