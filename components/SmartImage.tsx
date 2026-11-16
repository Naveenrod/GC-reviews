"use client";

import { useEffect, useRef, useState } from "react";

// <img> that walks a list of sources: if one fails to load (dead website image,
// Google quota hit, etc.) it moves to the next, ending on the designed placeholder.
// Also catches images that failed before React hydrated (onError never fired).
export function SmartImage({
  sources,
  alt,
  className,
  loading = "lazy",
}: {
  sources: (string | null | undefined)[];
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
}) {
  const list = sources.filter((s, i, arr): s is string => !!s && arr.indexOf(s) === i);
  const [index, setIndex] = useState(0);
  const ref = useRef<HTMLImageElement>(null);
  const last = list.length - 1;
  const src = list[Math.min(index, last)];

  const next = () => setIndex((i) => (i < last ? i + 1 : i));

  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) next();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={next}
      className={className}
    />
  );
}
