"use client";

import { useRef, type ReactNode } from "react";

// Pointer-reactive aurora background with drifting orbs and twinkling sparks.
const SPARKS = Array.from({ length: 18 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  top: `${(i * 53) % 90}%`,
  delay: `${(i * 0.7) % 6}s`,
  dur: `${5 + (i % 4)}s`,
}));

export function Aurora({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null);

  function onMove(e: React.PointerEvent<HTMLElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
  }

  return (
    <section ref={ref} onPointerMove={onMove} className={`aurora ${className ?? ""}`}>
      <div className="orb orb-1" aria-hidden />
      <div className="orb orb-2" aria-hidden />
      <div className="orb orb-3" aria-hidden />
      {SPARKS.map((s, i) => (
        <span
          key={i}
          aria-hidden
          className="spark"
          style={{ left: s.left, top: s.top, animationDelay: s.delay, animationDuration: s.dur }}
        />
      ))}
      <div className="relative z-10">{children}</div>
      <div className="wave" aria-hidden />
    </section>
  );
}
