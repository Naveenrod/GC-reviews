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

// ---------- legal / compliance settings ----------

// Legal entity that operates the site, as shown in the Terms and Privacy Policy.
// Set NEXT_PUBLIC_LEGAL_ENTITY to e.g. "Example Pty Ltd (ABN 12 345 678 901) trading as GC Reviews".
export const LEGAL_ENTITY =
  process.env.NEXT_PUBLIC_LEGAL_ENTITY || "GC Reviews";

// Contact address for legal, privacy and takedown correspondence.
// Set NEXT_PUBLIC_CONTACT_EMAIL in Vercel. Pages fall back to the Report form when unset.
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "";

// Minimum age to hold an account or post a review. Matches Instagram's Australian minimum.
export const MIN_AGE = 16;

// Google Maps Platform terms allow Places content (other than place IDs) to be cached for
// at most 30 consecutive days. We refresh from day 25 and purge anything older than 30.
export const PLACES_REFRESH_AFTER_DAYS = 25;
export const PLACES_MAX_CACHE_DAYS = 30;

// Date these policies were last changed. Update when you edit the legal pages.
export const POLICIES_UPDATED = "15 November 2026";
