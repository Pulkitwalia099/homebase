import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/chat", "/quote/", "/booking/", "/pro/"],
    },
    sitemap: "https://homebase.ai/sitemap.xml",
  };
}
