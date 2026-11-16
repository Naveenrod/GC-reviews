// Admin: free venue photos, in two passes (call each repeatedly until done).
//
// POST { mode: "find", before }  — look for a photo on the website of venues that
//   have none and haven't been checked since `before`; any photo found is copied
//   onto our own storage straight away.
// POST { mode: "host", after }   — copy photos that are still linked from the
//   venue's site onto our storage. `after` is a cursor (last venue id handled).
import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { fetchOgImage, mapLimit } from "@/lib/og-image";
import { hostVenuePhoto, resolveVenuePhoto } from "@/lib/host-photo";

export const maxDuration = 60;

const FIND_BATCH = 16;
const HOST_BATCH = 16;

export async function POST(req: Request) {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { data: profile } = await sb.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const svc = createServiceClient();
  const body = await req.json().catch(() => ({}));

  if (body.mode === "host") {
    const after = typeof body.after === "string" ? body.after : "";
    let q = svc
      .from("venues")
      .select("id, og_image_url")
      .not("og_image_url", "is", null)
      .not("og_image_url", "like", "/api/img/%")
      .order("id")
      .limit(HOST_BATCH);
    if (after) q = q.gt("id", after);
    const { data: venues, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    let copied = 0;
    let dropped = 0;
    await mapLimit(venues ?? [], 6, async (v) => {
      const r = await hostVenuePhoto(svc, v.id, v.og_image_url!);
      if (r.ok) {
        copied++;
        await svc.from("venues").update({ og_image_url: r.path }).eq("id", v.id);
      } else if (r.reason === "too-small" || r.reason === "not-image") {
        dropped++;
        await svc.from("venues").update({ og_image_url: null }).eq("id", v.id);
      }
    });
    const list = venues ?? [];
    return NextResponse.json({
      handled: list.length,
      copied,
      dropped,
      next: list.length ? list[list.length - 1].id : null,
      done: list.length < HOST_BATCH,
    });
  }

  // mode: "find" (default)
  const before =
    typeof body.before === "string" && !Number.isNaN(Date.parse(body.before))
      ? new Date(body.before).toISOString()
      : new Date().toISOString();
  const pending = `og_checked_at.is.null,og_checked_at.lt.${before}`;

  const { data: venues, error } = await svc
    .from("venues")
    .select("id, website")
    .not("website", "is", null)
    .is("og_image_url", null)
    .or(pending)
    .limit(FIND_BATCH);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let found = 0;
  await mapLimit(venues ?? [], 8, async (v) => {
    const photo = await resolveVenuePhoto(svc, v.id, await fetchOgImage(v.website));
    if (photo) found++;
    await svc
      .from("venues")
      .update({ og_image_url: photo, og_checked_at: new Date().toISOString() })
      .eq("id", v.id);
  });

  const { count: remaining } = await svc
    .from("venues")
    .select("*", { count: "exact", head: true })
    .not("website", "is", null)
    .is("og_image_url", null)
    .or(pending);

  const { count: withPhoto } = await svc
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
