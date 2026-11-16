"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, Images } from "lucide-react";

// Photo grid that opens a full-screen lightbox with keyboard + swipe support.
export function Gallery({
  photos: allPhotos,
  alt,
  fallback,
  credits = {},
}: {
  photos: string[];
  alt: string;
  fallback: string;
  credits?: Record<string, string>;
}) {
  // Drop photos that fail to load; fall back to the placeholder if none survive.
  const [failed, setFailed] = useState<string[]>([]);
  const alive = allPhotos.filter((p) => !failed.includes(p));
  const photos = alive.length ? alive : [fallback];
  const gridRef = useRef<HTMLDivElement>(null);
  const markFailed = useCallback(
    (src: string) => setFailed((f) => (f.includes(src) || src === fallback ? f : [...f, src])),
    [fallback]
  );
  // Catch images that failed before hydration (their onError never fired).
  useEffect(() => {
    gridRef.current?.querySelectorAll("img").forEach((img) => {
      if (img.complete && img.naturalWidth === 0) markFailed(img.getAttribute("src") ?? "");
    });
  }, [markFailed, failed.length]);

  const [open, setOpen] = useState<number | null>(null);
  const [touchX, setTouchX] = useState<number | null>(null);
  const count = photos.length;

  const go = (dir: 1 | -1) =>
    setOpen((i) => (i === null ? i : (i + dir + count) % count));

  useEffect(() => {
    if (open === null) return;
    const step = (dir: 1 | -1) =>
      setOpen((i) => (i === null ? i : (i + dir + count) % count));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, count]);

  // Layout adapts to how many photos survive: 1 hero, 2 side-by-side,
  // 3 hero + two stacked, 5 hero + four tiles (4 shows as 3 to avoid a hole).
  const shown = count >= 5 ? 5 : count === 4 ? 3 : count;
  const grid = photos.slice(0, shown);
  const mainCls =
    shown === 1
      ? "col-span-4 h-64 sm:h-[420px]"
      : shown === 2
        ? "col-span-4 h-64 sm:col-span-2 sm:h-[320px]"
        : "col-span-4 h-64 sm:col-span-2 sm:row-span-2 sm:h-[260px]";
  const tileCls =
    shown === 2 ? "sm:col-span-2 sm:h-[320px]" : shown === 3 ? "sm:col-span-2 sm:h-[126px]" : "sm:h-[126px]";
  const onErr = (e: React.SyntheticEvent<HTMLImageElement>) =>
    markFailed(e.currentTarget.getAttribute("src") ?? "");

  return (
    <>
      <div ref={gridRef} className="relative grid grid-cols-4 gap-2 overflow-hidden rounded-3xl">
        <button
          type="button"
          onClick={() => setOpen(0)}
          className={`group relative overflow-hidden ${mainCls}`}
          aria-label="Open photo gallery"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={grid[0]}
            alt={alt}
            onError={onErr}
            referrerPolicy="no-referrer"
            className="img-shimmer absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        </button>
        {grid.slice(1).map((p, i) => (
          <button
            key={p}
            type="button"
            onClick={() => setOpen(i + 1)}
            className={`group relative hidden overflow-hidden sm:block ${tileCls}`}
            aria-label={`Open photo ${i + 2}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p}
              alt=""
              loading="lazy"
              onError={onErr}
              referrerPolicy="no-referrer"
              className="img-shimmer absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110"
            />
          </button>
        ))}
        {count > 1 && (
          <button
            type="button"
            onClick={() => setOpen(0)}
            className="glass absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-800 shadow"
          >
            <Images size={14} /> {count} photos
          </button>
        )}
      </div>

      {open !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photo gallery"
          className="anim-fade-in fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/95 p-4"
          onClick={() => setOpen(null)}
          onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX === null) return;
            const dx = e.changedTouches[0].clientX - touchX;
            if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
            setTouchX(null);
          }}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X size={22} />
          </button>
          {count > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous photo"
                onClick={(e) => (e.stopPropagation(), go(-1))}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                type="button"
                aria-label="Next photo"
                onClick={(e) => (e.stopPropagation(), go(1))}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={open}
            src={photos[open]}
            alt={`${alt} photo ${open + 1} of ${count}`}
            onError={onErr}
            referrerPolicy="no-referrer"
            onClick={(e) => e.stopPropagation()}
            className="anim-zoom-in max-h-[88vh] max-w-full rounded-2xl object-contain shadow-2xl"
          />
          <p className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs text-white">
            {open + 1} / {count}
            {credits[photos[open]] && <span className="ml-2 text-white/70">· {credits[photos[open]]}</span>}
          </p>
        </div>
      )}
    </>
  );
}
