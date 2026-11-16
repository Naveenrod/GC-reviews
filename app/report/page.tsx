import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ReportForm } from "./ReportForm";
import { StarRating } from "@/components/StarRating";
import { SITE_NAME } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Report a review",
  description: `Report a review on ${SITE_NAME} that you believe is fake, defamatory, abusive or otherwise breaches our Review and Moderation Policy.`,
  alternates: { canonical: "/report" },
  robots: { index: false },
};

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ review?: string }>;
}) {
  const { review: reviewId } = await searchParams;
  const sb = await createClient();

  const [{ data: { user } }, { data: review }] = await Promise.all([
    sb.auth.getUser(),
    reviewId
      ? sb
          .from("reviews")
          .select("id, rating, body, created_at, profile:profiles(display_name), venue:venues(name, slug, category:categories(slug), location:locations(slug))")
          .eq("id", reviewId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  type ReportedReview = {
    id: string;
    rating: number;
    body: string | null;
    created_at: string;
    profile: { display_name: string | null } | null;
    venue: { name: string } | null;
  };
  const r = review as unknown as ReportedReview | null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold">Report a review</h1>
      <p className="mt-3 leading-relaxed text-slate-600">
        Use this form if a review is fake, defamatory, abusive, reveals private information, or
        otherwise breaches our{" "}
        <Link href="/review-policy" className="text-brand underline">
          Review and Moderation Policy
        </Link>
        . We log the date and time of every report, acknowledge it by email, and aim to decide
        within seven days. We do not remove reviews just because they are negative.
      </p>

      {r ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Review being reported
          </p>
          <p className="mt-1 font-semibold text-slate-800">{r.venue?.name}</p>
          <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
            <StarRating value={r.rating} />
            <span>by {r.profile?.display_name ?? "Guest"}</span>
          </div>
          {r.body && <p className="mt-2 text-sm text-slate-600">{r.body}</p>}
        </div>
      ) : reviewId ? (
        <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          We could not find that review. It may already have been removed. You can still describe
          it below.
        </p>
      ) : null}

      <ReportForm
        reviewId={r?.id ?? null}
        defaultName={(user?.user_metadata?.full_name as string) ?? ""}
        defaultEmail={user?.email ?? ""}
      />
    </div>
  );
}
