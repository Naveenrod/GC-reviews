"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";

// Runs /api/admin/photos in batches until every venue without a photo has been
// checked (including ones that came back empty on an earlier run).
export function PhotoBackfill() {
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<string | null>(null);

  async function run() {
    setRunning(true);
    const before = new Date().toISOString();
    let checked = 0;
    let found = 0;
    let withPhoto = 0;
    try {
      for (let i = 0; i < 200; i++) {
        const res = await fetch("/api/admin/photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ before }),
        });
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        checked += json.checked;
        found += json.found;
        withPhoto = json.withPhoto;
        setLog(`Checked ${checked} websites, found ${found} new photos. ${json.remaining} left…`);
        if (json.remaining === 0 || json.checked === 0) break;
      }
      setLog(
        `Done. Checked ${checked} websites and found ${found} new photos. ${withPhoto} venues now have a free photo.`
      );
    } catch (e) {
      setLog(`Error: ${e instanceof Error ? e.message : String(e)}. Tap the button again to continue.`);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 font-semibold">
            <ImageIcon size={18} className="text-brand" /> Free venue photos
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Find each venue&apos;s photo on its own website. Free, and safe to run again: it retries
            venues that still have no photo.
          </p>
        </div>
        <button
          onClick={run}
          disabled={running}
          className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {running ? "Working…" : "Find website photos"}
        </button>
      </div>
      {log && <p className="mt-3 text-sm text-slate-600">{log}</p>}
    </div>
  );
}
