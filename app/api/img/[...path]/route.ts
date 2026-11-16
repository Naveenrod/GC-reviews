// Serves venue photos we host in Supabase Storage. Vercel's CDN caches each
// image for a year, so Supabase's free bandwidth is only used on a cache miss.
import { NextResponse } from "next/server";
import { VENUE_BUCKET } from "@/lib/host-photo";

const PATH = /^venues\/[A-Za-z0-9-]{1,64}\.jpg$/;

export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const key = path.join("/");
  if (!PATH.test(key)) return new NextResponse(null, { status: 404 });

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${VENUE_BUCKET}/${key}`,
    { cache: "no-store" }
  ).catch(() => null);
  if (!res || !res.ok) {
    return new NextResponse(null, { status: 404, headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } });
  }
  return new NextResponse(await res.arrayBuffer(), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=604800, s-maxage=31536000, immutable",
    },
  });
}
