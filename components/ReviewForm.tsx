"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PartyPopper, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { StarInput } from "@/components/StarInput";
import { burstConfetti } from "@/lib/confetti";
import type { User } from "@supabase/supabase-js";

const MAX = 1000;

export function ReviewForm({ venueId, venueName }: { venueId: string; venueName: string }) {
  const [supabase] = useState(() => createClient());
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const submitRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!active) return;
      setUser(data.user);
      if (!data.user) return;
      // Prefill the member's existing review so they edit instead of overwriting blind.
      const { data: existing } = await supabase
        .from("reviews")
        .select("id, rating, body")
        .eq("venue_id", venueId)
        .eq("user_id", data.user.id)
        .maybeSingle();
      if (active && existing) {
        setExistingId(existing.id);
        setRating(existing.rating);
        setBody(existing.body ?? "");
      }
    });
    return () => {
      active = false;
    };
  }, [supabase, venueId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || rating === 0) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase.from("reviews").upsert(
      { venue_id: venueId, user_id: user.id, rating, body: body.trim() || null },
      { onConflict: "venue_id,user_id" }
    );
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    const r = submitRef.current?.getBoundingClientRect();
    burstConfetti(r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : undefined);
    setDone(true);
    router.refresh();
  }

  async function remove() {
    if (!existingId || !confirm("Delete your review?")) return;
    setLoading(true);
    await supabase.from("reviews").delete().eq("id", existingId);
    setLoading(false);
    setExistingId(null);
    setRating(0);
    setBody("");
    router.refresh();
  }

  if (user === undefined) {
    return <div className="skeleton h-40 w-full" aria-hidden />;
  }

  if (!user) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/5 via-white to-violet/5 p-6 text-center">
        <span className="float mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-2xl">
          ✨
        </span>
        <p className="text-lg font-semibold text-slate-800">Been to {venueName}?</p>
        <p className="mt-1 text-sm text-slate-500">
          Your review helps locals and visitors find their next favourite spot.
        </p>
        <Link
          href="/auth"
          className="mt-4 inline-block rounded-xl bg-brand px-6 py-2.5 font-semibold text-white shadow-md shadow-brand/30 transition hover:brightness-110"
        >
          Sign in to review
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="anim-zoom-in rounded-2xl border border-brand/30 bg-brand/5 p-6 text-center">
        <PartyPopper className="mx-auto mb-2 text-brand" size={32} />
        <p className="text-lg font-semibold text-slate-800">
          {existingId ? "Review updated. Thanks!" : "You're on the board. Thanks!"}
        </p>
        <p className="mt-1 text-sm text-slate-500">Your words are now helping other explorers.</p>
        <button
          type="button"
          onClick={() => setDone(false)}
          className="mt-4 text-sm font-semibold text-brand hover:underline"
        >
          Edit it again
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{existingId ? "Update your review" : "Write a review"}</h3>
        {existingId && (
          <button
            type="button"
            onClick={remove}
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-red-600"
          >
            <Trash2 size={13} /> Delete
          </button>
        )}
      </div>
      <div className="mt-3">
        <StarInput value={rating} onChange={setRating} />
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value.slice(0, MAX))}
        placeholder="What made it memorable? The food, the view, the service…"
        rows={4}
        className="mt-3 w-full rounded-xl border border-slate-300 p-3 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
      <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
        <span>{body.length === 0 ? "Optional, but the best reviews tell a story." : ""}</span>
        <span className={body.length > MAX * 0.9 ? "text-coral" : ""}>
          {body.length}/{MAX}
        </span>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <button
        ref={submitRef}
        type="submit"
        disabled={loading || rating === 0}
        className="mt-3 rounded-xl bg-brand px-6 py-2.5 font-semibold text-white shadow-md shadow-brand/30 transition hover:bg-brand-dark active:scale-95 disabled:opacity-50 disabled:shadow-none"
      >
        {loading ? "Posting…" : existingId ? "Update review" : "Post review"}
      </button>
    </form>
  );
}
