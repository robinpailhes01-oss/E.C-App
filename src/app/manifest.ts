import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Énergies Concept · Bons de commande",
    short_name: "EC Commandes",
    description: "Bons de commande numériques pour les commerciaux Énergies Concept.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f3ef",
    theme_color: "#3e96c4",
    lang: "fr",
    icons: [{ src: "/logo.png", sizes: "805x498", type: "image/png", purpose: "any" }],
  };
}
