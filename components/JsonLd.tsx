import type { Review, Venue } from "@/lib/types";
import { getBaseUrl, SITE_NAME } from "@/lib/site";

// Renders a JSON-LD <script>. Google reads this to show ⭐ ratings, breadcrumbs, etc.
function Script({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function VenueJsonLd({
  venue,
  reviews,
}: {
  venue: Venue;
  reviews: Review[];
}) {
  const base = getBaseUrl();
  const url = `${base}/${venue.location?.slug}/${venue.category?.slug}/${venue.slug}`;

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: venue.name,
    url,
    ...(venue.address && { address: venue.address }),
    ...(venue.phone && { telephone: venue.phone }),
    ...(venue.website && { sameAs: venue.website }),
    ...(venue.cover_image_url && { image: venue.cover_image_url }),
    ...(venue.description && { description: venue.description }),
    ...(venue.lat &&
      venue.lng && {
        geo: {
          "@type": "GeoCoordinates",
          latitude: venue.lat,
          longitude: venue.lng,
        },
      }),
  };

  if (venue.review_count > 0 && venue.avg_rating > 0) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: venue.avg_rating,
      reviewCount: venue.review_count,
      bestRating: 5,
      worstRating: 1,
    };
  }

  const written = reviews.filter((r) => r.body);
  if (written.length > 0) {
    data.review = written.slice(0, 10).map((r) => ({
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating,
        bestRating: 5,
        worstRating: 1,
      },
      author: {
        "@type": "Person",
        name: r.profile?.display_name ?? "Guest",
      },
      datePublished: r.created_at,
      reviewBody: r.body,
    }));
  }

  return <Script data={data} />;
}

// Ranked list (used on guide + category pages).
export function ItemListJsonLd({
  name,
  venues,
}: {
  name: string;
  venues: Venue[];
}) {
  const base = getBaseUrl();
  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: venues.length,
    itemListElement: venues.map((v, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${base}/${v.location?.slug}/${v.category?.slug}/${v.slug}`,
      name: v.name,
    })),
  };
  return <Script data={data} />;
}

export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; path: string }[];
}) {
  const base = getBaseUrl();
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${base}${it.path}`,
    })),
  };
  return <Script data={data} />;
}

export function WebsiteJsonLd() {
  const base = getBaseUrl();
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: base,
    potentialAction: {
      "@type": "SearchAction",
      target: `${base}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
  return <Script data={data} />;
}
