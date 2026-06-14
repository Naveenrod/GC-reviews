export const dynamic = "force-dynamic";

import { requireAdmin } from "@/lib/admin";
import { getConfig } from "@/lib/instagram";
import { SocialClient } from "./SocialClient";

export default async function AdminSocialPage() {
  const { supabase } = await requireAdmin();
  const cfg = await getConfig();

  const { data: posts } = await supabase
    .from("social_posts")
    .select("*, venue:venues(name)")
    .order("created_at", { ascending: false })
    .limit(30);

  const connected = !!(cfg.ig_business_account_id && cfg.ig_access_token);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold">Instagram auto-posting</h1>
      <p className="mt-1 text-slate-500">
        Connect your Instagram Business account and the site will post a venue
        every day automatically.
      </p>
      <SocialClient
        connected={connected}
        accountId={cfg.ig_business_account_id ?? ""}
        hasAppCreds={!!(cfg.fb_app_id && cfg.fb_app_secret)}
        posts={(posts as any[]) ?? []}
      />
    </div>
  );
}
