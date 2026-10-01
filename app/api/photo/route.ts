import { NextResponse, type NextRequest } from "next/server";
import { isPhotoName } from "@/lib/photos";

// Proxies Google Places photos so the API key stays server-side.
// GET /api/photo?name=places/{placeId}/photos/{ref}&w=800

const BASE = "https://places.googleapis.com/v1";

// Let the CDN cache images; serve stale while it refreshes in the background.
const CACHE_OK = "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800";
const CACHE_FALLBACK = "public, max-age=300, s-maxage=300";

async function fetchPhoto(name: string, width: number, key: string) {
  // skipHttpRedirect returns a short-lived, keyless photoUri instead of a 302.
  const meta = await fetch(
    `${BASE}/${name}/media?maxWidthPx=${width}&skipHttpRedirect=true`,
    { headers: { "X-Goog-Api-Key": key }, cache: "no-store" }
  );
  if (!meta.ok) return null;
  const { photoUri } = (await meta.json()) as { photoUri?: string };
  if (!photoUri) return null;

  const img = await fetch(photoUri, { cache: "no-store" });
  if (!img.ok || !img.body) return null;
  return img;
}

// Photo names expire. When a stored one stops working, look up a current one.
async function freshPhotoName(placeId: string, key: string): Promise<string | null> {
  const res = await fetch(`${BASE}/places/${placeId}`, {
    headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": "photos" },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { photos?: { name: string }[] };
  return json.photos?.[0]?.name ?? null;
}

function placeholder(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/placeholder-venue.svg", req.url));
  res.headers.set("Cache-Control", CACHE_FALLBACK);
  return res;
}

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name") ?? "";
  const w = Number(req.nextUrl.searchParams.get("w")) || 800;
  const width = Math.min(Math.max(Math.round(w), 100), 1600);
  const key = process.env.GOOGLE_PLACES_API_KEY;

  if (!isPhotoName(name)) {
    return NextResponse.json({ error: "Invalid photo name" }, { status: 400 });
  }
  if (!key) {
    console.error("[api/photo] GOOGLE_PLACES_API_KEY is not set");
    return placeholder(req);
  }

  let img = await fetchPhoto(name, width, key);
  if (!img) {
    const fresh = await freshPhotoName(name.split("/")[1], key);
    if (fresh && fresh !== name) img = await fetchPhoto(fresh, width, key);
  }
  if (!img) {
    console.error(`[api/photo] could not load ${name}`);
    return placeholder(req);
  }

  return new NextResponse(img.body, {
    headers: {
      "Content-Type": img.headers.get("Content-Type") ?? "image/jpeg",
      "Cache-Control": CACHE_OK,
    },
  });
}
