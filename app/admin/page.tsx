export const dynamic = "force-dynamic";

import Link from "next/link";
import { Download, Store, MessageSquare, Camera } from "lucide-react";
import { requireAdmin } from "@/lib/admin";

export default async function AdminDashboard() {
  const { supabase } = await requireAdmin();

  const [{ count: venueCount }, { count: reviewCount }, { count: postCount }] =
    await Promise.all([
      supabase.from("venues").select("*", { count: "exact", head: true }),
      supabase.from("reviews").select("*", { count: "exact", head: true }),
      supabase.from("social_posts").select("*", { count: "exact", head: true }),
    ]);

  const cards = [
    {
      href: "/admin/import",
      icon: <Download size={22} />,
      title: "Import venues",
      desc: "Pull listings from Google Places",
    },
    {
      href: "/admin/venues",
      icon: <Store size={22} />,
      title: "Manage venues",
      desc: `${venueCount ?? 0} venues`,
    },
    {
      href: "/admin/reviews",
      icon: <MessageSquare size={22} />,
      title: "Moderate reviews",
      desc: `${reviewCount ?? 0} reviews`,
    },
    {
      href: "/admin/social",
      icon: <Camera size={22} />,
      title: "Instagram posting",
      desc: `${postCount ?? 0} posts`,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-md"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
              {c.icon}
            </span>
            <h3 className="mt-3 font-semibold">{c.title}</h3>
            <p className="text-sm text-slate-500">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}