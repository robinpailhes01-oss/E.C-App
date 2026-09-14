import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Manrope, Sora } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });
const sora = Sora({ variable: "--font-sora", subsets: ["latin"], weight: ["500", "600", "700"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], weight: ["500", "600"] });

export const metadata: Metadata = {
  title: "Énergies Concept · Bons de commande",
  description:
    "Outil commercial Énergies Concept : bons de commande numériques, signature sur place et tableau de bord.",
  applicationName: "EC Commandes",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "EC Commandes" },
};

export const viewport: Viewport = {
  themeColor: "#f6f4ee",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${manrope.variable} ${sora.variable} ${jetbrains.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
