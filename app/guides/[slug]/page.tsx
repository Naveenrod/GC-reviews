export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, ChevronRight, CalendarCheck } from "lucide-react";
import { getGuideBySlug } from "@/lib/guides";
import { getVenues } from "@/lib/queries";
import { StarRating } from "@/components/StarRating";
import { ItemListJsonLd, BreadcrumbJsonLd } from "@/components/JsonLd";
import { formatRating } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getGuideBySlug(slug);
  if (!guide) return { title: "Guide not found" };
  return {
    title: guide.metaTitle,
    description: guide.metaDescription,
    alternates: { canonical: `/guides/${guide.slug}` },
    openGraph: {
      title: guide.metaTitle,
      description: guide.metaDescription,
      type: "article",
    },
  };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = await getGuideBySlug(slug);
  if (!guide) notFound();

  const venues = await getVenues({
    locationSlug: guide.location.slug,
    categorySlug: guide.category.slug,
    orderBy: "rating",
    limit: 20,
  });

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <ItemListJsonLd name={guide.title} venues={venues} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Guides", path: "/guides" },
          { name: guide.title, path: `/guides/${guide.slug}` },
        ]}
      />

      <nav className="mb-4 flex items-center gap-1 text-sm text-slate-500">
        <Link href="/guides" className="hover:text-brand">Guides</Link>
        <ChevronRight size={14} />
        <span className="text-slate-700">{guide.title}</span>
      </nav>

      <h1 className="text-3xl font-bold sm:text-4xl">{guide.title}</h1>
      <p className="mt-3 leading-relaxed text-slate-600">
        Looking for the best {guide.category.name.toLowerCase()} in{" "}
        {guide.location.name}? We&apos;ve ranked the top {venues.length} spots
        based on real reviews and ratings from the GC Reviews community. Each
        pick links through to full details, reviews and booking.
      </p>

      {venues.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
          We&apos;re still gathering the best {guide.category.name.toLowerCase()} in{" "}
          {guide.location.name}. Check back soon!
        </p>
      ) : (
        <ol className="mt-8 space-y-5">
          {venues.map((v, i) => {
            const href = `/${v.location?.slug}/${v.category?.slug}/${v.slug}`;
            const img = v.cover_image_url || v.photos?.[0] || "/placeholder-venue.svg";
            const bookingUrl = v.booking_url || v.website;
            return (
              <li
                key={v.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <div className="flex flex-col sm:flex-row">
                  <Link href={href} className="relative block sm:w-56">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt={v.name}
                      className="h-44 w-full object-cover sm:h-full"
                    />
                  </Link>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                        {i + 1}
                      </span>
                      <div>
                        <Link
                          href={href}
                          className="text-lg font-semibold hover:text-brand"
                        >
                          {v.name}
                        </Link>
                        {v.address && (
                          <p className="flex items-center gap-1 text-sm text-slate-500">
                            <MapPin size={13} /> {v.address}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <StarRating value={v.avg_rating} />
                      <span className="text-sm font-semibold text-slate-700">
                        {formatRating(v.avg_rating)}
                      </span>
                      <span className="text-sm text-slate-400">
                        ({v.review_count})
                      </span>
                    </div>
                    {v.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                        {v.description}
                      </p>
                    )}
                    <div className="mt-auto flex gap-2 pt-3">
                      <Link
                        href={href}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
                      >
                        View &amp; reviews
                      </Link>
                      {bookingUrl && (
                        <a
                          href={bookingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:brightness-95"
                        >
                          <CalendarCheck size={15} /> Book
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </article>
  );
}
