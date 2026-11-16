// Daily job (see vercel.json). Two passes:
//
// 1. Free website photos: look for a photo on venue websites for venues that have
//    none yet, retrying monthly, and copy it onto our own storage. No Google calls.
//
// 2. Google content cache: the Google Maps Platform terms allow Places content
//    (other than place IDs) to be cached for at most 30 days. Venues whose Google
//    content is older than PLACES_REFRESH_AFTER_DAYS are re-fetched with Place
//    Details, oldest first, inside a monthly budget (GOOGLE_DETAILS_MONTHLY_LIMIT,
//    default 900, under Google's free allowance; counted atomically via bump_counter).
//    Anything still older than PLACES_MAX_CACHE_DAYS loses its Google summary,
//    photos and rating until the refresh reaches it. Place IDs, names and contact
//    details are kept so listings keep working. Member reviews are never touched.
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { fetchOgImage, mapLimit } from "@/lib/og-image";
import { resolveVenuePhoto } from "@/lib/host-photo";
import { fetchPlace, venueRowFromPlace, EXPIRED_GOOGLE_CONTENT } from "@/lib/google-places";
import { PLACES_MAX_CACHE_DAYS, PLACES_REFRESH_AFTER_DAYS } from "@/lib/site";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const OG_PER_RUN = 400;
const DETAILS_MAX_PER_RUN = 150;
const DETAILS_MONTHLY_LIMIT = Number(process.env.GOOGLE_DETAILS_MONTHLY_LIMIT ?? 900);
const DAY_MS = 86_400_000;

function monthKey() {
  return `places_details_${new Date().toISOString().slice(0, 7)}`;
}

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = createServiceClient();
  const now = Date.now();

  // ---------- pass 1: free website photos ----------
  const monthAgo = new Date(now - 30 * DAY_MS).toISOString();
  const { data: ogVenues, error: ogErr } = await sb
    .from("venues")
    .select("id, website")
    .not("website", "is", null)
    .is("og_image_url", null)
    .or(`og_checked_at.is.null,og_checked_at.lt.${monthAgo}`)
    .order("og_checked_at", { ascending: true, nullsFirst: true })
    .limit(OG_PER_RUN);
  if (ogErr) return NextResponse.json({ error: ogErr.message }, { status: 500 });

  let ogFound = 0;
  await mapLimit(ogVenues ?? [], 8, async (v: { id: string; website: string }) => {
    const photo = await resolveVenuePhoto(sb, v.id, await fetchOgImage(v.website));
    if (photo) ogFound++;
    await sb
      .from("venues")
      .update({ og_image_url: photo, og_checked_at: new Date().toISOString() })
      .eq("id", v.id);
  });

  // ---------- pass 2: Google content within the 30-day window ----------
  const refreshBefore = new Date(now - PLACES_REFRESH_AFTER_DAYS * DAY_MS).toISOString();
  const expireBefore = new Date(now - PLACES_MAX_CACHE_DAYS * DAY_MS).toISOString();

  const { data: due, error: dueErr } = await sb
    .from("venues")
    .select("id, google_place_id, google_synced_at")
    .not("google_place_id", "is", null)
    .or(`google_synced_at.is.null,google_synced_at.lt.${refreshBefore}`)
    .order("google_synced_at", { ascending: true, nullsFirst: true })
    .limit(DETAILS_MAX_PER_RUN);
  if (dueErr) return NextResponse.json({ error: dueErr.message }, { status: 500 });

  // Atomically reserve one Place Details request. Fails closed: no counter, no call.
  const reserve = async (): Promise<boolean> => {
    const { data, error } = await sb.rpc("bump_counter", { p_key: monthKey() });
    if (error) return false;
    return Number(data) <= DETAILS_MONTHLY_LIMIT;
  };

  let refreshed = 0;
  let gone = 0;
  let failed = 0;
  let budgetHit = false;
  const errors: string[] = [];

  for (const v of due ?? []) {
    if (!v.google_place_id) continue;
    try {
      const place = await fetchPlace(v.google_place_id, reserve);
      if (place === "limit") {
        budgetHit = true;
        break;
      }
      if (!place) {
        // Place no longer exists on Google: drop its content, keep our record and reviews.
        await sb
          .from("venues")
          .update({ ...EXPIRED_GOOGLE_CONTENT, google_synced_at: new Date().toISOString() })
          .eq("id", v.id);
        gone++;
      } else {
        await sb.from("venues").update(venueRowFromPlace(place)).eq("id", v.id);
        refreshed++;
      }
      await new Promise((r) => setTimeout(r, 50));
    } catch (e) {
      failed++;
      const msg = e instanceof Error ? e.message : String(e);
      if (errors.length < 10) errors.push(`${v.google_place_id}: ${msg}`);
    }
  }

  // Hard stop: anything still older than the maximum cache age loses its Google content.
  const { data: expired } = await sb
    .from("venues")
    .update(EXPIRED_GOOGLE_CONTENT)
    .lt("google_synced_at", expireBefore)
    .or("description.not.is.null,cover_image_url.not.is.null,google_rating.not.is.null")
    .select("id");

  return NextResponse.json({
    websitePhotos: { checked: ogVenues?.length ?? 0, found: ogFound },
    google: {
      due: due?.length ?? 0,
      refreshed,
      gone,
      failed,
      budgetHit,
      expired: expired?.length ?? 0,
      monthlyLimit: DETAILS_MONTHLY_LIMIT,
      errors,
    },
  });
}
