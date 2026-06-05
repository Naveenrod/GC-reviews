import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Use in admin pages/route handlers. Redirects non-admins.
export async function requireAdmin() {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/auth?next=/admin");

  const { data: profile } = await sb
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/");
  return { user, supabase: sb };
}
