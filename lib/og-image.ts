// SERVER ONLY. Finds a venue's own hero image from its website (free).

const UA = "Mozilla/5.0 (compatible; GCReviewsBot/1.0; +https://gcreviews.com.au)";
const MAX_BYTES = 300_000;

function pickMeta(html: string, keys: string[]): string | null {
  for (const key of keys) {
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${key}["']`,
      "i"
    );
    const m = re.exec(html);
    const v = m?.[1] || m?.[2];
    if (v) return v.trim();
  }
  return null;
}

export async function fetchOgImage(website: string | null | undefined, timeoutMs = 5000): Promise<string | null> {
  if (!website) return null;
  let url: URL;
  try {
    url = new URL(website.startsWith("http") ? website : `https://${website}`);
  } catch {
    return null;
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
      cache: "no-store",
    });
    if (!res.ok || !(res.headers.get("content-type") ?? "").includes("html")) return null;

    // Read only the head-ish portion of the page.
    const reader = res.body?.getReader();
    if (!reader) return null;
    const chunks: Uint8Array[] = [];
    let received = 0;
    while (received < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      chunks.push(value);
      received += value.length;
    }
    reader.cancel().catch(() => {});
    const html = new TextDecoder("utf-8", { fatal: false }).decode(concat(chunks));

    const found = pickMeta(html, ["og:image:secure_url", "og:image", "twitter:image", "twitter:image:src"]);
    if (!found) return null;
    const abs = new URL(found, res.url || url);
    if (abs.protocol !== "https:" && abs.protocol !== "http:") return null;
    // Skip obvious logos / tiny assets.
    if (/logo|favicon|\.svg(\?|$)/i.test(abs.pathname)) return null;
    return abs.toString();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function concat(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const c of chunks) {
    out.set(c, o);
    o += c.length;
  }
  return out;
}

// Run `fn` over items with bounded concurrency.
export async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]);
      }
    })
  );
  return out;
}
