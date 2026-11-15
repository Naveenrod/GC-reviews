"use client";

import { useEffect, useState } from "react";

// Cycles through words with a 3D flip. Renders the first word on the server.
export function RotatingWord({
  words,
  interval = 2600,
  className,
}: {
  words: string[];
  interval?: number;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"in" | "out">("in");

  useEffect(() => {
    if (words.length < 2) return;
    let cancelled = false;
    const tick = setInterval(() => {
      setPhase("out");
      setTimeout(() => {
        if (cancelled) return;
        setIndex((i) => (i + 1) % words.length);
        setPhase("in");
      }, 420);
    }, interval);
    return () => {
      cancelled = true;
      clearInterval(tick);
    };
  }, [words.length, interval]);

  const longest = words.reduce((a, b) => (a.length >= b.length ? a : b));

  return (
    <span className={`word-swap ${className ?? ""}`} aria-live="polite">
      {/* invisible sizer so layout never shifts */}
      <span aria-hidden className="invisible">
        {longest}
      </span>
      <span data-state={phase}>{words[index]}</span>
    </span>
  );
}
