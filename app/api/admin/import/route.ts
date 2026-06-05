import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchPlaces } from "@/lib/google-places";
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
      const results = await searchPlaces(query);
      return NextResponse.json({ results });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  if (action === "import") {
    const places = body.places as any[];
    if (!Array.isArray(places) || places.length === 0) {
      return NextResponse.json({ error: "No places provided" }, { status: 400 });
    }

    const rows = places.map((p) => ({
      google_place_id: p.google_place_id,
      name: p.name,
      slug: slugify(p.name),
      category_id: cat.id,
      location_id: loc.id,
      address: p.address,
      phone: p.phone,
      website: p.website,
      booking_url: p.website,
      cover_image_url: p.photos?.[0] ?? null,
      photos: p.photos ?? [],
      lat: p.lat,
      lng: p.lng,
    }));

    const { error, count } = await sb
      .from("venues")
      .upsert(rows, { onConflict: "google_place_id", count: "exact" });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ imported: count ?? rows.length });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
