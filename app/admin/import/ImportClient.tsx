"use client";

import { useState } from "react";
import { Star, Check } from "lucide-react";
import type { Category, Location } from "@/lib/types";

type PlaceResult = {
  google_place_id: string;
  name: string;
  address: string | null;
  website: string | null;
  google_rating: number | null;
  photos: string[];
};

export function ImportClient({
  locations,
  categories,
}: {
  locations: Location[];
  categories: Category[];
}) {
  const [locationSlug, setLocationSlug] = useState(locations[0]?.slug ?? "");
  const [categorySlug, setCategorySlug] = useState(categories[0]?.slug ?? "");
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function search() {
    setLoading(true);
    setStatus(null);
    setResults([]);
    const res = await fetch("/api/admin/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "search", locationSlug, categorySlug, keyword }),
    });
    const json = await res.json();
    setLoading(false);
    if (json.error) {
      setStatus(`Error: ${json.error}`);
    } else {
      setResults(json.results);
      setSelected(new Set(json.results.map((r: PlaceResult) => r.google_place_id)));
    }
  }

  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  async function importSelected() {
    setLoading(true);
    setStatus(null);
    const places = results.filter((r) => selected.has(r.google_place_id));
    const res = await fetch("/api/admin/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "import", locationSlug, categorySlug, places }),
    });
    const json = await res.json();
    setLoading(false);
    setStatus(json.error ? `Error: ${json.error}` : `Imported ${json.imported} venues.`);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <label className="flex flex-col text-sm">
          <span className="mb-1 font-medium text-slate-600">Location</span>
          <select
            value={locationSlug}
            onChange={(e) => setLocationSlug(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2"
          >
            {locations.map((l) => (
              <option key={l.id} value={l.slug}>{l.name}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-sm">
          <span className="mb-1 font-medium text-slate-600">Category</span>
          <select
            value={categorySlug}
            onChange={(e) => setCategorySlug(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-1 flex-col text-sm">
          <span className="mb-1 font-medium text-slate-600">Keyword (optional)</span>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="e.g. seafood, rooftop bar"
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <button
          onClick={search}
          disabled={loading}
          className="rounded-lg bg-brand px-5 py-2 font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {loading ? "Searching…" : "Fetch from Google"}
        </button>
      </div>

      {status && <p className="mt-4 text-sm font-medium text-slate-700">{status}</p>}

      {results.length > 0 && (
        <>
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {selected.size} of {results.length} selected
            </p>
            <button
              onClick={importSelected}
              disabled={loading || selected.size === 0}
              className="rounded-lg bg-accent px-5 py-2 font-semibold text-white hover:brightness-95 disabled:opacity-50"
            >
              Import selected
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {results.map((r) => {
              const on = selected.has(r.google_place_id);
              return (
                <button
                  key={r.google_place_id}
                  onClick={() => toggle(r.google_place_id)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                    on ? "border-brand bg-brand/5" : "border-slate-200 bg-white"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
                      on ? "border-brand bg-brand text-white" : "border-slate-300"
                    }`}
                  >
                    {on && <Check size={16} />}
                  </span>
                  {r.photos[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.photos[0]} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-800">{r.name}</p>
                    <p className="truncate text-sm text-slate-500">{r.address}</p>
                  </div>
                  {r.google_rating != null && (
                    <span className="flex items-center gap-1 text-sm text-slate-600">
                      <Star size={14} className="fill-accent text-accent" />
                      {r.google_rating}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
