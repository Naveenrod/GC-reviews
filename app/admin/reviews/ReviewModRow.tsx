"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { StarRating } from "@/components/StarRating";
import { timeAgo } from "@/lib/utils";

export function ReviewModRow({ review }: { review: any }) {
  const supabase = createClient();
  const router = useRouter();

  async function remove() {
    if (!confirm("Delete this review?")) return;
    await supabase.from("reviews").delete().eq("id", review.id);
    router.refresh();
  }

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-800">
            {review.profile?.display_name ?? "Guest"}
          </span>
          <StarRating value={review.rating} />
          <span className="text-xs text-slate-400">{timeAgo(review.created_at)}</span>
        </div>
        <p className="text-sm text-slate-500">on {review.venue?.name}</p>
        {review.body && <p className="mt-2 text-slate-600">{review.body}</p>}
      </div>
      <button
        onClick={remove}
        className="rounded-lg p-2 text-red-500 hover:bg-red-50"
        aria-label="Delete review"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}
