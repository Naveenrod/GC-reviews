// Cached Google Places photo proxy. DISABLED unless NEXT_PUBLIC_GOOGLE_PHOTOS=on,
// because Google photos are a paid API.
// - The API key never leaves the server.
// - Responses are cached by Vercel's CDN and Next's data cache for 30 days,
//   so Google is only called on a cache miss (roughly once per photo per month).
// - A monthly budget (PHOTO_MONTHLY_BUDGET, default 900 — inside the free tier)
//   stops billing surprises; past it we serve the designed placeholder instead.
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const NAME = /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/;
const THIRTY_DAYS = 60 * 60 * 24 * 30;
const CACHE_OK = `public, max-age=86400, s-maxage=${THIRTY_DAYS}, stale-while-revalidate=${THIRTY_DAYS}`;
const CACHE_FALLBACK = "public, max-age=600, s-maxage=3600";

// On any failure return 404 so <SmartImage> moves on to the venue's own
// themed placeholder (it knows the venue name and category; we don't).
function unavailable(reason: string) {
  return new NextResponse(null, {
    status: 404,
    headers: { "Cache-Control": CACHE_FALLBACK, "X-Photo-Source": reason },
  });
}

async function withinBudget(): Promise<boolean> {
  const budget = Number(process.env.PHOTO_MONTHLY_BUDGET ?? 900);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return true; // no counter available — don't block images
  try {
    const sb = createClient(url, key, { auth: { persistSession: false } });
    const month = new Date().toISOString().slice(0, 7);
    const { data, error } = await sb.rpc("bump_counter", { p_key: `photo_budget_${month}` });
    if (error) return true; // migration not applied yet — fail open
    return Number(data) <= budget;
  } catch {
    return true;
  }
}

export async function GET(req: Request, ctx: { params: Promise<{ name: string[] }> }) {
  if (process.env.NEXT_PUBLIC_GOOGLE_PHOTOS !== "on") return unavailable("disabled");
  const { name } = await ctx.params;
  const photoName = name.join("/");
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!NAME.test(photoName)) return unavailable("bad-name");
  if (!apiKey) return unavailable("no-key");

  const w = Math.min(1600, Math.max(200, Number(new URL(req.url).searchParams.get("w") ?? 800)));

  if (!(await withinBudget())) return unavailable("budget-exceeded");

  try {
    const upstream = await fetch(
      `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${w}&key=${apiKey}`,
      { redirect: "follow", next: { revalidate: THIRTY_DAYS } }
    );
    if (!upstream.ok) return unavailable(`google-${upstream.status}`);
    const body = await upstream.arrayBuffer();
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
        "Cache-Control": CACHE_OK,
        "X-Photo-Source": "google",
      },
    });
  } catch {
    return unavailable("fetch-error");
  }
}
