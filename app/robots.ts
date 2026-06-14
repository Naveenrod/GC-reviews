import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = getBaseUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Keep private/app areas out of search results.
        disallow: ["/admin", "/api", "/auth", "/profile"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
