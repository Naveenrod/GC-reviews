"use client";

import { Search, MapPin, LayoutGrid, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Category, Location } from "@/lib/types";

const IDEAS = ["rooftop bar", "seafood", "brunch", "live music", "ocean view", "cocktails", "date night"];

function Fields({
  locations,
  categories,
  defaultQuery,
  defaultLocation,
  defaultCategory,
  showIdeas,
}: {
  locations: Location[];
  categories: Category[];
  defaultQuery?: string;
  defaultLocation?: string;
  defaultCategory?: string;
  showIdeas: boolean;
}) {
  const router = useRouter();
  const [q, setQ] = useState(defaultQuery ?? "");
  const [location, setLocation] = useState(defaultLocation ?? "");
  const [category, setCategory] = useState(defaultCategory ?? "");

  function go(query = q) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (location) params.set("location", location);
    if (category) params.set("category", category);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go();
        }}
        role="search"
        className="flex w-full flex-col gap-2 rounded-2xl bg-white p-2 shadow-xl shadow-slate-900/10 ring-1 ring-slate-900/5 sm:flex-row sm:items-center"
      >
        <label className="flex flex-1 items-center gap-2 px-3">
          <Search size={20} className="shrink-0 text-slate-400" />
          <span className="sr-only">What are you looking for?</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Try “rooftop bar” or “seafood”"
            className="w-full py-3 text-slate-800 outline-none placeholder:text-slate-400"
          />
        </label>
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-slate-700 focus-within:border-brand">
          <MapPin size={16} className="text-slate-400" />
          <span className="sr-only">Location</span>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full bg-transparent py-3 outline-none"
          >
            <option value="">All locations</option>
            {locations.map((l) => (
              <option key={l.id} value={l.slug}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-slate-700 focus-within:border-brand">
          <LayoutGrid size={16} className="text-slate-400" />
          <span className="sr-only">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-transparent py-3 outline-none"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-xl bg-gradient-to-r from-brand to-brand-dark px-6 py-3 font-semibold text-white shadow-md shadow-brand/30 transition hover:brightness-110 active:scale-95"
        >
          Search
        </button>
      </form>
      {showIdeas && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 text-teal-100/90">
            <Sparkles size={12} /> Try:
          </span>
          {IDEAS.map((idea, i) => (
            <button
              key={idea}
              type="button"
              onClick={() => {
                setQ(idea);
                go(idea);
              }}
              style={{ animationDelay: `${i * 60}ms` }}
              className="anim-fade-in rounded-full border border-white/25 bg-white/10 px-3 py-1 text-white backdrop-blur transition hover:bg-white/25 active:scale-95"
            >
              {idea}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function SearchBar(props: {
  locations: Location[];
  categories: Category[];
  defaultQuery?: string;
  defaultLocation?: string;
  defaultCategory?: string;
  showIdeas?: boolean;
}) {
  // Re-mount on URL filter changes so the inputs follow the sidebar without
  // effect-driven state sync.
  const key = `${props.defaultQuery ?? ""}|${props.defaultLocation ?? ""}|${props.defaultCategory ?? ""}`;
  return <Fields key={key} {...props} showIdeas={props.showIdeas ?? false} />;
}
