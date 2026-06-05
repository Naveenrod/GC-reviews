// Google Places API (New) helpers — SERVER ONLY. Never import into client components.

const KEY = process.env.GOOGLE_PLACES_API_KEY!;
const BASE = "https://places.googleapis.com/v1";

export type PlaceResult = {
  google_place_id: string;
  name: string;
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
].join(",");

function photoUrl(name: string, maxWidth = 800): string {
  return `${BASE}/${name}/media?maxWidthPx=${maxWidth}&key=${KEY}`;
}

function mapPlace(p: any): PlaceResult {
  return {
    google_place_id: p.id,
    name: p.displayName?.text ?? "Unknown",
    address: p.formattedAddress ?? null,
    phone: p.internationalPhoneNumber ?? null,
    website: p.websiteUri ?? null,
    lat: p.location?.latitude ?? null,
    lng: p.location?.longitude ?? null,
    google_rating: p.rating ?? null,
    photos: (p.photos ?? []).slice(0, 5).map((ph: any) => photoUrl(ph.name)),
  };
}

// Text search, e.g. "restaurants in Gold Coast QLD".
// Fetches up to 3 pages (max 60 results) automatically.
export async function searchPlaces(textQuery: string): Promise<PlaceResult[]> {
  const all: PlaceResult[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < 3; page++) {
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
