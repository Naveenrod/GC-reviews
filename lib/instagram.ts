// Instagram auto-posting via the Meta Graph API. SERVER ONLY.
//
// Credentials live in the app_config table (not env), so the daily cron can
// auto-refresh the long-lived token and persist the new one.
//
// Required app_config keys:
//   ig_business_account_id  — your Instagram Business account ID
//   ig_access_token         — long-lived access token
//   ig_token_updated_at     — ISO timestamp (managed automatically)
// Optional (enables automatic 60-day token refresh):
//   fb_app_id, fb_app_secret

import { createServiceClient } from "@/lib/supabase/server";
import { getBaseUrl } from "@/lib/site";
import { slugify } from "@/lib/utils";
import type { Venue } from "@/lib/types";

const GRAPH = "https://graph.facebook.com/v21.0";

// ---------- config store ----------

export async function getConfig(): Promise<Record<string, string>> {
  const sb = createServiceClient();
  const { data } = await sb.from("app_config").select("key, value");
  const out: Record<string, string> = {};
  for (const row of data ?? []) out[row.key] = row.value ?? "";
  return out;
}

export async function setConfig(entries: Record<string, string>): Promise<void> {
  const sb = createServiceClient();
  const rows = Object.entries(entries).map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString(),
  }));
  await sb.from("app_config").upsert(rows, { onConflict: "key" });
}

// ---------- token refresh ----------

// Long-lived tokens last ~60 days. Re-exchange to extend when getting stale.
async function maybeRefreshToken(cfg: Record<string, string>): Promise<string> {
  const token = cfg.ig_access_token;
  const updatedAt = cfg.ig_token_updated_at
    ? new Date(cfg.ig_token_updated_at).getTime()
    : 0;
  const ageDays = (Date.now() - updatedAt) / 86_400_000;

  // Refresh if older than 45 days and we have app credentials to do it.
  if (ageDays > 45 && cfg.fb_app_id && cfg.fb_app_secret) {
    const url =
      `${GRAPH}/oauth/access_token?grant_type=fb_exchange_token` +
      `&client_id=${cfg.fb_app_id}` +
      `&client_secret=${cfg.fb_app_secret}` +
      `&fb_exchange_token=${token}`;
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      if (json.access_token) {
        await setConfig({
          ig_access_token: json.access_token,
          ig_token_updated_at: new Date().toISOString(),
        });
        return json.access_token;
      }
    }
  }
  return token;
}

// ---------- posting ----------

export type PostResult =
  | { ok: true; mediaId: string }
  | { ok: false; error: string };

export async function postToInstagram(
  imageUrl: string,
  caption: string
): Promise<PostResult> {
  const cfg = await getConfig();
  if (!cfg.ig_business_account_id || !cfg.ig_access_token) {
    return { ok: false, error: "Instagram not connected (missing token / account id)." };
  }
  const token = await maybeRefreshToken(cfg);
  const igId = cfg.ig_business_account_id;

  // Step 1 — create a media container.
  const createRes = await fetch(`${GRAPH}/${igId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: imageUrl, caption, access_token: token }),
  });
  const createJson = await createRes.json();
  if (!createRes.ok || !createJson.id) {
    return {
      ok: false,
      error: createJson.error?.message || `Container failed (${createRes.status})`,
    };
  }

  // Step 2 — publish the container.
  const pubRes = await fetch(`${GRAPH}/${igId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: createJson.id, access_token: token }),
  });
  const pubJson = await pubRes.json();
  if (!pubRes.ok || !pubJson.id) {
    return {
      ok: false,
      error: pubJson.error?.message || `Publish failed (${pubRes.status})`,
    };
  }

  return { ok: true, mediaId: pubJson.id };
}

// Quick connection check — fetches the account username.
export async function checkConnection(): Promise<
  { ok: true; username: string } | { ok: false; error: string }
> {
  const cfg = await getConfig();
  if (!cfg.ig_business_account_id || !cfg.ig_access_token) {
    return { ok: false, error: "Not connected." };
  }
  const res = await fetch(
    `${GRAPH}/${cfg.ig_business_account_id}?fields=username&access_token=${cfg.ig_access_token}`
  );
  const json = await res.json();
  if (!res.ok || !json.username) {
    return { ok: false, error: json.error?.message || "Connection failed." };
  }
  return { ok: true, username: json.username };
}

// ---------- captions ----------

const CATEGORY_TAGS: Record<string, string[]> = {
  restaurants: ["#foodie", "#restaurant", "#eatlocal"],
  hotels: ["#hotel", "#staycation", "#travel"],
  entertainment: ["#thingstodo", "#funtimes", "#nightout"],
  cafes: ["#cafe", "#coffee", "#brunch"],
  bars: ["#bar", "#cocktails", "#nightlife"],
  "things-to-do": ["#explore", "#adventure", "#thingstodo"],
};

function locationTag(name?: string): string {
  if (!name) return "#australia";
  const s = name.toLowerCase();
  if (s.includes("gold coast")) return "#goldcoast";
  if (s.includes("brisbane")) return "#brisbane";
  return `#${slugify(name).replace(/-/g, "")}`;
}

export function buildVenueCaption(venue: Venue): string {
  const base = getBaseUrl();
  const url = `${base}/${venue.location?.slug}/${venue.category?.slug}/${venue.slug}`;
  const cat = venue.category?.slug ?? "";
  const ratingLine =
    venue.review_count > 0
      ? `⭐ ${venue.avg_rating}/5 from ${venue.review_count} review${venue.review_count !== 1 ? "s" : ""}\n`
      : "";

  const tags = [
    locationTag(venue.location?.name),
    "#gcreviews",
    "#visitgoldcoast",
    ...(CATEGORY_TAGS[cat] ?? []),
  ];

  return (
    `📍 ${venue.name}${venue.location?.name ? ` — ${venue.location.name}` : ""}\n` +
    ratingLine +
    (venue.description ? `\n${venue.description.slice(0, 180)}\n` : "\n") +
    `\n🔗 Reviews & booking: ${url}\n\n` +
    tags.join(" ")
  );
}

// ---------- pick the next venue to post ----------

export async function pickNextVenue(): Promise<Venue | null> {
  const sb = createServiceClient();

  // Venues we've already posted (or queued) — don't repeat.
  const { data: posted } = await sb
    .from("social_posts")
    .select("venue_id")
    .not("venue_id", "is", null);
  const postedIds = new Set((posted ?? []).map((p: { venue_id: string }) => p.venue_id));

  // Highest-rated venues that have a usable image.
  const { data } = await sb
    .from("venues")
    .select("*, category:categories(*), location:locations(*)")
    .not("cover_image_url", "is", null)
    .order("avg_rating", { ascending: false })
    .order("review_count", { ascending: false })
    .limit(200);

  const venues = (data as Venue[]) ?? [];
  return venues.find((v) => !postedIds.has(v.id)) ?? null;
}

// ---------- orchestrator (used by cron + manual trigger) ----------

export async function runInstagramPost(): Promise<
  { ok: true; venue: string; mediaId: string } | { ok: false; error: string }
> {
  const venue = await pickNextVenue();
  if (!venue) return { ok: false, error: "No new venue to post (all caught up)." };

  const imageUrl = venue.cover_image_url || venue.photos?.[0];
  if (!imageUrl) return { ok: false, error: "Selected venue has no image." };

  const caption = buildVenueCaption(venue);
  const sb = createServiceClient();

  const result = await postToInstagram(imageUrl, caption);

  await sb.from("social_posts").insert({
    platform: "instagram",
    venue_id: venue.id,
    caption,
    image_url: imageUrl,
    status: result.ok ? "posted" : "failed",
    external_id: result.ok ? result.mediaId : null,
    error: result.ok ? null : result.error,
    posted_at: result.ok ? new Date().toISOString() : null,
  });

  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, venue: venue.name, mediaId: result.mediaId };
}
