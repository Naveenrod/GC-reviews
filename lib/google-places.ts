// Google Places API (New) helpers — SERVER ONLY. Never import into client components.
//
// Compliance notes (Google Maps Platform Terms + Places API policies):
//  - Place IDs may be stored indefinitely. Everything else we keep from Google
//    (name, address, phone, website, coordinates, editorial summary, rating, photo
//    names and their attributions) is a cache that must be refreshed or deleted
//    within 30 days. See app/api/cron/refresh-venues.
//  - Photos carry author attributions that must be displayed alongside them.
//  - We never request or store Google user reviews.

import type { PhotoAttribution } from "@/lib/types";

const KEY = process.env.GOOGLE_PLACES_API_KEY!;
const BASE = "https://places.googleapis.com/v1";

export type PlaceResult = {
  google_place_id: string;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  lat: number | null;
  lng: number | null;
  photos: string[];
  photo_attributions: PhotoAttribution[];
  google_rating: number | null;
};

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.internationalPhoneNumber",
  "places.websiteUri",
  "places.location",
  "places.rating",
  "places.photos",
  "places.editorialSummary",
].join(",");
const DETAILS_FIELD_MASK = FIELD_MASK.replace(/places\./g, "");

// We store the photo *name* (places/.../photos/...) and serve it through
// /api/photo, which hides the key and caches aggressively.

type RawPlace = {
  id: string;
  displayName?: { text?: string };
  editorialSummary?: { text?: string };
  formattedAddress?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  location?: { latitude?: number; longitude?: number };
  rating?: number;
  photos?: RawPhoto[];
};
type RawPhoto = {
  name: string;
  authorAttributions?: { displayName?: string; uri?: string }[];
};

// Collapse a photo's authorAttributions into one display entry per photo.
function photoAttribution(ph: RawPhoto): PhotoAttribution {
  const a = (ph.authorAttributions ?? [])[0];
  return { name: a?.displayName ?? "Google user", uri: a?.uri ?? null };
}

export function mapPlace(p: RawPlace): PlaceResult {
  const photos = (p.photos ?? []).slice(0, 5);
  return {
    google_place_id: p.id,
    name: p.displayName?.text ?? "Unknown",
    description: p.editorialSummary?.text ?? null,
    address: p.formattedAddress ?? null,
    phone: p.internationalPhoneNumber ?? null,
    website: p.websiteUri ?? null,
    lat: p.location?.latitude ?? null,
    lng: p.location?.longitude ?? null,
    google_rating: p.rating ?? null,
    photos: photos.map((ph) => ph.name),
    photo_attributions: photos.map(photoAttribution),
  };
}

export class SearchLimitError extends Error {}

// Text search, e.g. "restaurants in Gold Coast QLD".
// Fetches up to 3 pages (max 60 results). `allowRequest` is asked before every
// billable request; return false to stop (used to stay inside the free tier).
export async function searchPlaces(
  textQuery: string,
  allowRequest: () => Promise<boolean> = async () => true
): Promise<PlaceResult[]> {
  const all: PlaceResult[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < 3; page++) {
    if (!(await allowRequest())) {
      if (page === 0) throw new SearchLimitError("limit");
      break;
    }
    const body: Record<string, unknown> = {
      textQuery,
      languageCode: "en",
      regionCode: "AU",
      pageSize: 20,
    };
    if (pageToken) body.pageToken = pageToken;

    const res = await fetch(`${BASE}/places:searchText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": KEY,
        "X-Goog-FieldMask": FIELD_MASK + ",nextPageToken",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Places API error ${res.status}: ${await res.text()}`);
    }

    const json = await res.json();
    all.push(...(json.places ?? []).map(mapPlace));

    if (!json.nextPageToken) break;
    pageToken = json.nextPageToken;
  }

  return all;
}

// Place Details by place ID. Used by the refresh cron to re-fetch cached content
// inside the 30-day window. `allowRequest` is asked before the billable call so the
// caller can stay inside its monthly budget. Returns null when the place no longer
// exists (404) so the caller can purge its content, or when the budget says no.
export async function fetchPlace(
  placeId: string,
  allowRequest: () => Promise<boolean> = async () => true
): Promise<PlaceResult | null | "limit"> {
  if (!(await allowRequest())) return "limit";
  const res = await fetch(`${BASE}/places/${encodeURIComponent(placeId)}`, {
    headers: { "X-Goog-Api-Key": KEY, "X-Goog-FieldMask": DETAILS_FIELD_MASK },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Places API error ${res.status}: ${await res.text()}`);
  }
  return mapPlace((await res.json()) as RawPlace);
}

// The `venues` columns that hold Google content and are subject to the 30-day limit.
// Member ratings (avg_rating) are never touched: Google's rating goes to google_rating.
export function venueRowFromPlace(p: PlaceResult) {
  return {
    name: p.name,
    description: p.description,
    address: p.address,
    phone: p.phone,
    website: p.website,
    lat: p.lat,
    lng: p.lng,
    cover_image_url: p.photos[0] ?? null,
    photos: p.photos,
    photo_attributions: p.photo_attributions,
    google_rating: p.google_rating,
    google_synced_at: new Date().toISOString(),
  };
}

// What to write when cached Google content has expired and could not be refreshed.
// Name, address and contact details are kept so the listing still functions; the
// rich content (summary, photos, rating) is dropped.
export const EXPIRED_GOOGLE_CONTENT = {
  description: null,
  cover_image_url: null,
  photos: [] as string[],
  photo_attributions: [] as PhotoAttribution[],
  google_rating: null,
};
