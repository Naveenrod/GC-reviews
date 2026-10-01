// Venue photo helpers. Safe to import from client components.
//
// Venue photos come from Google Places. We store the photo resource name
// ("places/{placeId}/photos/{ref}") and serve it through /api/photo, which
// adds the API key server-side. Older rows hold full
// places.googleapis.com/.../media?key=... URLs; those are rewritten here so the
// key never reaches the browser.

import { getBaseUrl } from "@/lib/site";

export const PLACEHOLDER_IMAGE = "/placeholder-venue.svg";

const PHOTO_NAME_RE = /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/;
const LEGACY_URL_RE =
  /^https:\/\/places\.googleapis\.com\/v1\/(places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+)\/media/;

export function isPhotoName(value: string): boolean {
  return PHOTO_NAME_RE.test(value);
}

// Extracts the Google photo resource name from a stored value, if it is one.
export function googlePhotoName(stored: string): string | null {
  if (isPhotoName(stored)) return stored;
  return stored.match(LEGACY_URL_RE)?.[1] ?? null;
}

// Turns a stored photo value into a URL that is safe to render.
export function photoSrc(stored: string | null | undefined, width = 800): string | null {
  if (!stored) return null;
  const name = googlePhotoName(stored);
  if (!name) return stored;
  return `/api/photo?name=${encodeURIComponent(name)}&w=${width}`;
}

// Absolute version for places that need a full URL (Open Graph, JSON-LD, Instagram).
export function absolutePhotoSrc(stored: string | null | undefined, width = 1080): string | null {
  const src = photoSrc(stored, width);
  if (!src) return null;
  return src.startsWith("/") ? `${getBaseUrl()}${src}` : src;
}

export function venueCover(venue: {
  cover_image_url: string | null;
  photos: string[] | null;
}): string | null {
  return venue.cover_image_url || venue.photos?.[0] || null;
}
