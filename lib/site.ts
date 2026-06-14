// Central place for the canonical site URL — used by sitemap, robots, metadata, JSON-LD.

export function getBaseUrl(): string {
  // Explicit override wins (set NEXT_PUBLIC_SITE_URL in Vercel to your real domain).
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit && !explicit.includes("localhost")) {
    return explicit.replace(/\/$/, "");
  }
  // Vercel provides the production domain automatically.
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;

  return explicit?.replace(/\/$/, "") || "http://localhost:3000";
}

export const SITE_NAME = "GC Reviews";
export const SITE_DESCRIPTION =
  "Discover, review and book the best restaurants, hotels and entertainment across the Gold Coast and Brisbane — all the reviews in one place.";
