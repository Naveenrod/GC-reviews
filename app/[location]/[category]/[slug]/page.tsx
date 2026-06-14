export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Phone, Globe, CalendarCheck, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getVenueBySlug } from "@/lib/queries";
import { StarRating } from "@/components/StarRating";
import { ReviewList } from "@/components/ReviewList";
import { ReviewForm } from "@/components/ReviewForm";
import { VenueJsonLd, BreadcrumbJsonLd } from "@/components/JsonLd";
import { formatRating } from "@/lib/utils";
import type { Review } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ location: string; category: string; slug: string }>;
}): Promise<Metadata> {
  const { location, category, slug } = await params;
  const venue = await getVenueBySlug(location, category, slug);
  if (!venue) return { title: "Venue not found" };

  const title = `${venue.name} — Reviews & Booking`;
  const description =
    venue.description ||
    `Read reviews of ${venue.name} in ${venue.location?.name}. ${
      venue.review_count > 0
        ? `Rated ${venue.avg_rating}/5 from ${venue.review_count} reviews. `
        : ""
    }See details and book your visit.`;
  const image = venue.cover_image_url || venue.photos?.[0];

  return {
    title,
    description,
    alternates: {
      canonical: `/${location}/${category}/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      ...(image && { images: [{ url: image }] }),
    },
  };
}

export default async function VenuePage({
  params,
}: {
  params: Promise<{ location: string; category: string; slug: string }>;
}) {
  const { location, category, slug } = await params;
  const venue = await getVenueBySlug(location, category, slug);
  if (!venue) notFound();

  const sb = await createClient();
  const [{ data: reviews }, { data: googleReviews }] = await Promise.all([
    sb.from("reviews").select("*, profile:profiles(*)").eq("venue_id", venue.id).order("created_at", { ascending: false }),
    sb.from("google_reviews").select("*").eq("venue_id", venue.id).order("published_at", { ascending: false }),
  ]);

  const gallery = (venue.photos && venue.photos.length > 0
    ? venue.photos
    : [venue.cover_image_url || "/placeholder-venue.svg"]
  ).slice(0, 5);

  const bookingUrl = venue.booking_url || venue.website;
  const reviewList = (reviews as Review[]) ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <VenueJsonLd venue={venue} reviews={reviewList} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: venue.location?.name ?? "", path: `/${location}` },
          { name: venue.category?.name ?? "", path: `/${location}/${category}` },
          { name: venue.name, path: `/${location}/${category}/${slug}` },
        ]}
      />
      {/* breadcrumb */}
      <nav className="mb-4 flex items-center gap-1 text-sm text-slate-500">
        <Link href={`/${location}`} className="hover:text-brand">
          {venue.location?.name}
        </Link>
        <ChevronRight size={14} />
        <Link href={`/${location}/${category}`} className="hover:text-brand">
          {venue.category?.name}
        </Link>
        <ChevronRight size={14} />
        <span className="text-slate-700">{venue.name}</span>
      </nav>

      {/* gallery */}
      <div className="grid grid-cols-4 gap-2 overflow-hidden rounded-2xl">
        <div className="relative col-span-4 h-64 sm:col-span-2 sm:row-span-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={gallery[0]}
            alt={venue.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
        {gallery.slice(1, 5).map((p, i) => (
          <div key={i} className="relative hidden h-[126px] sm:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* header */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="text-sm font-medium text-brand">
            {venue.category?.name}
          </span>
          <h1 className="text-3xl font-bold">{venue.name}</h1>
          <div className="mt-2 flex items-center gap-2">
            <StarRating value={venue.avg_rating} size={18} />
            <span className="font-semibold text-slate-800">
              {formatRating(venue.avg_rating)}
            </span>
            <span className="text-slate-400">
              ({venue.review_count} review{venue.review_count !== 1 ? "s" : ""})
            </span>
          </div>
        </div>
        {bookingUrl && (
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 font-semibold text-white shadow-sm transition hover:brightness-95"
          >
            <CalendarCheck size={18} /> Book Now
          </a>
        )}
      </div>

      {/* info + reviews */}
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {venue.description && (
            <p className="mb-6 leading-relaxed text-slate-600">
              {venue.description}
            </p>
          )}

          <h2 className="mb-4 text-xl font-bold">
            Reviews ({venue.review_count})
          </h2>
          <div className="mb-6">
            <ReviewForm venueId={venue.id} />
          </div>
          <ReviewList reviews={(reviews as Review[]) ?? []} />

          {googleReviews && googleReviews.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-4 text-xl font-bold">
                Google Reviews ({googleReviews.length})
              </h2>
              <div className="space-y-4">
                {googleReviews.map((r) => (
                  <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      {r.author_photo && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.author_photo} alt={r.author_name} className="h-9 w-9 rounded-full object-cover" />
                      )}
                      <div>
                        <a
                          href={r.author_url ?? "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-slate-800 hover:text-brand"
                        >
                          {r.author_name}
                        </a>
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <StarRating value={r.rating} size={13} />
                          {r.published_at && (
                            <span className="ml-1">· {new Date(r.published_at).toLocaleDateString("en-AU", { month: "short", year: "numeric" })}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {r.text && (
                      <p className="mt-3 text-sm leading-relaxed text-slate-600">{r.text}</p>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-slate-400">
                Reviews sourced from{" "}
                <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">
                  Google Maps
                </a>
              </p>
            </div>
          )}
        </div>

        <aside className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="mb-3 font-semibold">Details</h3>
            <ul className="space-y-3 text-sm text-slate-600">
              {venue.address && (
                <li className="flex gap-2">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-brand" />
                  {venue.address}
                </li>
              )}
              {venue.phone && (
                <li className="flex gap-2">
                  <Phone size={16} className="mt-0.5 shrink-0 text-brand" />
                  <a href={`tel:${venue.phone}`} className="hover:text-brand">
                    {venue.phone}
                  </a>
                </li>
              )}
              {venue.website && (
                <li className="flex gap-2">
                  <Globe size={16} className="mt-0.5 shrink-0 text-brand" />
                  <a
                    href={venue.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all hover:text-brand"
                  >
                    Visit website
                  </a>
                </li>
              )}
            </ul>
          </div>
          {venue.lat && venue.lng && (
            <iframe
              title="map"
              className="h-56 w-full rounded-2xl border border-slate-200"
              loading="lazy"
              src={`https://www.google.com/maps?q=${venue.lat},${venue.lng}&z=15&output=embed`}
            />
          )}
        </aside>
      </div>
    </div>
  );
}