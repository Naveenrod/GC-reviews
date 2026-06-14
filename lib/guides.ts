import { getCategories, getLocations } from "@/lib/queries";
import type { Category, Location } from "@/lib/types";

// A "guide" is an SEO landing page like "Best Restaurants on the Gold Coast".
// Slug format: best-{categorySlug}-{locationSlug}, e.g. best-restaurants-gold-coast.

export type Guide = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  category: Category;
  location: Location;
};

export function buildGuide(category: Category, location: Location): Guide {
  const slug = `best-${category.slug}-${location.slug}`;
  const title = `Best ${category.name} in ${location.name}`;
  return {
    slug,
    title,
    metaTitle: `${title} (2026) — Top Rated & Reviewed`,
    metaDescription: `The best ${category.name.toLowerCase()} in ${location.name}, ranked by real reviews and ratings. Browse top picks, read reviews and book your spot.`,
    category,
    location,
  };
}

// All category × location guide pages.
export async function getAllGuides(): Promise<Guide[]> {
  const [categories, locations] = await Promise.all([
    getCategories(),
    getLocations(),
  ]);
  const guides: Guide[] = [];
  for (const location of locations) {
    for (const category of categories) {
      guides.push(buildGuide(category, location));
    }
  }
  return guides;
}

// Resolve a single guide slug back to its category + location.
export async function getGuideBySlug(slug: string): Promise<Guide | null> {
  if (!slug.startsWith("best-")) return null;
  const [categories, locations] = await Promise.all([
    getCategories(),
    getLocations(),
  ]);
  // Match the longest location slug suffix, the rest (minus "best-") is the category.
  for (const location of locations) {
    const suffix = `-${location.slug}`;
    if (slug.endsWith(suffix)) {
      const catSlug = slug.slice("best-".length, slug.length - suffix.length);
      const category = categories.find((c) => c.slug === catSlug);
      if (category) return buildGuide(category, location);
    }
  }
  return null;
}
