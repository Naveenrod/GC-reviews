export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Globe,
  CalendarCheck,
  ChevronRight,
  Shuffle,
  Navigation,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getVenueBySlug } from "@/lib/queries";
import { StarRating } from "@/components/StarRating";
import { ReviewList } from "@/components/ReviewList";
import { ReviewForm } from "@/components/ReviewForm";
import { Gallery } from "@/components/Gallery";
import { RatingBreakdown } from "@/components/RatingBreakdown";
import { ShareButton } from "@/components/fx/ShareButton";
import { Reveal } from "@/components/fx/Reveal";
import { VenueJsonLd, BreadcrumbJsonLd } from "@/components/JsonLd";
import { formatRating } from "@/lib/utils";
import { venueCover, venueGallery, placeholderFor, absoluteUrl } from "@/lib/photos";
import { getBaseUrl } from "@/lib/site";
import type { Review } from "@/lib/types";

type GoogleReview = {
  id: string;
  author_name: string;
  author_photo: string | null;
  author_url: string | null;
  rating: number;
  text: string | null;
  published_at: string | null;
};

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
  const image = absoluteUrl(getBaseUrl(), venueCover(venue, 1200));

  return {
    title,
    description,
    alternates: { canonical: `/${location}/${category}/${slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: image }],
    },
  };
}

export default async function VenuePage({
  params,
  searchParams,
}: {
  params: Promise<{ location: string; category: string; slug: string }>;
  searchParams: Promise<{ surprise?: string }>;
}) {
  const [{ location, category, slug }, sp] = await Promise.all([params, searchParams]);
  const venue = await getVenueBySlug(location, category, slug);
  if (!venue) notFound();

  const sb = await createClient();
  const [{ data: reviews }, { data: googleReviews }] = await Promise.all([
    sb
      .from("reviews")
      .select("*, profile:profiles(*)")
      .eq("venue_id", venue.id)
      .order("created_at", { ascending: false }),
    sb
      .from("google_reviews")
      .select("*")
      .eq("venue_id", venue.id)
      .order("published_at", { ascending: false }),
  ]);


  const bookingUrl = venue.booking_url || venue.website;
  const reviewList = (reviews as Review[]) ?? [];
  const communityPhotos = reviewList.flatMap((r) => r.photos ?? []);
  const gallery = venueGallery(venue, communityPhotos);
  const credits: Record<string, string> = {};
  if (venue.og_image_url) credits[venue.og_image_url] = "From the venue's website";
  for (const r of reviewList)
    for (const ph of r.photos ?? []) credits[ph] = `Photo by ${r.profile?.display_name ?? "a member"}`;
  for (const g of gallery) if (g.startsWith("/api/photo/")) credits[g] = "Photo via Google";
  const gReviews = (googleReviews as GoogleReview[]) ?? [];
  const allRatings = [...reviewList.map((r) => r.rating), ...gReviews.map((r) => r.rating)];
  const mapsUrl =
    venue.lat && venue.lng
      ? `https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}`
      : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-28 sm:pb-8">
      <VenueJsonLd venue={venue} reviews={reviewList} image={absoluteUrl(getBaseUrl(), venueCover(venue, 1200))} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: venue.location?.name ?? "", path: `/${location}` },
          { name: venue.category?.name ?? "", path: `/${location}/${category}` },
          { name: venue.name, path: `/${location}/${category}/${slug}` },
        ]}
      />

      {sp.surprise && (
        <div className="anim-zoom-in mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-brand to-violet px-4 py-3 text-sm text-white shadow-lg">
          <span className="inline-flex items-center gap-2 font-medium">
            <Sparkles size={16} /> The dice landed on {venue.name}. Not feeling it?
          </span>
          <Link
            href="/random"
            prefetch={false}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 font-semibold backdrop-blur transition hover:bg-white hover:text-brand-dark"
          >
            <Shuffle size={14} /> Roll again
          </Link>
        </div>
      )}

      {/* breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-sm text-slate-500">
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

      <Gallery photos={gallery} alt={venue.name} fallback={placeholderFor(venue)} credits={credits} />

      {/* header */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="inline-block rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
            {venue.category?.name}
          </span>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{venue.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StarRating value={venue.avg_rating} size={18} />
            <span className="font-semibold text-slate-800">{formatRating(venue.avg_rating)}</span>
            {venue.review_count > 0 && (
              <span className="text-slate-500">
                {venue.review_count} member review{venue.review_count !== 1 ? "s" : ""}
              </span>
            )}
            {gReviews.length > 0 && (
              <span className="text-slate-500">
                {venue.review_count > 0 && <span aria-hidden className="mr-2">·</span>}
                {gReviews.length} Google review{gReviews.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <ShareButton title={venue.name} text={venue.description ?? undefined} />
          {bookingUrl && (
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 font-semibold text-white shadow-md shadow-amber-500/30 transition hover:brightness-105 active:scale-95"
            >
              <CalendarCheck size={18} /> Book Now
            </a>
          )}
        </div>
      </div>

      {/* info + reviews */}
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {venue.description && (
            <p className="mb-6 text-lg leading-relaxed text-slate-600">{venue.description}</p>
          )}

          <h2 className="mb-4 text-xl font-bold">
            Member Reviews
            {venue.review_count > 0 && (
              <span className="ml-2 text-base font-normal text-slate-500">({venue.review_count})</span>
            )}
          </h2>
          <div className="mb-6">
            <ReviewForm venueId={venue.id} venueName={venue.name} />
          </div>
          <ReviewList reviews={reviewList} />

          {gReviews.length > 0 && (
            <div className="mt-10">
              <h2 className="mb-4 text-xl font-bold">
                What Google says
                <span className="ml-2 text-base font-normal text-slate-500">({gReviews.length})</span>
              </h2>
              <div className="space-y-4">
                {gReviews.map((r, i) => (
                  <Reveal key={r.id} delay={(i % 3) * 60}>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-brand/40">
                      <div className="flex items-center gap-3">
                        {r.author_photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={r.author_photo}
                            alt=""
                            loading="lazy"
                            className="h-9 w-9 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                            {r.author_name?.[0] ?? "?"}
                          </span>
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
                              <span className="ml-1">
                                ·{" "}
                                {new Date(r.published_at).toLocaleDateString("en-AU", {
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {r.text && (
                        <p className="mt-3 text-sm leading-relaxed text-slate-600">{r.text}</p>
                      )}
                    </div>
                  </Reveal>
                ))}
              </div>
              <p className="mt-4 text-xs text-slate-500">
                Reviews sourced from{" "}
                <a
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-slate-700"
                >
                  Google Maps
                </a>
              </p>
            </div>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <RatingBreakdown ratings={allRatings} average={venue.avg_rating} />
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
              {mapsUrl && (
                <li className="flex gap-2">
                  <Navigation size={16} className="mt-0.5 shrink-0 text-brand" />
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-brand hover:underline"
                  >
                    Get directions
                  </a>
                </li>
              )}
            </ul>
          </div>
          {venue.lat && venue.lng && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm transition hover:shadow-md">
              <iframe
                title={`Map showing ${venue.name}`}
                className="h-56 w-full"
                loading="lazy"
                src={`https://www.google.com/maps?q=${venue.lat},${venue.lng}&z=15&output=embed`}
              />
            </div>
          )}
        </aside>
      </div>

      {/* sticky mobile action bar */}
      <div className="glass fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 border-t border-slate-200 p-3 sm:hidden">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{venue.name}</p>
          <p className="text-xs text-slate-500">
            ★ {formatRating(venue.avg_rating)}
            {venue.review_count > 0 ? ` · ${venue.review_count} reviews` : ""}
          </p>
        </div>
        <ShareButton title={venue.name} className="px-3" />
        {bookingUrl && (
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white shadow-md"
          >
            <CalendarCheck size={16} /> Book
          </a>
        )}
      </div>
    </div>
  );
}
