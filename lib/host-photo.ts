// SERVER ONLY. Copies a venue's website photo into our own Supabase Storage so
// the site no longer depends on the venue's server (broken links, hotlink
// blocking, slow hosts). Images are resized to keep storage small.
//
// Stored at venue-photos/venues/{venueId}.jpg and served through /api/img/...,
// which Vercel's CDN caches for a year, so Supabase's free bandwidth is barely used.

import sharp from "sharp";
import type { SupabaseClient } from "@supabase/supabase-js";

export const VENUE_BUCKET = "venue-photos";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const MAX_DOWNLOAD = 10 * 1024 * 1024;
const MIN_WIDTH = 300;

export type HostResult =
  | { ok: true; path: string }
  | { ok: false; reason: "too-small" | "not-image" | "download-failed" | "upload-failed" };

export function isHosted(url: string | null | undefined): boolean {
  return !!url && url.startsWith("/api/img/");
}

let bucketReady: Promise<void> | null = null;
function ensureBucket(svc: SupabaseClient): Promise<void> {
  bucketReady ??= (async () => {
    const { error } = await svc.storage.getBucket(VENUE_BUCKET);
    if (error) {
      await svc.storage.createBucket(VENUE_BUCKET, {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024,
        allowedMimeTypes: ["image/jpeg"],
      });
    }
  })().catch((e) => {
    bucketReady = null;
    throw e;
  });
  return bucketReady;
}

async function download(url: string): Promise<Buffer | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12_000);
  try {
    const origin = new URL(url).origin;
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      cache: "no-store",
      // Some hosts only serve images when the request looks like it came from their own site.
      headers: { "User-Agent": UA, Accept: "image/avif,image/webp,image/*,*/*;q=0.8", Referer: `${origin}/` },
    });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "";
    if (!type.startsWith("image/") || type.includes("svg")) return null;
    const len = Number(res.headers.get("content-length") ?? 0);
    if (len > MAX_DOWNLOAD) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.length > MAX_DOWNLOAD ? null : buf;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function hostVenuePhoto(
  svc: SupabaseClient,
  venueId: string,
  sourceUrl: string
): Promise<HostResult> {
  if (isHosted(sourceUrl)) return { ok: true, path: sourceUrl };
  const raw = await download(sourceUrl);
  if (!raw) return { ok: false, reason: "download-failed" };

  let jpeg: Buffer;
  try {
    const img = sharp(raw, { failOn: "none" }).rotate();
    const meta = await img.metadata();
    if (!meta.width || meta.width < MIN_WIDTH) return { ok: false, reason: "too-small" };
    jpeg = await img
      .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer();
  } catch {
    return { ok: false, reason: "not-image" };
  }

  try {
    await ensureBucket(svc);
    const key = `venues/${venueId}.jpg`;
    const { error } = await svc.storage
      .from(VENUE_BUCKET)
      .upload(key, jpeg, { contentType: "image/jpeg", upsert: true, cacheControl: "31536000" });
    if (error) return { ok: false, reason: "upload-failed" };
    // Version suffix so CDNs pick up a replaced photo.
    return { ok: true, path: `/api/img/${key}?v=${Date.now().toString(36)}` };
  } catch {
    return { ok: false, reason: "upload-failed" };
  }
}

// Find + host in one step. Returns the value to save in venues.og_image_url.
export async function resolveVenuePhoto(
  svc: SupabaseClient,
  venueId: string,
  found: string | null
): Promise<string | null> {
  if (!found) return null;
  const r = await hostVenuePhoto(svc, venueId, found);
  if (r.ok) return r.path;
  if (r.reason === "too-small" || r.reason === "not-image") return null; // icon or junk
  return found; // couldn't copy (blocked/offline) — keep the link, browser may still load it
}
