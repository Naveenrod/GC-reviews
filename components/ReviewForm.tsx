"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { StarInput } from "@/components/StarRating";
import type { User } from "@supabase/supabase-js";

export function ReviewForm({ venueId }: { venueId: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || rating === 0) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase.from("reviews").upsert(
      {
        venue_id: venueId,
        user_id: user.id,
        rating,
        body: body.trim() || null,
      },
      { onConflict: "venue_id,user_id" }
    );
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setRating(0);
      setBody("");
      router.refresh();
    }
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
        <p className="text-slate-600">
          <Link href="/auth" className="font-semibold text-brand hover:underline">
            Sign in
          </Link>{" "}
          to write a review.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="mb-3 font-semibold">Write a review</h3>
      <StarInput value={rating} onChange={setRating} />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share details of your experience…"
        rows={4}
        className="mt-3 w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-brand"
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading || rating === 0}
        className="mt-3 rounded-xl bg-brand px-6 py-2.5 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
      >
        {loading ? "Posting…" : "Post review"}
      </button>
    </form>
  );
}
