export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryNav } from "@/components/CategoryNav";
import { VenueGrid } from "@/components/VenueGrid";
import { ItemListJsonLd, BreadcrumbJsonLd } from "@/components/JsonLd";
import { getCategories, getLocations, getVenues } from "@/lib/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ location: string; category: string }>;
}): Promise<Metadata> {
  const { location, category } = await params;
  const [locations, categories] = await Promise.all([
    getLocations(),
    getCategories(),
  ]);
  const loc = locations.find((l) => l.slug === location);
  const cat = categories.find((c) => c.slug === category);
  if (!loc || !cat) return { title: "Not found" };
  const title = `${cat.name} in ${loc.name}`;
  return {
    title,
    description: `Browse and review the best ${cat.name.toLowerCase()} in ${loc.name}. Ratings, reviews and booking links all in one place.`,
    alternates: { canonical: `/${location}/${category}` },
  };
}

export default async function CategoryListingPage({
  params,
}: {
  params: Promise<{ location: string; category: string }>;
}) {
  const { location, category } = await params;
  const [locations, categories] = await Promise.all([
    getLocations(),
    getCategories(),
  ]);
  const loc = locations.find((l) => l.slug === location);
  const cat = categories.find((c) => c.slug === category);
  if (!loc || !cat) notFound();

  const venues = await getVenues({
    locationSlug: location,
    categorySlug: category,
    orderBy: "rating",
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <ItemListJsonLd name={`${cat.name} in ${loc.name}`} venues={venues} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: loc.name, path: `/${location}` },
          { name: cat.name, path: `/${location}/${category}` },
        ]}
      />
      <h1 className="text-3xl font-bold">
        {cat.name} in {loc.name}
      </h1>
      <p className="mt-1 text-slate-500">{venues.length} places to explore.</p>

      <p className="mt-2 text-sm">
        <Link
          href={`/guides/best-${category}-${location}`}
          className="font-medium text-brand hover:underline"
        >
          Read our guide: Best {cat.name} in {loc.name} →
        </Link>
      </p>

      <div className="my-6">
        <CategoryNav
          categories={categories}
          locationSlug={location}
          activeSlug={category}
        />
      </div>

      <VenueGrid venues={venues} />
    </div>
  );
}