// Admin: backfill website og:image for venues that have none yet.
// POST {} → processes a batch; call repeatedly until `remaining` is 0.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchOgImage, mapLimit } from "@/lib/og-image";

export const maxDuration = 60;

const BATCH = 20;

export async function POST() {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { data: profile } = await sb.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { data: venues, error } = await sb
    .from("venues")
    .select("id, website")
    .is("og_checked_at", null)
    .not("website", "is", null)
    .limit(BATCH);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { count } = await sb
    .from("venues")
    .select("*", { count: "exact", head: true })
    .is("og_checked_at", null)
    .not("website", "is", null);

  let found = 0;
  await mapLimit(venues ?? [], 6, async (v) => {
    const og = await fetchOgImage(v.website);
    if (og) found++;
    await sb
      .from("venues")
      .update({ og_image_url: og, og_checked_at: new Date().toISOString() })
      .eq("id", v.id);
  });

  const checked = venues?.length ?? 0;
  return NextResponse.json({ checked, found, remaining: Math.max(0, (count ?? 0) - checked) });
}
