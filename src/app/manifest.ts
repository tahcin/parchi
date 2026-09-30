import type { MetadataRoute } from "next";

// Installable on a farmer's home screen. Icons are rendered from the logo mark (src/components/Logo.tsx).
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Parchi",
    short_name: "Parchi",
    description:
      "Photograph the pesticide dealer's chit. Parchi checks every product against India's official records and tells you, in your language, what is banned, off-label or overdosed.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f6efdf",
    theme_color: "#f6efdf",
    lang: "en-IN",
    dir: "ltr",
    categories: ["agriculture", "utilities", "education"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
