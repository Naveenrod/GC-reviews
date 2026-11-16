"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";

async function call(body: Record<string, unknown>) {
  const res = await fetch("/api/admin/photos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({ error: `Server error ${res.status}` }));
  if (json.error) throw new Error(json.error);
  return json;
}

// Step 1: find photos on venue websites (and copy them onto our storage).
// Step 2: copy any photos still linked from venue websites onto our storage.
export function PhotoBackfill() {
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<string | null>(null);

  async function run() {
    setRunning(true);
    try {
      const before = new Date().toISOString();
      let checked = 0;
      let found = 0;
      let withPhoto = 0;
      for (let i = 0; i < 200; i++) {
        const j = await call({ mode: "find", before });
        checked += j.checked;
        found += j.found;
        withPhoto = j.withPhoto;
        setLog(`Step 1 of 2: checked ${checked} websites, found ${found} photos. ${j.remaining} left…`);
        if (j.remaining === 0 || j.checked === 0) break;
      }

      let after: string | null = "";
      let copied = 0;
      for (let i = 0; i < 200 && after !== null; i++) {
        const j = await call({ mode: "host", after });
        copied += j.copied;
        setLog(`Step 2 of 2: copied ${copied} photos onto your site…`);
        after = j.done ? null : j.next;
      }

      setLog(
        `Done. Found ${found} new photos and copied ${copied} existing ones onto your site. ${withPhoto} venues have a free photo.`
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
            Finds each venue&apos;s photo on its own website and copies it onto your site, so it keeps
            working even if their site changes. Free and safe to run again.
          </p>
        </div>
        <button
          onClick={run}
          disabled={running}
          className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {running ? "Working…" : "Find & copy photos"}
        </button>
      </div>
      {log && <p className="mt-3 text-sm text-slate-600">{log}</p>}
    </div>
  );
}
