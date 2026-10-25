import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 300;

const PLACES_BASE = "https://places.googleapis.com/v1";
const PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY!;

function photoUrl(name: string) {
  return `${PLACES_BASE}/${name}/media?maxWidthPx=800&key=${PLACES_KEY}`;
}

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

      const json = await res.json();
      const photos: string[] = (json.photos ?? [])
        .slice(0, 5)
        .map((ph: any) => photoUrl(ph.name));

      if (!photos.length) { skipped++; continue; }

      await sb.from("venues").update({
        cover_image_url: photos[0],
        photos,
        ...(json.rating ? { avg_rating: json.rating } : {}),
      }).eq("id", venue.id);

      updated++;
      await new Promise((r) => setTimeout(r, 60));
    } catch (e: any) {
      errors.push(venue.google_place_id + ": " + e.message);
    }
  }

  return NextResponse.json({ total: venues.length, updated, skipped, errors: errors.slice(0, 10) });
}
