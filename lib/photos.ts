// Photo resolution — safe to import anywhere (no secrets, no network).
//
// Priority for a venue's imagery:
//   1. og_image_url        — the venue's own website hero image (free)
//   2. community_cover_url — a member-uploaded photo (free)
//   3. Google Places photo — OFF by default because it is a paid API. Only used when
//      NEXT_PUBLIC_GOOGLE_PHOTOS=on is set in Vercel.
//   4. designed placeholder — /api/placeholder (generated SVG, free)

import type { Venue } from "@/lib/types";

export const GOOGLE_PHOTOS_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_PHOTOS === "on";

const GOOGLE_NAME = /places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+/;

// Accepts a bare photo name or a legacy media URL (with key) and returns the bare name.
export function googlePhotoName(value: string | null | undefined): string | null {
  if (!value) return null;
  const m = GOOGLE_NAME.exec(value);
  return m ? m[0] : null;
}

export function isGooglePhoto(value: string | null | undefined): boolean {
  return !!googlePhotoName(value);
}

export function proxiedGooglePhoto(value: string | null | undefined, width = 800): string | null {
  if (!GOOGLE_PHOTOS_ENABLED) return null;
  const name = googlePhotoName(value);
  return name ? `/api/photo/${name}?w=${width}` : null;
}

export function placeholderFor(venue: Pick<Venue, "name"> & { category?: { slug: string } | null }): string {
  const params = new URLSearchParams({
    n: venue.name,
    c: venue.category?.slug ?? "",
  });
  return `/api/placeholder?${params.toString()}`;
}

// Best single image for cards, Open Graph and JSON-LD.
export function venueCover(
  venue: Pick<Venue, "name" | "cover_image_url" | "photos" | "og_image_url" | "community_cover_url"> & {
    category?: { slug: string } | null;
  },
  width = 800
): string {
  return (
    venue.og_image_url ||
    venue.community_cover_url ||
    proxiedGooglePhoto(venue.cover_image_url || venue.photos?.[0], width) ||
    placeholderFor(venue)
  );
}

// Fallback used by <SmartImage> when the chosen cover fails to load.
export function venueFallback(
  venue: Pick<Venue, "name" | "cover_image_url" | "photos"> & { category?: { slug: string } | null }
): string {
  return proxiedGooglePhoto(venue.cover_image_url || venue.photos?.[0]) || placeholderFor(venue);
}

// Ordered, de-duplicated gallery for the venue page.
export function venueGallery(
  venue: Pick<Venue, "name" | "cover_image_url" | "photos" | "og_image_url" | "community_cover_url"> & {
    category?: { slug: string } | null;
  },
  communityPhotos: string[] = [],
  max = 12
): string[] {
  const out: string[] = [];
  const push = (u: string | null | undefined) => {
    if (u && !out.includes(u)) out.push(u);
  };
  push(venue.og_image_url);
  communityPhotos.forEach(push);
  push(proxiedGooglePhoto(venue.cover_image_url, 1200));
  (venue.photos ?? []).forEach((p) => push(proxiedGooglePhoto(p, 1200)));
  if (out.length === 0) out.push(placeholderFor(venue));
  return out.slice(0, max);
}

export function absoluteUrl(base: string, path: string): string {
  return path.startsWith("http") ? path : `${base}${path}`;
}
