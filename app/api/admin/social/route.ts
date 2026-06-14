import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  setConfig,
  checkConnection,
  runInstagramPost,
} from "@/lib/instagram";

async function assertAdmin() {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return false;
  const { data: profile } = await sb
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  return !!profile?.is_admin;
}

// POST { action: "save", ig_business_account_id, ig_access_token, fb_app_id?, fb_app_secret? }
//      { action: "test" }   — check connection
//      { action: "post" }   — post the next venue now
export async function POST(req: Request) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();

  if (body.action === "save") {
    const entries: Record<string, string> = {
      ig_business_account_id: (body.ig_business_account_id ?? "").trim(),
      ig_access_token: (body.ig_access_token ?? "").trim(),
      ig_token_updated_at: new Date().toISOString(),
    };
    if (body.fb_app_id) entries.fb_app_id = body.fb_app_id.trim();
    if (body.fb_app_secret) entries.fb_app_secret = body.fb_app_secret.trim();
    await setConfig(entries);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "test") {
    const result = await checkConnection();
    return NextResponse.json(result);
  }

  if (body.action === "post") {
    const result = await runInstagramPost();
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
