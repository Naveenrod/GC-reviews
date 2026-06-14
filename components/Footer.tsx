import Link from "next/link";
import { MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-bold text-lg">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
              <MapPin size={18} />
            </span>
            GC Reviews
          </div>
          <p className="mt-3 text-sm text-slate-500">
            Discover and book the best restaurants, hotels and entertainment
            across the Gold Coast and Brisbane — all the reviews in one place.
          </p>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-slate-800">Explore</h4>
          <ul className="space-y-2 text-sm text-slate-500">
            <li><Link href="/gold-coast" className="hover:text-brand">Gold Coast</Link></li>
            <li><Link href="/brisbane" className="hover:text-brand">Brisbane</Link></li>
            <li><Link href="/guides" className="hover:text-brand">Local Guides</Link></li>
            <li><Link href="/search?category=restaurants" className="hover:text-brand">Restaurants</Link></li>
            <li><Link href="/search?category=hotels" className="hover:text-brand">Hotels</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-slate-800">Company</h4>
          <ul className="space-y-2 text-sm text-slate-500">
            <li><Link href="/auth" className="hover:text-brand">Sign in</Link></li>
            <li><span className="cursor-default">About</span></li>
            <li><span className="cursor-default">Contact</span></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-slate-800">Coming soon</h4>
          <p className="text-sm text-slate-500">
            Sydney, Melbourne, Perth and more across Australia.
          </p>
        </div>
      </div>
      <div className="border-t border-slate-200 py-4 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} GC Reviews. All rights reserved.
      </div>
    </footer>
  );
}
