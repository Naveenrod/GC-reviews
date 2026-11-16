// SERVER ONLY. Finds a venue's own hero image from its website (free).
//
// Looks, in order, for: og:image / twitter:image meta tags, schema.org JSON-LD
// "image" (common on restaurant and hotel sites), <link rel="image_src">,
// itemprop="image", and finally the first large-looking <img> on the page.

// A normal browser identity: many hosts (Cloudflare, Wix, Squarespace) refuse
// requests that announce themselves as bots.
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const MAX_BYTES = 600_000;

// "Websites" from Google that are really social or booking pages: they need a
// login or never expose a venue photo, so don't waste a request.
const SKIP_HOSTS = /(^|\.)(facebook\.com|fb\.com|instagram\.com|linktr\.ee|tiktok\.com|twitter\.com|x\.com|tripadvisor\.[a-z.]+|google\.[a-z.]+|goo\.gl|yelp\.[a-z.]+)$/i;

const BAD_IMAGE = /logo|favicon|icon|sprite|placeholder|blank|pixel|spacer|avatar|badge|\.svg(\?|$)|\.gif(\?|$)/i;

function decodeEntities(s: string) {
  return s.replace(/&amp;/g, "&").replace(/&#x2F;/gi, "/").replace(/&#47;/g, "/").replace(/&quot;/g, '"');
}

function metaContent(html: string, keys: string[]): string | null {
  for (const key of keys) {
    const re = new RegExp(
      `<meta[^>]+(?:property|name|itemprop)=["']${key}["'][^>]*content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name|itemprop)=["']${key}["']`,
      "i"
    );
    const m = re.exec(html);
    const v = m?.[1] || m?.[2];
    if (v && !BAD_IMAGE.test(v)) return decodeEntities(v.trim());
  }
  return null;
}

// Pull the first usable "image" out of any JSON-LD block.
function jsonLdImage(html: string): string | null {
  const blocks = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const b of blocks) {
    let data: unknown;
    try {
      data = JSON.parse(b[1].trim());
    } catch {
      continue;
    }
    const found = findImage(data, 0);
    if (found) return found;
  }
  return null;
}

function findImage(node: unknown, depth: number): string | null {
  if (depth > 6 || node == null) return null;
  if (typeof node === "string") return null;
  if (Array.isArray(node)) {
    for (const n of node) {
      const f = findImage(n, depth + 1);
      if (f) return f;
    }
    return null;
  }
  if (typeof node === "object") {
    const o = node as Record<string, unknown>;
    const img = o.image ?? o.photo ?? o.thumbnailUrl;
    const pick = (v: unknown): string | null => {
      if (typeof v === "string") return BAD_IMAGE.test(v) ? null : v;
      if (Array.isArray(v)) {
        for (const x of v) {
          const r = pick(x);
          if (r) return r;
        }
        return null;
      }
      if (v && typeof v === "object") {
        const u = (v as Record<string, unknown>).url ?? (v as Record<string, unknown>).contentUrl;
        return typeof u === "string" && !BAD_IMAGE.test(u) ? u : null;
      }
      return null;
    };
    const direct = pick(img);
    if (direct) return direct;
    for (const key of ["@graph", "mainEntity", "about", "subjectOf"]) {
      const f = findImage(o[key], depth + 1);
      if (f) return f;
    }
  }
  return null;
}

function linkImageSrc(html: string): string | null {
  const m = /<link[^>]+rel=["']image_src["'][^>]*href=["']([^"']+)["']/i.exec(html);
  return m && !BAD_IMAGE.test(m[1]) ? decodeEntities(m[1]) : null;
}

// Last resort: first <img> that looks like a real photo (jpg/webp, not a logo,
// and not declared tiny).
function firstLargeImg(html: string): string | null {
  const body = html.slice(html.search(/<body/i) >= 0 ? html.search(/<body/i) : 0);
  for (const m of body.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0];
    const src =
      /\s(?:data-src|data-lazy-src|src)=["']([^"']+\.(?:jpe?g|webp|png)(?:\?[^"']*)?)["']/i.exec(tag)?.[1] ??
      /\ssrcset=["']([^"'\s,]+\.(?:jpe?g|webp)[^"'\s,]*)/i.exec(tag)?.[1];
    if (!src || BAD_IMAGE.test(src) || BAD_IMAGE.test(tag)) continue;
    const w = Number(/\swidth=["']?(\d+)/i.exec(tag)?.[1] ?? 0);
    if (w && w < 300) continue;
    return decodeEntities(src);
  }
  return null;
}

export function extractImage(html: string): string | null {
  return (
    metaContent(html, ["og:image:secure_url", "og:image", "og:image:url", "twitter:image", "twitter:image:src"]) ??
    jsonLdImage(html) ??
    linkImageSrc(html) ??
    metaContent(html, ["image", "thumbnail"]) ??
    firstLargeImg(html)
  );
}

export async function fetchOgImage(website: string | null | undefined, timeoutMs = 8000): Promise<string | null> {
  if (!website) return null;
  let url: URL;
  try {
    url = new URL(website.startsWith("http") ? website : `https://${website}`);
  } catch {
    return null;
  }
  if (SKIP_HOSTS.test(url.hostname)) return null;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-AU,en;q=0.9",
      },
      cache: "no-store",
    });
    if (!res.ok || !(res.headers.get("content-type") ?? "").includes("html")) return null;

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

    const found = extractImage(html);
    if (!found) return null;
    const abs = new URL(found, res.url || url);
    if (abs.protocol !== "https:" && abs.protocol !== "http:") return null;
    if (BAD_IMAGE.test(abs.pathname)) return null;
    // Prefer https so images aren't blocked as mixed content.
    if (abs.protocol === "http:") abs.protocol = "https:";
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
