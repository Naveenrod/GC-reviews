export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  Utensils,
  Bed,
  Ticket,
  Coffee,
  Wine,
  MapPin,
  Shuffle,
  ArrowRight,
  Star,
  Users,
  Store,
} from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { VenueGrid } from "@/components/VenueGrid";
import { Aurora } from "@/components/fx/Aurora";
import { RotatingWord } from "@/components/fx/RotatingWord";
import { CountUp } from "@/components/fx/CountUp";
import { Reveal } from "@/components/fx/Reveal";
import { TiltCard } from "@/components/fx/TiltCard";
import { getCategories, getLocations, getSiteStats, getVenues } from "@/lib/queries";
import { getLocationBanner } from "@/lib/unsplash";
import { venueCover } from "@/lib/photos";

const ICONS: Record<string, React.ReactNode> = {
  restaurants: <Utensils size={24} />,
  hotels: <Bed size={24} />,
  entertainment: <Ticket size={24} />,
  cafes: <Coffee size={24} />,
  bars: <Wine size={24} />,
  "things-to-do": <MapPin size={24} />,
};

const LOCATION_ART: Record<string, string> = {
  "gold-coast": "from-sky-500 via-teal-500 to-amber-300",
  brisbane: "from-violet-600 via-fuchsia-500 to-orange-300",
};

export default async function Home() {
  const [locations, categories, topRated, recent, stats] = await Promise.all([
    getLocations(),
    getCategories(),
    getVenues({ orderBy: "rating", limit: 8 }),
    getVenues({ orderBy: "recent", limit: 4 }),
    getSiteStats(),
  ]);

  const totalReviews = stats.reviews + stats.googleReviews;
  const banners = await Promise.all(locations.map((l) => getLocationBanner(l.slug, l.name)));

  return (
    <div>
      {/* Hero */}
      <Aurora className="px-4 pb-28 pt-20 text-white sm:pt-28">
        <div className="mx-auto max-w-4xl text-center">
          <p className="anim-fade-in mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium tracking-wide backdrop-blur">
            <Star size={12} className="fill-amber-300 text-amber-300" />
            Gold Coast &amp; Brisbane, reviewed by locals
          </p>
          <h1 className="text-4xl font-bold leading-[1.1] sm:text-6xl">
            Find your next favourite{" "}
            <RotatingWord
              className="text-shimmer"
              words={["restaurant", "rooftop bar", "beach hotel", "cafe", "night out", "adventure"]}
            />
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-teal-50/90">
            Real reviews, honest ratings and instant booking for the best spots on the
            coast. Explore, compare and go.
          </p>
          <div className="mx-auto mt-8 max-w-3xl">
            <SearchBar locations={locations} categories={categories} showIdeas />
          </div>
          <div className="mt-6 flex items-center justify-center">
            <Link
              href="/random" prefetch={false}
              className="group inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-2 text-sm font-semibold backdrop-blur transition hover:bg-white hover:text-brand-dark"
            >
              <Shuffle size={16} className="transition group-hover:rotate-180" />
              Feeling lucky? Surprise me
            </Link>
          </div>
        </div>
      </Aurora>

      <div className="mx-auto max-w-7xl px-4">
        {/* Categories */}
        <section className="relative z-10 -mt-14">
          <div className="glass grid grid-cols-3 gap-2 rounded-3xl p-3 shadow-xl shadow-slate-900/10 sm:grid-cols-6">
            {categories.map((c, i) => (
              <Link
                key={c.id}
                href={`/search?category=${c.slug}`}
                style={{ animationDelay: `${i * 60}ms` }}
                className="anim-fade-in group flex flex-col items-center gap-2 rounded-2xl p-3 text-center transition hover:bg-white hover:shadow-md"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand transition group-hover:scale-110 group-hover:bg-brand group-hover:text-white">
                  {ICONS[c.slug] ?? <MapPin size={24} />}
                </span>
                <span className="text-xs font-semibold text-slate-700">{c.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Live stats */}
        <Reveal as="section" className="mt-12 grid grid-cols-3 gap-3 text-center">
          {[
            { icon: <Store size={18} />, n: stats.venues, label: "venues" },
            { icon: <Users size={18} />, n: totalReviews, label: "reviews" },
            { icon: <MapPin size={18} />, n: locations.length, label: "cities" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-4">
              <span className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-brand">
                {s.icon}
              </span>
              <p className="text-2xl font-bold tabular-nums text-slate-900 sm:text-3xl">
                <CountUp value={s.n} suffix={s.n >= 1000 ? "+" : ""} />
              </p>
              <p className="text-xs uppercase tracking-wide text-slate-500">{s.label}</p>
            </div>
          ))}
        </Reveal>

        {/* Location picks */}
        <section className="mt-14 grid gap-5 sm:grid-cols-2">
          {locations.map((l, i) => {
            const art = LOCATION_ART[l.slug] ?? "from-slate-800 to-slate-600";
            const banner = banners[i];
            const cover = topRated.find((v) => v.location?.slug === l.slug);
            const coverImg = cover ? venueCover(cover, 1200) : null;
            const img = banner?.url ?? (coverImg && !coverImg.startsWith("/api/placeholder") ? coverImg : null);
            return (
              <Reveal key={l.id} delay={i * 120}>
                <TiltCard max={5}>
                  <Link
                    href={`/${l.slug}`}
                    className={`group relative flex h-56 items-end overflow-hidden rounded-3xl bg-gradient-to-tr ${art} p-6 text-white shadow-lg`}
                  >
                    {img && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover opacity-70 mix-blend-luminosity transition duration-700 group-hover:scale-105 group-hover:opacity-90 group-hover:mix-blend-normal"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                    {banner && (
                      <span className="absolute bottom-2 right-3 text-[10px] text-white/60">
                        Photo: {banner.photographer} / Unsplash
                      </span>
                    )}
                    <div className="relative">
                      <p className="text-xs font-semibold uppercase tracking-widest text-white/70">
                        Explore
                      </p>
                      <h3 className="text-3xl font-bold">{l.name}</h3>
                      <p className="mt-1 inline-flex items-center gap-1 text-sm text-white/85">
                        See what locals love{" "}
                        <ArrowRight size={14} className="transition group-hover:translate-x-1" />
                      </p>
                    </div>
                  </Link>
                </TiltCard>
              </Reveal>
            );
          })}
        </section>

        {/* Top rated */}
        <section className="mt-16">
          <Reveal className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand">Crowd favourites</p>
              <h2 className="text-2xl font-bold sm:text-3xl">Top rated right now</h2>
            </div>
            <Link href="/search" className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
              View all <ArrowRight size={14} />
            </Link>
          </Reveal>
          <VenueGrid venues={topRated} ranked />
        </section>

        {/* Recently added */}
        {recent.length > 0 && (
          <section className="mt-16">
            <Reveal className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-violet">Fresh finds</p>
              <h2 className="text-2xl font-bold sm:text-3xl">Recently added</h2>
            </Reveal>
            <VenueGrid venues={recent} />
          </section>
        )}

        {/* CTA */}
        <Reveal as="section" className="mt-20">
          <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-12 text-center text-white sm:px-12">
            <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-brand/40 blur-3xl" aria-hidden />
            <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-violet/40 blur-3xl" aria-hidden />
            <div className="relative">
              <h2 className="text-2xl font-bold sm:text-3xl">Know a hidden gem?</h2>
              <p className="mx-auto mt-2 max-w-xl text-slate-300">
                Sign in, rate the places you love, and help the next person find them.
              </p>
              <Link
                href="/auth"
                className="mt-6 inline-block rounded-full bg-white px-6 py-3 font-semibold text-slate-900 transition hover:bg-brand-light"
              >
                Start reviewing
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
