import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const REASONS = new Set(["defamation", "fake", "privacy", "abuse", "conflict", "other"]);
const RELATIONSHIPS = new Set(["venue_owner", "subject", "member", "other"]);

// Public endpoint: anyone (signed in or not) can lodge a report about a review.
// Writes happen with the service role so anonymous users need no table access.
// Every report is stamped with created_at and a due_at seven days later: the window
// in which a digital intermediary must remove or block access to retain the
// Defamation Act (Qld) exemption after a valid complaint.
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Honeypot filled in: silently accept so bots learn nothing.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ id: "00000000", dueAt: new Date().toISOString() });
  }

  const name = String(body.name ?? "").trim().slice(0, 120);
  const email = String(body.email ?? "").trim().toLowerCase().slice(0, 254);
  const details = String(body.details ?? "").trim().slice(0, 5000);
  const reason = String(body.reason ?? "");
  const relationship = String(body.relationship ?? "other");
  const pageUrl = body.pageUrl ? String(body.pageUrl).slice(0, 1000) : null;
  const reviewId = body.reviewId ? String(body.reviewId) : null;

  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "A valid name and email are required." }, { status: 400 });
  }
  if (details.length < 20) {
    return NextResponse.json({ error: "Please give us at least a sentence of detail." }, { status: 400 });
  }
  if (!REASONS.has(reason) || !RELATIONSHIPS.has(relationship)) {
    return NextResponse.json({ error: "Invalid reason." }, { status: 400 });
  }
  if (!reviewId && !pageUrl) {
    return NextResponse.json({ error: "Tell us which review this is about." }, { status: 400 });
  }

  // Who is reporting, if signed in.
  const userClient = await createClient();
  const {
    data: { user },
  } = await userClient.auth.getUser();

  const sb = createServiceClient();

  // Snapshot the review so the record is meaningful even after the review is deleted.
  let snapshot: Record<string, unknown> | null = null;
  if (reviewId) {
    const { data: r } = await sb
      .from("reviews")
      .select("id, rating, body, created_at, user_id, profile:profiles(display_name), venue:venues(name, slug, category:categories(slug), location:locations(slug))")
      .eq("id", reviewId)
      .maybeSingle();
    if (r) {
      type Slug = { slug?: string } | null;
      const v = r.venue as unknown as
        | { name?: string; slug?: string; category?: Slug; location?: Slug }
        | null;
      const p = r.profile as unknown as { display_name?: string } | null;
      snapshot = {
        rating: r.rating,
        body: r.body,
        posted_at: r.created_at,
        author: p?.display_name ?? "Guest",
        author_user_id: r.user_id,
        venue_name: v?.name,
        venue_path: v ? `/${v.location?.slug}/${v.category?.slug}/${v.slug}` : null,
      };
    }
  }

  // Rate limit: at most 5 open reports per email per day.
  const since = new Date(Date.now() - 86_400_000).toISOString();
  const { count } = await sb
    .from("review_reports")
    .select("id", { count: "exact", head: true })
    .eq("reporter_email", email)
    .gte("created_at", since);
  if ((count ?? 0) >= 5) {
    return NextResponse.json(
      { error: "You have sent several reports today. Please wait before sending more." },
      { status: 429 }
    );
  }

  const { data, error } = await sb
    .from("review_reports")
    .insert({
      review_id: snapshot ? reviewId : null,
      review_snapshot: snapshot,
      reporter_user_id: user?.id ?? null,
      reporter_name: name,
      reporter_email: email,
      relationship,
      reason,
      details,
      page_url: pageUrl,
    })
    .select("id, due_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Could not save your report. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, dueAt: data.due_at });
}
