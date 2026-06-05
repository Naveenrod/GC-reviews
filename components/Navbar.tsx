"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MapPin, User as UserIcon, LogOut, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setIsAdmin(!!data?.is_admin));
  }, [user]);

  async function signOut() {
    await supabase.auth.signOut();
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white">
            <MapPin size={20} />
          </span>
          <span>
            GC<span className="text-brand"> Reviews</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <Link href="/gold-coast" className="hover:text-brand">
            Gold Coast
          </Link>
          <Link href="/brisbane" className="hover:text-brand">
            Brisbane
          </Link>
          <Link href="/search?category=restaurants" className="hover:text-brand">
            Restaurants
          </Link>
          <Link href="/search?category=hotels" className="hover:text-brand">
            Hotels
          </Link>
          <Link href="/search?category=entertainment" className="hover:text-brand">
            Entertainment
          </Link>
        </nav>

        <div className="relative">
          {user ? (
            <>
              <button
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full border border-slate-200 py-1.5 pl-1.5 pr-3 hover:bg-slate-50"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <UserIcon size={16} />
                </span>
                <span className="hidden text-sm sm:inline">Account</span>
              </button>
              {open && (
                <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50"
                  >
                    <UserIcon size={16} /> My Profile
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50"
                    >
                      <Shield size={16} /> Admin
                    </Link>
                  )}
                  <button
                    onClick={signOut}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-slate-50"
                  >
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              )}
            </>
          ) : (
            <Link
              href="/auth"
              className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
