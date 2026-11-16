import type { PhotoAttribution } from "@/lib/types";

// Required by the Google Maps Platform terms whenever Places content (names,
// addresses, photos, editorial summaries, ratings) is shown on a page that does
// not also show a Google Map. Keep it adjacent to the content it attributes.
//
// Google supplies an official "Powered by Google" image in its policy pages. To use
// it instead of this text mark, drop the asset into /public and render it here.
export function PoweredByGoogle({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs text-slate-400 ${className}`}
      aria-label="Powered by Google"
    >
      Powered by
      <span className="font-semibold tracking-tight text-slate-500">Google</span>
    </span>
  );
}

// Per-photo author attributions, shown directly beneath a gallery.
export function PhotoCredits({
  attributions,
  count,
}: {
  attributions: PhotoAttribution[] | null | undefined;
  count: number;
}) {
  const list = (attributions ?? []).slice(0, count).filter((a) => a?.name);
  if (list.length === 0) return null;

  // De-duplicate authors who contributed more than one photo.
  const seen = new Map<string, PhotoAttribution>();
  for (const a of list) if (!seen.has(a.name)) seen.set(a.name, a);

  return (
    <p className="mt-2 text-xs text-slate-400">
      Photos:{" "}
      {Array.from(seen.values()).map((a, i) => (
        <span key={a.name}>
          {i > 0 && ", "}
          {a.uri ? (
            <a
              href={a.uri}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="underline hover:text-slate-600"
            >
              {a.name}
            </a>
          ) : (
            a.name
          )}
        </span>
      ))}{" "}
      via Google
    </p>
  );
}
