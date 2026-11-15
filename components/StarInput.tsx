"use client";

import { Star } from "lucide-react";
import { useState } from "react";

const LABELS = ["", "Not great", "Could be better", "Pretty good", "Really good", "Unforgettable"];

export function StarInput({
  value,
  onChange,
  size = 30,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}) {
  const [hover, setHover] = useState(0);
  const [popped, setPopped] = useState(0);
  const active = hover || value;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Your rating">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={value === i}
            onClick={() => {
              onChange(i);
              setPopped(i);
              setTimeout(() => setPopped(0), 400);
            }}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(0)}
            className={`rounded-md transition-transform hover:scale-110 ${popped >= i && popped > 0 ? "star-pop" : ""}`}
            aria-label={`${i} star${i > 1 ? "s" : ""}: ${LABELS[i]}`}
          >
            <Star
              size={size}
              className={
                i <= active ? "fill-accent text-accent drop-shadow-sm" : "fill-transparent text-slate-300"
              }
            />
          </button>
        ))}
      </div>
      <span
        className={`text-sm font-medium transition-opacity ${active ? "text-slate-700 opacity-100" : "opacity-0"}`}
        aria-hidden
      >
        {LABELS[active] || "Pick a rating"}
      </span>
    </div>
  );
}
