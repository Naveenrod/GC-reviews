"use client";

import { useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Venue } from "@/lib/types";

export function VenueAdminRow({ venue }: { venue: Venue }) {
  const supabase = createClient();
  const router = useRouter();
  const [bookingUrl, setBookingUrl] = useState(venue.booking_url ?? "");
  const [description, setDescription] = useState(venue.description ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    await supabase
      .from("venues")
      .update({ booking_url: bookingUrl || null, description: description || null })
      .eq("id", venue.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function remove() {
    if (!confirm(`Delete "${venue.name}"? This also removes its reviews.`)) return;
    await supabase.from("venues").delete().eq("id", venue.id);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{venue.name}</h3>
          <p className="text-sm text-slate-500">
            {venue.category?.name} · {venue.location?.name} · ★ {venue.avg_rating} (
            {venue.review_count})
          </p>
        </div>
        <button
          onClick={remove}
          className="rounded-lg p-2 text-red-500 hover:bg-red-50"
          aria-label="Delete venue"
        >
          <Trash2 size={18} />
        </button>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-600">Booking URL</span>
          <input
            value={bookingUrl}
            onChange={(e) => setBookingUrl(e.target.value)}
            placeholder="https://…"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-600">Description</span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
      >
        <Save size={16} /> {saving ? "Saving…" : saved ? "Saved!" : "Save"}
      </button>
    </div>
  );
}
