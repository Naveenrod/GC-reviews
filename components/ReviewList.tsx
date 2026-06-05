import { User as UserIcon } from "lucide-react";
import type { Review } from "@/lib/types";
import { StarRating } from "@/components/StarRating";
import { timeAgo } from "@/lib/utils";

export function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
        No reviews yet. Be the first to share your experience!
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
        </div>
      ))}
    </div>
  );
}
