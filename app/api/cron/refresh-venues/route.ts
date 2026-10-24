import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { searchPlaces } from "@/lib/google-places";
import { slugify } from "@/lib/utils";

export const maxDuration = 300; // 5 min timeout (Vercel Pro max)

export async function GET(req: Request) {
  // Verify this is called by Vercel Cron (or manually with the secret)
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [{ data: locations }, { data: categories }] = await Promise.all([
    sb.from("locations").select("id, name, slug"),
    sb.from("categories").select("id, name, slug"),
  ]);

  if (!locations || !categories) {
    return NextResponse.json({ error: "Failed to fetch locations/categories" }, { status: 500 });
  }

  let total = 0;
  const errors: string[] = [];

  for (const loc of locations) {
    for (const cat of categories) {
      try {
        const places = await searchPlaces(`${cat.name} in ${loc.name} QLD Australia`);

        const seenSlugs = new Set<string>();
        const rows = places.map((p) => {
          let slug = slugify(p.name);
          if (seenSlugs.has(slug)) slug = `${slug}-${p.google_place_id.slice(-4).toLowerCase()}`;
          seenSlugs.add(slug);
          return {
            google_place_id: p.google_place_id,
            name: p.name,
            slug,
            category_id: cat.id,
            location_id: loc.id,
            description: p.description,
            address: p.address,
            phone: p.phone,
            website: p.website,
            booking_url: p.website,
            cover_image_url: p.photos?.[0] ?? null,
            photos: p.photos ?? [],
            lat: p.lat,
            lng: p.lng,
            avg_rating: p.avg_rating,
          };
        });

        const { error } = await sb
          .from("venues")
          .upsert(rows, { onConflict: "google_place_id" });

        if (error) {
          errors.push(`${loc.name}/${cat.name}: ${error.message}`);
        } else {
          total += rows.length;
        }
      } catch (e: any) {
        errors.push(`${loc.name}/${cat.name}: ${e.message}`);
      }

      // Avoid rate limiting
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  return NextResponse.json({ refreshed: total, errors });
}
