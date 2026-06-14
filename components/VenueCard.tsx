import Link from "next/link";
import { MapPin } from "lucide-react";
import type { Venue } from "@/lib/types";
import { StarRating } from "@/components/StarRating";
import { formatRating } from "@/lib/utils";

export function VenueCard({ venue }: { venue: Venue }) {
  const locSlug = venue.location?.slug ?? "";
  const catSlug = venue.category?.slug ?? "";
  const href = `/${locSlug}/${catSlug}/${venue.slug}`;
  const img =
    venue.cover_image_url ||
    venue.photos?.[0] ||
    "/placeholder-venue.svg";

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img}
          alt={venue.name}
          className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-105"
        />
        {venue.category && (
          <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur">
            {venue.category.name}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-semibold text-slate-900 group-hover:text-brand">
          {venue.name}
        </h3>
        {venue.description && (
          <p className="line-clamp-2 text-sm text-slate-500">{venue.description}</p>
        )}
        {venue.address && (
          <p className="flex items-center gap-1 text-sm text-slate-500">
            <MapPin size={14} className="shrink-0" />
            <span className="line-clamp-1">{venue.address}</span>
          </p>
        )}
        <div className="mt-auto flex items-center gap-2 pt-2">
          <StarRating value={venue.avg_rating} />
          <span className="text-sm font-semibold text-slate-700">
            {formatRating(venue.avg_rating)}
          </span>
          <span className="text-sm text-slate-400">
            ({venue.review_count})
          </span>
        </div>
      </div>
    </Link>
  );
}
