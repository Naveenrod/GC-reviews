import { NextResponse } from "next/server";
import { runInstagramPost } from "@/lib/instagram";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Triggered by Vercel Cron (see vercel.json). Vercel attaches
// `Authorization: Bearer ${CRON_SECRET}` when CRON_SECRET is set.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await runInstagramPost();
  const status = result.ok ? 200 : 500;
  return NextResponse.json(result, { status });
}
