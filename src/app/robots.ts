import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/saved", "/recipes", "/groceries", "/profile", "settings", "/community/chat"],
      },
    ],
  };
}
