import Link from "next/link";
import { MapPin, Sparkles, Flame } from "lucide-react";
import type { Venue } from "@/lib/types";
import { StarRating } from "@/components/StarRating";
import { TiltCard } from "@/components/fx/TiltCard";
import { formatRating } from "@/lib/utils";
import { SmartImage } from "@/components/SmartImage";
import { venueCover, venueFallback, placeholderFor } from "@/lib/photos";

function isNew(iso: string) {
  return Date.now() - new Date(iso).getTime() < 14 * 86_400_000;
}

export function VenueCard({
  venue,
  rank,
  priority = false,
}: {
  venue: Venue;
  rank?: number;
  priority?: boolean;
}) {
  const locSlug = venue.location?.slug ?? "";
  const catSlug = venue.category?.slug ?? "";
  const href = `/${locSlug}/${catSlug}/${venue.slug}`;
  const hot = venue.avg_rating >= 4.7;
  const fresh = isNew(venue.created_at);

  return (
    <TiltCard className="h-full">
      <Link
        href={href}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white"
      >
        <div className="img-shimmer relative aspect-[4/3] overflow-hidden">
          <SmartImage
            sources={[venueCover(venue, 600), venueFallback(venue), placeholderFor(venue)]}
            alt={venue.name}
            loading={priority ? "eager" : "lazy"}
            className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-out group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/0 to-transparent opacity-80 transition group-hover:opacity-95" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {venue.category && (
              <span className="glass rounded-full px-2.5 py-1 text-[11px] font-semibold text-slate-800">
                {venue.category.name}
              </span>
            )}
            {hot && (
              <span className="inline-flex items-center gap-1 rounded-full bg-coral px-2.5 py-1 text-[11px] font-semibold text-white">
                <Flame size={11} /> Loved
              </span>
            )}
            {fresh && !hot && (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet px-2.5 py-1 text-[11px] font-semibold text-white">
                <Sparkles size={11} /> New
              </span>
            )}
          </div>
          {rank && (
            <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/80 text-sm font-bold text-white backdrop-blur">
              {rank}
            </span>
          )}
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
            <h3 className="text-lg font-bold leading-tight drop-shadow-md">{venue.name}</h3>
            <span className="glass ml-2 shrink-0 rounded-lg px-2 py-1 text-sm font-bold text-slate-900">
              {formatRating(venue.avg_rating)}
            </span>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-4">
          {venue.description && (
            <p className="line-clamp-2 text-sm text-slate-600">{venue.description}</p>
          )}
          {venue.address && (
            <p className="flex items-center gap-1 text-xs text-slate-500">
              <MapPin size={13} className="shrink-0 text-brand" />
              <span className="line-clamp-1">{venue.address}</span>
            </p>
          )}
          <div className="mt-auto flex items-center gap-2 pt-2">
            <StarRating value={venue.avg_rating} />
            {/* ACCC guidance: always show how many reviews sit behind a rating. */}
            {venue.review_count > 0 ? (
              <span className="whitespace-nowrap text-xs text-slate-500">
                {venue.review_count} member review{venue.review_count !== 1 ? "s" : ""}
              </span>
            ) : (
              <span className="whitespace-nowrap text-xs text-slate-400">No member reviews yet</span>
            )}
            {venue.google_rating != null && (
              <span className="ml-auto whitespace-nowrap text-[11px] text-slate-400">
                {venue.google_rating.toFixed(1)} on Google
              </span>
            )}
          </div>
        </div>
      </Link>
    </TiltCard>
  );
}
