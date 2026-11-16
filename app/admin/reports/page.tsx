export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { ReportRow } from "./ReportRow";
import type { ReviewReport } from "@/lib/types";

export default async function AdminReports({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { supabase } = await requireAdmin();
  const { show } = await searchParams;
  const showAll = show === "all";

  let q = supabase
    .from("review_reports")
    .select("*")
    .order("due_at", { ascending: true })
    .limit(200);
  if (!showAll) q = q.eq("status", "open");

  const { data } = await q;
  const reports = (data as ReviewReport[]) ?? [];
  // Server component rendered on demand (force-dynamic): reading the clock here is intended.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const overdue = reports.filter((r) => r.status === "open" && new Date(r.due_at).getTime() < now).length;
  const dueSoon = reports.filter((r) => {
    const ms = new Date(r.due_at).getTime() - now;
    return r.status === "open" && ms >= 0 && ms < 2 * 86_400_000;
  }).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Review reports</h1>
          <p className="mt-1 text-slate-500">
            Every report must be decided within 7 days of receipt. See{" "}
            <code className="rounded bg-slate-100 px-1">docs/TAKEDOWN-PROCEDURE.md</code>.
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link
            href="/admin/reports"
            className={`rounded-lg px-3 py-1.5 ${!showAll ? "bg-brand text-white" : "border border-slate-300"}`}
          >
            Open
          </Link>
          <Link
            href="/admin/reports?show=all"
            className={`rounded-lg px-3 py-1.5 ${showAll ? "bg-brand text-white" : "border border-slate-300"}`}
          >
            All
          </Link>
        </div>
      </div>

      {(overdue > 0 || dueSoon > 0) && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {overdue > 0 && <span className="font-semibold">{overdue} overdue. </span>}
          {dueSoon > 0 && <span>{dueSoon} due within 48 hours.</span>}
        </div>
      )}

      {reports.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
          No {showAll ? "" : "open "}reports.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {reports.map((r) => (
            <ReportRow key={r.id} report={r} />
          ))}
        </div>
      )}
    </div>
  );
}
