export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { CategoryNav } from "@/components/CategoryNav";
import { VenueGrid } from "@/components/VenueGrid";
import { getCategories, getLocations, getVenues } from "@/lib/queries";

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
      <h1 className="text-3xl font-bold">
        {cat.name} in {loc.name}
      </h1>
      <p className="mt-1 text-slate-500">{venues.length} places to explore.</p>

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