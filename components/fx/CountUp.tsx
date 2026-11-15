"use client";

import { useEffect, useRef, useState } from "react";

// Animates from 0 to `value` once it scrolls into view.
export function CountUp({
  value,
  duration = 1400,
  suffix = "",
  className,
}: {
  value: number;
  duration?: number;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || value === 0) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const run = () => {
      if (started.current) return;
      started.current = true;
      const t0 = performance.now();
      const step = (t: number) => {
        const p = Math.min(1, (t - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setShown(Math.round(value * eased));
        if (p < 1) requestAnimationFrame(step);
      };
      setShown(0);
      requestAnimationFrame(step);
    };

    const io = new IntersectionObserver(
      (entries) => entries.some((e) => e.isIntersecting) && (run(), io.disconnect()),
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {shown.toLocaleString("en-AU")}
      {suffix}
    </span>
  );
}
