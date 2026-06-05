export const dynamic = "force-dynamic";

import { requireAdmin } from "@/lib/admin";
import type { Venue } from "@/lib/types";
import { VenueAdminRow } from "./VenueAdminRow";

export default async function AdminVenues() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("venues")
    .select("*, category:categories(*), location:locations(*)")
    .order("created_at", { ascending: false });
  const venues = (data as Venue[]) ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold">Manage venues</h1>
      <p className="mt-1 text-slate-500">
        Edit booking links and descriptions. {venues.length} total.
      </p>
      <div className="mt-6 space-y-3">
        {venues.map((v) => (
          <VenueAdminRow key={v.id} venue={v} />
        ))}
      </div>
    </div>
  );
}