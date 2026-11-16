import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchPlaces, SearchLimitError, type PlaceResult } from "@/lib/google-places";
import { createServiceClient } from "@/lib/supabase/server";

// Google gives 1,000 free Text Search requests a month for the tier this import
// uses. We stop well before that so importing never costs money.
// Each "Fetch from Google" uses 1-3 requests (20 results per request).
const MONTHLY_LIMIT = Number(process.env.GOOGLE_SEARCH_MONTHLY_LIMIT ?? 900);

function monthKey() {
  return `places_search_${new Date().toISOString().slice(0, 7)}`;
}

async function usedThisMonth(): Promise<number | null> {
  const svc = createServiceClient();
  const { data, error } = await svc.from("app_config").select("value").eq("key", monthKey()).maybeSingle();
  if (error) return null;
  return Number(data?.value ?? 0);
}

// Atomically reserve one request. Fails closed: if we can't count, we don't call Google.
async function reserveRequest(): Promise<boolean> {
  const svc = createServiceClient();
  const { data, error } = await svc.rpc("bump_counter", { p_key: monthKey() });
  if (error) return false;
  return Number(data) <= MONTHLY_LIMIT;
}
import { fetchOgImage, mapLimit } from "@/lib/og-image";
import { slugify } from "@/lib/utils";

async function assertAdmin() {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false as const, sb };
  const { data: profile } = await sb
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  return { ok: !!profile?.is_admin, sb };
}

// POST { action: "search", locationSlug, categorySlug, keyword? }
//      { action: "import", locationSlug, categorySlug, places: PlaceResult[] }
export const maxDuration = 60;

export async function POST(req: Request) {
  const { ok, sb } = await assertAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json();
  const { action, locationSlug, categorySlug } = body;

  const { data: loc } = await sb
    .from("locations")
    .select("id, name")
    .eq("slug", locationSlug)
    .single();
  const { data: cat } = await sb
    .from("categories")
    .select("id, name")
    .eq("slug", categorySlug)
    .single();

  if (!loc || !cat) {
    return NextResponse.json({ error: "Invalid location/category" }, { status: 400 });
  }

  if (action === "search") {
    const keyword = body.keyword || cat.name;
    const query = `${keyword} in ${loc.name} QLD Australia`;
    try {
      const results = await searchPlaces(query, reserveRequest);
      const used = await usedThisMonth();
      return NextResponse.json({ results, used: used == null ? null : Math.min(used, MONTHLY_LIMIT), limit: MONTHLY_LIMIT });
    } catch (e) {
      if (e instanceof SearchLimitError) {
        return NextResponse.json(
          {
            error: `This month's free Google search allowance (${MONTHLY_LIMIT} requests) is used up, so nothing was charged. It resets on the 1st.`,
          },
          { status: 429 }
        );
      }
      return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
    }
  }

  if (action === "import") {
    const places = body.places as PlaceResult[];
    if (!Array.isArray(places) || places.length === 0) {
      return NextResponse.json({ error: "No places provided" }, { status: 400 });
    }

    // Free photo source: the venue's own website hero image.
    const ogImages = await mapLimit(places, 8, (p) => fetchOgImage(p.website));
    const checkedAt = new Date().toISOString();

    const rows = places.map((p, i) => ({
      google_place_id: p.google_place_id,
      name: p.name,
      slug: slugify(p.name),
      category_id: cat.id,
      location_id: loc.id,
      description: p.description,
      address: p.address,
      phone: p.phone,
      website: p.website,
      booking_url: p.website,
      cover_image_url: p.photos?.[0] ?? null,
      photos: p.photos ?? [],
      og_image_url: ogImages[i],
      og_checked_at: checkedAt,
      lat: p.lat,
      lng: p.lng,
      avg_rating: p.google_rating ?? 0,
    }));

    let { error, count } = await sb
      .from("venues")
      .upsert(rows, { onConflict: "google_place_id", count: "exact" });

    // If migration_photos.sql hasn't been run yet, import without the og columns.
    if (error && /og_(image_url|checked_at)/.test(error.message)) {
      const legacy = rows.map((r) => {
        const copy: Partial<typeof r> = { ...r };
        delete copy.og_image_url;
        delete copy.og_checked_at;
        return copy;
      });
      ({ error, count } = await sb
        .from("venues")
        .upsert(legacy, { onConflict: "google_place_id", count: "exact" }));
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ imported: count ?? rows.length });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
