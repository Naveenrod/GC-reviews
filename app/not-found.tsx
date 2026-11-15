import Link from "next/link";
import { Compass, Shuffle, Home } from "lucide-react";
import { Aurora } from "@/components/fx/Aurora";

export default function NotFound() {
  return (
    <Aurora className="px-4 py-24 text-white">
      <div className="mx-auto max-w-xl text-center">
        <span className="float mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-white/30 bg-white/10 backdrop-blur">
          <Compass size={36} />
        </span>
        <p className="text-sm font-semibold uppercase tracking-widest text-teal-100">404</p>
        <h1 className="mt-2 text-4xl font-bold">You&apos;ve wandered off the map</h1>
        <p className="mt-3 text-teal-50/90">
          This spot doesn&apos;t exist, or it packed up and moved. The coast is big, let&apos;s get
          you somewhere good.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-semibold text-brand-dark transition hover:bg-brand-light"
          >
            <Home size={16} /> Back home
          </Link>
          <Link
            href="/random" prefetch={false}
            className="inline-flex items-center gap-2 rounded-full border border-white/40 px-5 py-2.5 font-semibold backdrop-blur transition hover:bg-white/15"
          >
            <Shuffle size={16} /> Surprise me
          </Link>
        </div>
      </div>
    </Aurora>
  );
}
