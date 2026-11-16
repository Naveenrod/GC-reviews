"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { StarRating } from "@/components/StarRating";
import type { ReviewReport } from "@/lib/types";

const REASON_LABEL: Record<string, string> = {
  defamation: "False / defamatory",
  fake: "Fake",
  conflict: "Conflict / incentive",
  privacy: "Private info",
  abuse: "Abuse",
  other: "Other",
};

const REL_LABEL: Record<string, string> = {
  venue_owner: "Venue owner",
  subject: "Named in review",
  member: "Member",
  other: "Other",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ReportRow({ report }: { report: ReviewReport }) {
  const supabase = createClient();
  const router = useRouter();
  const [note, setNote] = useState(report.resolution_note ?? "");
  const [busy, setBusy] = useState(false);
  const [now] = useState(() => Date.now());

  const open = report.status === "open";
  const msLeft = new Date(report.due_at).getTime() - now;
  const daysLeft = Math.ceil(msLeft / 86_400_000);
  const overdue = open && msLeft < 0;

  async function resolve(
    status: "actioned" | "dismissed",
    resolution: "removed" | "kept" | "no_review"
  ) {
    setBusy(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (resolution === "removed" && report.review_id) {
      if (!confirm("Delete the reported review? This cannot be undone.")) {
        setBusy(false);
        return;
      }
      const { error } = await supabase.from("reviews").delete().eq("id", report.review_id);
      if (error) {
        alert(`Could not delete review: ${error.message}`);
        setBusy(false);
        return;
      }
    }

    const { error } = await supabase
      .from("review_reports")
      .update({
        status,
        resolution,
        resolution_note: note.trim() || null,
        resolved_by: user?.id ?? null,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", report.id);
    setBusy(false);
    if (error) {
      alert(`Could not update report: ${error.message}`);
      return;
    }
    router.refresh();
  }

  const snap = report.review_snapshot;

  return (
    <div
      className={`rounded-2xl border bg-white p-5 ${
        overdue ? "border-red-300" : open && daysLeft <= 2 ? "border-amber-300" : "border-slate-200"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-700">
          {REASON_LABEL[report.reason] ?? report.reason}
        </span>
        <span className="text-slate-400">{REL_LABEL[report.relationship] ?? report.relationship}</span>
        <span className="ml-auto text-slate-400">Received {fmt(report.created_at)}</span>
        {open ? (
          <span
            className={`rounded-full px-2.5 py-0.5 font-semibold ${
              overdue
                ? "bg-red-100 text-red-700"
                : daysLeft <= 2
                ? "bg-amber-100 text-amber-800"
                : "bg-emerald-100 text-emerald-800"
            }`}
          >
            {overdue ? `Overdue by ${-daysLeft} day${-daysLeft !== 1 ? "s" : ""}` : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`}
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-600">
            {report.status} · {report.resolution}
          </span>
        )}
      </div>

      {snap && (
        <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            {snap.venue_path ? (
              <Link href={snap.venue_path} className="font-semibold text-slate-800 hover:text-brand">
                {snap.venue_name}
              </Link>
            ) : (
              <span className="font-semibold text-slate-800">{snap.venue_name}</span>
            )}
            {typeof snap.rating === "number" && <StarRating value={snap.rating} />}
            <span className="text-slate-500">by {snap.author ?? "Guest"}</span>
            {!report.review_id && (
              <span className="text-xs text-slate-400">(review no longer exists)</span>
            )}
          </div>
          {snap.body && <p className="mt-2 whitespace-pre-wrap text-slate-600">{snap.body}</p>}
        </div>
      )}
      {!snap && report.page_url && (
        <p className="mt-3 text-sm">
          Page:{" "}
          <a href={report.page_url} className="text-brand underline" target="_blank" rel="noopener noreferrer">
            {report.page_url}
          </a>
        </p>
      )}

      <div className="mt-3 text-sm">
        <p className="font-medium text-slate-700">
          {report.reporter_name}{" "}
          <a href={`mailto:${report.reporter_email}`} className="font-normal text-brand underline">
            {report.reporter_email}
          </a>
        </p>
        <p className="mt-1 whitespace-pre-wrap text-slate-600">{report.details}</p>
      </div>

      {open ? (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Decision note (what you checked, why). Kept on record."
            className="w-full rounded-xl border border-slate-300 p-2 text-sm outline-none focus:border-brand"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {report.review_id && (
              <button
                disabled={busy}
                onClick={() => resolve("actioned", "removed")}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Remove review
              </button>
            )}
            <button
              disabled={busy}
              onClick={() => resolve("dismissed", report.review_id ? "kept" : "no_review")}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              Keep review, close report
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-xs text-slate-400">
          Resolved {report.resolved_at ? fmt(report.resolved_at) : ""}
          {report.resolution_note ? ` · ${report.resolution_note}` : ""}
        </p>
      )}
    </div>
  );
}
