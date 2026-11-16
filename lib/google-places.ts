// Google Places API (New) helpers — SERVER ONLY. Never import into client components.

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
  photos?: { name: string }[];
};

function mapPlace(p: RawPlace): PlaceResult {
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
    photos: (p.photos ?? []).slice(0, 5).map((ph: { name: string }) => ph.name),
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
