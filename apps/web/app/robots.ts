import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots { return { rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/chat", "/quote/", "/booking/", "/book/", "/confirmation/", "/pro/"] }, sitemap: "https://getgolocal.com/sitemap.xml" }; }
