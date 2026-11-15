"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  MapPin,
  User as UserIcon,
  LogOut,
  Shield,
  Menu,
  X,
  Shuffle,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/gold-coast", label: "Gold Coast" },
  { href: "/brisbane", label: "Brisbane" },
  { href: "/search?category=restaurants", label: "Restaurants" },
  { href: "/search?category=hotels", label: "Hotels" },
  { href: "/search?category=entertainment", label: "Entertainment" },
  { href: "/guides", label: "Guides" },
];

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()
      .then(({ data }) => active && setIsAdmin(!!data?.is_admin));
    return () => {
      active = false;
    };
  }, [user, supabase]);

  // Shrink header on scroll.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus on route change, Escape, or outside click.
  useEffect(() => {
    const close = () => {
      setMenuOpen(false);
      setDrawerOpen(false);
    };
    close();
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setDrawerOpen(false);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    setMenuOpen(false);
  }

  const signedIn = !!user;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-all duration-300",
        scrolled
          ? "border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-xl"
          : "border-transparent bg-white/95 backdrop-blur"
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-7xl items-center justify-between px-4 transition-all duration-300",
          scrolled ? "h-14" : "h-16"
        )}
      >
        <Link href="/" className="group flex items-center gap-2 text-xl font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-light text-white shadow-md shadow-brand/30 transition group-hover:rotate-6 group-hover:scale-105">
            <MapPin size={20} />
          </span>
          <span>
            GC<span className="text-brand"> Reviews</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-medium text-slate-600 md:flex">
          {NAV.map((n) => {
            const active =
              pathname === n.href.split("?")[0] && (!n.href.includes("?") || pathname === "/search");
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "rounded-full px-3 py-1.5 transition hover:bg-brand/10 hover:text-brand",
                  active && n.href.startsWith("/g") && "bg-brand/10 text-brand"
                )}
              >
                {n.label}
              </Link>
            );
          })}
          <Link
            href="/random"
            prefetch={false}
            className="ml-1 inline-flex items-center gap-1.5 rounded-full border border-dashed border-brand/50 px-3 py-1.5 text-brand transition hover:border-brand hover:bg-brand/10"
            title="Take me somewhere random"
          >
            <Shuffle size={14} /> Surprise me
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <div className="relative" ref={menuRef}>
            {signedIn ? (
              <>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  className="flex items-center gap-2 rounded-full border border-slate-200 py-1.5 pl-1.5 pr-3 transition hover:border-brand hover:bg-brand/5"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand/20 to-violet/20 text-brand">
                    <UserIcon size={16} />
                  </span>
                  <span className="hidden text-sm sm:inline">Account</span>
                </button>
                {menuOpen && (
                  <div
                    role="menu"
                    className="anim-zoom-in absolute right-0 mt-2 w-52 origin-top-right overflow-hidden rounded-2xl border border-slate-200 bg-white py-1 shadow-xl"
                  >
                    <p className="truncate px-4 py-2 text-xs text-slate-400">{user?.email}</p>
                    <Link
                      href="/profile"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50"
                    >
                      <UserIcon size={16} /> My Profile
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50"
                      >
                        <Shield size={16} /> Admin
                      </Link>
                    )}
                    <button
                      onClick={signOut}
                      role="menuitem"
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
                className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-md shadow-brand/25 transition hover:bg-brand-dark hover:shadow-lg"
              >
                <Sparkles size={14} className="hidden sm:block" /> Sign in
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            aria-expanded={drawerOpen}
            className="rounded-full p-2 text-slate-700 hover:bg-slate-100 md:hidden"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      {drawerOpen &&
        createPortal(
        <div className="fixed inset-0 z-[80] md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="anim-fade-in absolute inset-0 bg-slate-900/50" onClick={() => setDrawerOpen(false)} />
          <div className="anim-slide-in absolute right-0 top-0 flex h-full w-[82%] max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <span className="text-lg font-bold">
                GC<span className="text-brand"> Reviews</span>
              </span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="rounded-full p-2 hover:bg-slate-100"
              >
                <X size={22} />
              </button>
            </div>
            <nav className="flex flex-col gap-1 p-3">
              {NAV.map((n, i) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setDrawerOpen(false)}
                  style={{ animationDelay: `${60 + i * 40}ms` }}
                  className="anim-fade-in rounded-xl px-4 py-3 text-base font-medium text-slate-700 hover:bg-brand/10 hover:text-brand"
                >
                  {n.label}
                </Link>
              ))}
              <Link
                href="/random"
            prefetch={false}
                onClick={() => setDrawerOpen(false)}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-violet px-4 py-3 font-semibold text-white"
              >
                <Shuffle size={16} /> Surprise me
              </Link>
            </nav>
            <div className="mt-auto border-t border-slate-100 p-4 text-sm text-slate-500">
              {signedIn ? (
                <div className="flex flex-col gap-2">
                  <Link href="/profile" onClick={() => setDrawerOpen(false)} className="hover:text-brand">
                    My profile
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" onClick={() => setDrawerOpen(false)} className="hover:text-brand">
                      Admin
                    </Link>
                  )}
                  <button onClick={signOut} className="text-left text-red-600">
                    Sign out
                  </button>
                </div>
              ) : (
                <Link href="/auth" onClick={() => setDrawerOpen(false)} className="font-semibold text-brand">
                  Sign in to write reviews
                </Link>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
