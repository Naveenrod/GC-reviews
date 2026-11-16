// Designed placeholder image (SVG) — free, deterministic per venue name,
// themed by category. Used whenever no real photo is available.
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const THEMES: Record<string, [string, string]> = {
  restaurants: ["#f97316", "#be123c"],
  hotels: ["#0ea5e9", "#1e3a8a"],
  entertainment: ["#8b5cf6", "#db2777"],
  cafes: ["#d97706", "#78350f"],
  bars: ["#7c3aed", "#0f172a"],
  "things-to-do": ["#0d9488", "#1e3a8a"],
  "": ["#0d9488", "#5eead4"],
};

// Simple line icons (24x24 viewBox paths, lucide-style) per category.
const ICONS: Record<string, string> = {
  restaurants: "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7",
  hotels: "M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9",
  entertainment: "M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2ZM13 5v2M13 17v2M13 11v2",
  cafes: "M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4ZM6 2v2M10 2v2M14 2v2",
  bars: "M8 22h8M7 10h10M12 15v7M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z",
  "things-to-do": "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0ZM12 10m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0",
  "": "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0ZM12 10m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0",
};

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return Math.abs(h >>> 0);
}

function esc(s: string) {
  return s.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

export function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const name = (sp.get("n") ?? "").slice(0, 60);
  const cat = sp.get("c") ?? "";
  const [a, b] = THEMES[cat] ?? THEMES[""];
  const icon = ICONS[cat] ?? ICONS[""];
  const h = hash(name || cat);
  const initials = esc(
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("")
  );
  const cx = 150 + (h % 500);
  const cy = 120 + ((h >> 8) % 360);
  const rot = (h >> 16) % 360;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600" role="img" aria-label="${esc(name)}">
<defs>
  <linearGradient id="g" gradientTransform="rotate(${rot} .5 .5)"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>
  <radialGradient id="r" cx="${cx}" cy="${cy}" r="320" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill="#fff" fill-opacity=".18"/></pattern>
</defs>
<rect width="800" height="600" fill="url(#g)"/>
<rect width="800" height="600" fill="url(#dots)"/>
<circle cx="${cx}" cy="${cy}" r="320" fill="url(#r)"/>
<circle cx="${800 - cx / 2}" cy="${600 - cy / 2}" r="140" fill="#fff" fill-opacity=".08"/>
<g transform="translate(352 180) scale(4)" fill="none" stroke="#fff" stroke-opacity=".9" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${icon}"/></g>
<text x="400" y="372" text-anchor="middle" font-family="ui-sans-serif, system-ui, Helvetica, Arial" font-size="56" font-weight="700" fill="#fff" fill-opacity=".92">${initials}</text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=604800, s-maxage=31536000, immutable",
    },
  });
}
