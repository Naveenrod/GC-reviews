"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PartyPopper, Trash2, ImagePlus, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { StarInput } from "@/components/StarInput";
import { burstConfetti } from "@/lib/confetti";
import { resizeImage } from "@/lib/resize-image";
import { MIN_AGE } from "@/lib/site";
import type { User } from "@supabase/supabase-js";

const MAX = 1000;
const MAX_PHOTOS = 4;
const BUCKET = "review-photos";

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
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
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
        .select("id, rating, body, photos")
        .eq("venue_id", venueId)
        .eq("user_id", data.user.id)
        .maybeSingle();
      if (active && existing) {
        setExistingId(existing.id);
        setRating(existing.rating);
        setBody(existing.body ?? "");
        setPhotos(existing.photos ?? []);
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
      { venue_id: venueId, user_id: user.id, rating, body: body.trim() || null, photos },
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

  async function addPhotos(files: FileList | null) {
    if (!user || !files?.length) return;
    const room = MAX_PHOTOS - photos.length;
    const picked = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, room);
    if (picked.length === 0) return;
    setError(null);
    setUploading((n) => n + picked.length);
    const urls = await Promise.all(
      picked.map(async (file) => {
        try {
          const blob = await resizeImage(file);
          const path = `${venueId}/${user.id}/${crypto.randomUUID()}.jpg`;
          const { error } = await supabase.storage
            .from(BUCKET)
            .upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000" });
          if (error) throw error;
          return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
        } catch (e) {
          setError(e instanceof Error ? `Photo upload failed: ${e.message}` : "Photo upload failed");
          return null;
        } finally {
          setUploading((n) => n - 1);
        }
      })
    );
    setPhotos((p) => [...p, ...urls.filter((u): u is string => !!u)].slice(0, MAX_PHOTOS));
    if (fileRef.current) fileRef.current.value = "";
  }

  async function removePhoto(url: string) {
    setPhotos((p) => p.filter((u) => u !== url));
    const marker = `/${BUCKET}/`;
    const i = url.indexOf(marker);
    if (i >= 0) await supabase.storage.from(BUCKET).remove([url.slice(i + marker.length)]);
  }

  async function remove() {
    if (!existingId || !confirm("Delete your review?")) return;
    setLoading(true);
    await supabase.from("reviews").delete().eq("id", existingId);
    setLoading(false);
    setExistingId(null);
    setRating(0);
    setBody("");
    setPhotos([]);
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
          Your review helps locals and visitors find their next favourite spot. You must be{" "}
          {MIN_AGE} or older to post.
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
      <div className="mt-3">
        <div className="flex flex-wrap gap-2">
          {photos.map((url) => (
            <div key={url} className="group relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(url)}
                aria-label="Remove photo"
                className="absolute right-1 top-1 rounded-full bg-slate-900/70 p-1 text-white opacity-90 transition hover:bg-red-600"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          {Array.from({ length: uploading }).map((_, i) => (
            <div key={`u${i}`} className="skeleton flex h-20 w-20 items-center justify-center">
              <Loader2 size={18} className="animate-spin text-slate-400" />
            </div>
          ))}
          {photos.length + uploading < MAX_PHOTOS && (
            <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 text-xs text-slate-500 transition hover:border-brand hover:text-brand">
              <ImagePlus size={20} />
              Add photo
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="sr-only"
                onChange={(e) => addPhotos(e.target.files)}
              />
            </label>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Your photos help others see the real place. Up to {MAX_PHOTOS}.
        </p>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <p className="mt-3 text-xs text-slate-500">
        By posting you confirm you are {MIN_AGE} or older, that this reflects your own genuine
        experience, and you agree to our{" "}
        <Link href="/terms" className="underline hover:text-brand">Terms of Use</Link> and{" "}
        <Link href="/review-policy" className="underline hover:text-brand">Review Policy</Link>,
        including the licence you grant us to publish your review and photos.
      </p>
      <button
        ref={submitRef}
        type="submit"
        disabled={loading || rating === 0 || uploading > 0}
        className="mt-3 rounded-xl bg-brand px-6 py-2.5 font-semibold text-white shadow-md shadow-brand/30 transition hover:bg-brand-dark active:scale-95 disabled:opacity-50 disabled:shadow-none"
      >
        {loading ? "Posting…" : existingId ? "Update review" : "Post review"}
      </button>
    </form>
  );
}
