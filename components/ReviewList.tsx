import Link from "next/link";
import { User as UserIcon, Flag } from "lucide-react";
import type { Review } from "@/lib/types";
import { StarRating } from "@/components/StarRating";
import { timeAgo } from "@/lib/utils";

export function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
        No member reviews yet — be the first!
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((r) => (
        <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-brand">
              {r.profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.profile.avatar_url}
                  alt=""
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <UserIcon size={18} />
              )}
            </span>
            <div>
              <p className="font-medium text-slate-800">
                {r.profile?.display_name ?? "Guest"}
              </p>
              <p className="text-xs text-slate-400">{timeAgo(r.created_at)}</p>
            </div>
            <div className="ml-auto">
              <StarRating value={r.rating} />
            </div>
          </div>
          {r.body && <p className="mt-3 text-slate-600">{r.body}</p>}
          {r.photos && r.photos.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {r.photos.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block h-24 w-24 overflow-hidden rounded-xl border border-slate-200 transition hover:scale-105"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Photo from ${r.profile?.display_name ?? "a member"}`} loading="lazy" className="h-full w-full object-cover" />
                </a>
              ))}
            </div>
          )}
          {/* Complaints mechanism: every review can be reported. See /review-policy. */}
          <div className="mt-3 flex justify-end">
            <Link
              href={`/report?review=${r.id}`}
              rel="nofollow"
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-red-600"
            >
              <Flag size={12} /> Report this review
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
