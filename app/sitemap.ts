import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import { getAllGuides } from "@/lib/guides";
import type { Venue } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getBaseUrl();
  const sb = await createClient();

  const { data: locations } = await sb.from("locations").select("slug");
  const { data: categories } = await sb.from("categories").select("slug");
  const { data: venues } = await sb
    .from("venues")
    .select("slug, created_at, category:categories(slug), location:locations(slug)")
    .order("created_at", { ascending: false })
    .limit(5000);

  const guides = await getAllGuides();
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/search`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/guides`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
  ];

  const locationPages: MetadataRoute.Sitemap = (locations ?? []).map((l) => ({
    url: `${base}/${l.slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const categoryPages: MetadataRoute.Sitemap = [];
  for (const l of locations ?? []) {
    for (const c of categories ?? []) {
      categoryPages.push({
        url: `${base}/${l.slug}/${c.slug}`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.7,
      });
    }
  }

  const guidePages: MetadataRoute.Sitemap = guides.map((g) => ({
    url: `${base}/guides/${g.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.75,
  }));

  const venuePages: MetadataRoute.Sitemap = ((venues as unknown as Venue[]) ?? [])
    .filter((v) => v.location?.slug && v.category?.slug)
    .map((v) => ({
      url: `${base}/${v.location!.slug}/${v.category!.slug}/${v.slug}`,
      lastModified: v.created_at ? new Date(v.created_at) : now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

  return [
    ...staticPages,
    ...locationPages,
    ...categoryPages,
    ...guidePages,
    ...venuePages,
  ];
}
