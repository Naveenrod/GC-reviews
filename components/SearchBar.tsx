"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Category, Location } from "@/lib/types";

export function SearchBar({
  locations,
  categories,
  defaultQuery,
  defaultLocation,
  defaultCategory,
}: {
  locations: Location[];
  categories: Category[];
  defaultQuery?: string;
  defaultLocation?: string;
  defaultCategory?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(defaultQuery ?? "");
  const [location, setLocation] = useState(defaultLocation ?? "");
  const [category, setCategory] = useState(defaultCategory ?? "");

  // Keep dropdowns in sync when sidebar filters change the URL
  useEffect(() => { setLocation(defaultLocation ?? ""); }, [defaultLocation]);
  useEffect(() => { setCategory(defaultCategory ?? ""); }, [defaultCategory]);
  useEffect(() => { setQ(defaultQuery ?? ""); }, [defaultQuery]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (location) params.set("location", location);
    if (category) params.set("category", category);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <form
      onSubmit={submit}
      className="flex w-full flex-col gap-2 rounded-2xl bg-white p-2 shadow-xl sm:flex-row sm:items-center"
    >
      <div className="flex flex-1 items-center gap-2 px-3">
        <Search size={20} className="shrink-0 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="What are you looking for? (e.g. seafood, rooftop bar)"
          className="w-full py-3 text-slate-800 outline-none placeholder:text-slate-400"
        />
      </div>
      <select
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-slate-700 outline-none"
      >
        <option value="">All locations</option>
        {locations.map((l) => (
          <option key={l.id} value={l.slug}>
            {l.name}
          </option>
        ))}
      </select>
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-slate-700 outline-none"
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-xl bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-dark"
      >
        Search
      </button>
    </form>
  );
}
