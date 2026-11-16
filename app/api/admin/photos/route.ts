// Admin: find free website photos for venues that don't have one.
// POST { before: ISO timestamp } → processes one batch of venues with no photo
// that haven't been checked since `before` (so a run also retries venues that
// came back empty last time). Call repeatedly until `remaining` is 0.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchOgImage, mapLimit } from "@/lib/og-image";

export const maxDuration = 60;

const BATCH = 24;

export async function POST(req: Request) {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { data: profile } = await sb.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const before = typeof body.before === "string" && !Number.isNaN(Date.parse(body.before))
    ? new Date(body.before).toISOString()
    : new Date().toISOString();
  const pending = `og_checked_at.is.null,og_checked_at.lt.${before}`;

  const { data: venues, error } = await sb
    .from("venues")
    .select("id, website")
    .not("website", "is", null)
    .is("og_image_url", null)
    .or(pending)
    .limit(BATCH);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let found = 0;
  await mapLimit(venues ?? [], 8, async (v) => {
    const og = await fetchOgImage(v.website);
    if (og) found++;
    await sb
      .from("venues")
      .update({ og_image_url: og, og_checked_at: new Date().toISOString() })
      .eq("id", v.id);
  });

  const { count: remaining } = await sb
    .from("venues")
    .select("*", { count: "exact", head: true })
    .not("website", "is", null)
    .is("og_image_url", null)
    .or(pending);

  const { count: withPhoto } = await sb
    .from("venues")
    .select("*", { count: "exact", head: true })
    .or("og_image_url.not.is.null,community_cover_url.not.is.null");

  return NextResponse.json({
    checked: venues?.length ?? 0,
    found,
    remaining: remaining ?? 0,
    withPhoto: withPhoto ?? 0,
  });
}
