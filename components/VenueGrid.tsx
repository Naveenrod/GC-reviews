import Link from "next/link";
import { Compass } from "lucide-react";
import type { Venue } from "@/lib/types";
import { VenueCard } from "@/components/VenueCard";
import { Reveal } from "@/components/fx/Reveal";

export function VenueGrid({
  venues,
  ranked = false,
}: {
  venues: Venue[];
  ranked?: boolean;
}) {
  if (venues.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-12 text-center">
        <span className="float mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-brand">
          <Compass size={26} />
        </span>
        <p className="text-lg font-semibold text-slate-800">Nothing here yet</p>
        <p className="mt-1 text-sm text-slate-500">
          Try a different search, or let us pick something for you.
        </p>
        <Link
          href="/random" prefetch={false}
          className="mt-5 inline-block rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Surprise me
        </Link>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {venues.map((v, i) => (
        <Reveal key={v.id} delay={(i % 4) * 70} className="h-full">
          <VenueCard venue={v} rank={ranked ? i + 1 : undefined} priority={i < 4} />
        </Reveal>
      ))}
    </div>
  );
}
