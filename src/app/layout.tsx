import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Énergies Concept · Bons de commande",
  description:
    "Outil commercial Énergies Concept : bons de commande numériques, signature sur place et tableau de bord.",
  applicationName: "EC Commandes",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "EC Commandes" },
};

export const viewport: Viewport = {
  themeColor: "#3e96c4",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
