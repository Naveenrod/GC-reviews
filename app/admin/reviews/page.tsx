export const dynamic = "force-dynamic";

import { requireAdmin } from "@/lib/admin";
import { ReviewModRow } from "./ReviewModRow";

export default async function AdminReviews() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("reviews")
    .select("*, profile:profiles(*), venue:venues(name)")
    .order("created_at", { ascending: false })
    .limit(100);

  const reviews = (data as any[]) ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold">Moderate reviews</h1>
      <p className="mt-1 text-slate-500">
        Latest {reviews.length} reviews. Delete anything that breaks the rules.
      </p>
      <div className="mt-6 space-y-3">
        {reviews.map((r) => (
          <ReviewModRow key={r.id} review={r} />
        ))}
      </div>
    </div>
  );
}