import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 300;

import { fetchOgImage, mapLimit } from "@/lib/og-image";

const PLACES_BASE = "https://places.googleapis.com/v1";
const PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY!;

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch all venues with a google_place_id
  const { data: venues } = await sb
    .from("venues")
    .select("id, google_place_id")
    .not("google_place_id", "is", null);

  if (!venues) return NextResponse.json({ error: "Failed to fetch venues" }, { status: 500 });

  let updated = 0, skipped = 0;
  const errors: string[] = [];

  for (const venue of venues) {
    try {
      const res = await fetch(`${PLACES_BASE}/places/${venue.google_place_id}`, {
        headers: {
          "X-Goog-Api-Key": PLACES_KEY,
          "X-Goog-FieldMask": "photos,rating",
        },
      });

      if (!res.ok) { skipped++; continue; }

      const json = (await res.json()) as { photos?: { name: string }[]; rating?: number };
      // Store bare photo names; /api/photo serves them with the key hidden.
      const photos: string[] = (json.photos ?? []).slice(0, 5).map((ph) => ph.name);

      if (!photos.length) { skipped++; continue; }

      await sb.from("venues").update({
        cover_image_url: photos[0],
        photos,
        ...(json.rating ? { avg_rating: json.rating } : {}),
      }).eq("id", venue.id);

      updated++;
      await new Promise((r) => setTimeout(r, 60));
    } catch (e) {
      errors.push(venue.google_place_id + ": " + (e instanceof Error ? e.message : String(e)));
    }
  }

  // Free photos: look for website og:image on venues we haven't checked yet.
  const { data: unchecked } = await sb
    .from("venues")
    .select("id, website")
    .is("og_checked_at", null)
    .not("website", "is", null)
    .limit(150);
  let ogFound = 0;
  await mapLimit(unchecked ?? [], 6, async (v) => {
    const og = await fetchOgImage(v.website);
    if (og) ogFound++;
    await sb
      .from("venues")
      .update({ og_image_url: og, og_checked_at: new Date().toISOString() })
      .eq("id", v.id);
  });

  return NextResponse.json({
    total: venues.length,
    updated,
    skipped,
    ogChecked: unchecked?.length ?? 0,
    ogFound,
    errors: errors.slice(0, 10),
  });
}
