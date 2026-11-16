// Monthly job. Makes NO Google API calls (they cost money).
// It only looks for free photos on venue websites:
//   - venues never checked, then
//   - venues checked more than 30 days ago that had no photo (sites change).
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchOgImage, mapLimit } from "@/lib/og-image";

export const maxDuration = 300;

const PER_RUN = 400;

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const monthAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const { data: venues, error } = await sb
    .from("venues")
    .select("id, website")
    .not("website", "is", null)
    .is("og_image_url", null)
    .or(`og_checked_at.is.null,og_checked_at.lt.${monthAgo}`)
    .order("og_checked_at", { ascending: true, nullsFirst: true })
    .limit(PER_RUN);
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

  return NextResponse.json({ checked: venues?.length ?? 0, found });
}
