import type { MetadataRoute } from "next";

/** Installable app manifest: add coci to your home screen and the chrome fades. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "coci, meals from your cocina",
    short_name: "coci",
    description:
      "List the ingredients you already have, set a budget, and coci drafts a day-by-day meal plan plus a shopping list of what is missing.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f1e5",
    theme_color: "#b97518",
    orientation: "portrait",
    categories: ["food", "lifestyle"],
    icons: [
      { src: "/favicon.png", sizes: "48x48", type: "image/png" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
