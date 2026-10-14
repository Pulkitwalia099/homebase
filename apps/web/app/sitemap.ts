import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap { return ["", "/businesses", "/agents", "/partners", "/register", "/connectors", "/agent", "/demo", "/pilot", "/privacy"].map(path => ({ url: `https://getgolocal.com${path}`, lastModified: new Date("2026-10-13"), changeFrequency: "monthly", priority: path === "" ? 1 : 0.7 })); }
