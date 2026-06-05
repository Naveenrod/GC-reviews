export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { User as UserIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StarRating } from "@/components/StarRating";
import { timeAgo } from "@/lib/utils";

export default async function ProfilePage() {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/auth?next=/profile");

  const { data: profile } = await sb
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: reviews } = await sb
    .from("reviews")
    .select("*, venue:venues(name, slug, category:categories(slug), location:locations(slug))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-brand">
          <UserIcon size={28} />
        </span>
        <div>
          <h1 className="text-2xl font-bold">
            {profile?.display_name ?? "Your profile"}
          </h1>
          <p className="text-slate-500">{user.email}</p>
        </div>
      </div>

      <h2 className="mt-10 mb-4 text-xl font-bold">
        My reviews ({reviews?.length ?? 0})
      </h2>
      <div className="space-y-3">
        {(reviews ?? []).map((r: any) => {
          const href = `/${r.venue?.location?.slug}/${r.venue?.category?.slug}/${r.venue?.slug}`;
          return (
            <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2">
                <Link href={href} className="font-semibold hover:text-brand">
                  {r.venue?.name}
                </Link>
                <StarRating value={r.rating} />
                <span className="text-xs text-slate-400">{timeAgo(r.created_at)}</span>
              </div>
              {r.body && <p className="mt-2 text-slate-600">{r.body}</p>}
            </div>
          );
        })}
        {(!reviews || reviews.length === 0) && (
          <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
            You haven&apos;t written any reviews yet.
          </p>
        )}
      </div>
    </div>
  );
}