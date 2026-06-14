import { createClient } from "@/lib/supabase/server";
import type { Category, Location, Venue } from "@/lib/types";

export async function getLocations(): Promise<Location[]> {
  const sb = await createClient();
  const { data } = await sb.from("locations").select("*").order("name");
  return data ?? [];
}

export async function getCategories(): Promise<Category[]> {
  const sb = await createClient();
  const { data } = await sb.from("categories").select("*").order("name");
  return data ?? [];
}

const VENUE_SELECT =
  "*, category:categories(*), location:locations(*)";

export async function getVenues(opts: {
  locationSlug?: string;
  categorySlug?: string;
  query?: string;
  minRating?: number;
  limit?: number;
  orderBy?: "rating" | "recent";
}): Promise<Venue[]> {
  const sb = await createClient();
  let q = sb.from("venues").select(VENUE_SELECT);

  if (opts.locationSlug) {
    const { data: loc } = await sb
      .from("locations")
      .select("id")
      .eq("slug", opts.locationSlug)
      .single();
    if (loc) q = q.eq("location_id", loc.id);
  }
  if (opts.categorySlug) {
    const { data: cat } = await sb
      .from("categories")
      .select("id")
      .eq("slug", opts.categorySlug)
      .single();
    if (cat) q = q.eq("category_id", cat.id);
  }
  if (opts.query) {
    const words = opts.query.trim().split(/\s+/).filter(Boolean);
    for (const word of words) {
      q = q.or(
        `name.ilike.%${word}%,description.ilike.%${word}%,address.ilike.%${word}%`
      );
    }
  }
  if (opts.minRating) q = q.gte("avg_rating", opts.minRating);

  q =
    opts.orderBy === "recent"
      ? q.order("created_at", { ascending: false })
      : q.order("avg_rating", { ascending: false }).order("review_count", {
          ascending: false,
        });

  if (opts.limit) q = q.limit(opts.limit);

  const { data } = await q;
  return (data as Venue[]) ?? [];
}

export async function getVenueBySlug(
  locationSlug: string,
  categorySlug: string,
  venueSlug: string
): Promise<Venue | null> {
  const sb = await createClient();
  const { data: loc } = await sb
    .from("locations")
    .select("id")
    .eq("slug", locationSlug)
    .single();
  const { data: cat } = await sb
    .from("categories")
    .select("id")
    .eq("slug", categorySlug)
    .single();
  if (!loc || !cat) return null;

  const { data } = await sb
    .from("venues")
    .select(VENUE_SELECT)
    .eq("location_id", loc.id)
    .eq("category_id", cat.id)
    .eq("slug", venueSlug)
    .single();
  return (data as Venue) ?? null;
}
