// Tiny dependency-free confetti burst. Call from a click handler.
const COLORS = ["#0d9488", "#5eead4", "#f59e0b", "#fb7185", "#8b5cf6", "#fde68a"];

export function burstConfetti(origin?: { x: number; y: number }, count = 70) {
  if (typeof document === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const x0 = origin?.x ?? window.innerWidth / 2;
  const y0 = origin?.y ?? window.innerHeight / 2;
  const frag = document.createDocumentFragment();

  for (let i = 0; i < count; i++) {
    const el = document.createElement("span");
    const angle = Math.random() * Math.PI * 2;
    const dist = 120 + Math.random() * 260;
    const x1 = x0 + Math.cos(angle) * dist;
    const y1 = y0 + Math.sin(angle) * dist + 300;
    el.className = "confetti-piece";
    el.style.background = COLORS[i % COLORS.length];
    el.style.setProperty("--x0", `${x0}px`);
    el.style.setProperty("--y0", `${y0}px`);
    el.style.setProperty("--x1", `${x1}px`);
    el.style.setProperty("--y1", `${y1}px`);
    el.style.setProperty("--dur", `${1.2 + Math.random() * 0.9}s`);
    el.style.width = `${6 + Math.random() * 8}px`;
    el.style.height = `${8 + Math.random() * 10}px`;
    frag.appendChild(el);
    setTimeout(() => el.remove(), 2400);
  }
  document.body.appendChild(frag);
}
