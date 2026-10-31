import type { MetadataRoute } from "next";

// Public surfaces only; personal pages stay out of search.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://pantrypal.app";
  const pages = ["", "/community", "/assistant", "/login", "/terms", "/privacy"];
  return pages.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
