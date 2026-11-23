import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TCS Study",
    short_name: "TCS Study",
    description: "Short, self-checking practice for Theoretical Computer Science I.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8f6f1",
    theme_color: "#f8f6f1",
    categories: ["education"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Daily mix", url: "/practice/daily", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Redo mistakes", url: "/practice/mistakes", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
