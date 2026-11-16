// SERVER ONLY. Free stock banner for a location (not for venues — never pretend
// a stock photo is the actual venue). Requires UNSPLASH_ACCESS_KEY; without it
// callers fall back to the gradient banner.

export type Banner = {
  url: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
  photoUrl: string;
};

const QUERY_HINTS: Record<string, string> = {
  "gold-coast": "Gold Coast Australia beach skyline",
  brisbane: "Brisbane Australia river skyline",
};

export async function getLocationBanner(slug: string, name: string): Promise<Banner | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return null;
  const query = QUERY_HINTS[slug] ?? `${name} Australia`;
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?per_page=1&orientation=landscape&content_filter=high&query=${encodeURIComponent(query)}`,
      {
        headers: { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" },
        next: { revalidate: 60 * 60 * 24 }, // one call per location per day
      }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const p = json.results?.[0];
    if (!p) return null;
    const utm = "utm_source=gc_reviews&utm_medium=referral";
    return {
      url: `${p.urls.raw}&w=1600&h=600&fit=crop&q=80&auto=format`,
      alt: p.alt_description ?? name,
      photographer: p.user?.name ?? "Unsplash",
      photographerUrl: `${p.user?.links?.html ?? "https://unsplash.com"}?${utm}`,
      photoUrl: `${p.links?.html ?? "https://unsplash.com"}?${utm}`,
    };
  } catch {
    return null;
  }
}
