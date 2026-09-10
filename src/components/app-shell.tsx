"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { FileText, LayoutDashboard, LogOut, PlusCircle } from "lucide-react";
import { useAuth } from "./auth-provider";
import { getStore } from "@/lib/data";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const isDirector = user.role === "directeur";

  const nav = [
    ...(isDirector ? [{ href: "/tableau-de-bord", label: "Tableau de bord", icon: LayoutDashboard }] : []),
    { href: "/commandes", label: "Bons de commande", icon: FileText },
    { href: "/commandes/nouveau", label: "Nouveau bon", icon: PlusCircle },
  ];
  // Les pages de saisie ont leur propre barre d'action : on masque la navigation basse.
  const wizardPage = pathname === "/commandes/nouveau" || pathname.endsWith("/modifier");
  const active = (href: string) => (href === "/commandes" ? pathname === href || /^\/commandes\/(?!nouveau)/.test(pathname) : pathname.startsWith(href));

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-black/5 no-print">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center gap-4">
          <Link href={isDirector ? "/tableau-de-bord" : "/commandes"} className="flex items-center gap-3">
            <Image src="/logo.png" alt="Énergies Concept" width={64} height={40} priority className="h-10 w-auto" />
            <span className="hidden sm:block font-bold tracking-tight">Bons de commande</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1 ml-6">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={cx(
                  "h-10 px-3.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition",
                  active(n.href) ? "bg-brand-blue/10 text-brand-blue-dark" : "text-brand-gray hover:bg-black/5",
                )}
              >
                <n.icon className="size-4" /> {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {getStore().mode === "demo" && (
              <span className="hidden sm:inline-flex rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold px-2.5 py-1 uppercase tracking-wide">Démo</span>
            )}
            <div className="text-right leading-tight">
              <div className="text-sm font-semibold">{user.fullName}</div>
              <div className="text-[11px] uppercase tracking-wide text-brand-gray">{user.role === "directeur" ? "Direction" : "Commercial"}</div>
            </div>
            <button onClick={signOut} className="size-10 grid place-items-center rounded-xl text-brand-gray hover:bg-black/5" aria-label="Se déconnecter" title="Se déconnecter">
              <LogOut className="size-5" />
            </button>
          </div>
        </div>
      </header>

      <main className={`flex-1 mx-auto w-full max-w-6xl px-4 py-6 md:pb-10 ${wizardPage ? "pb-6" : "pb-28"}`}>{children}</main>

      {!wizardPage && (
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-black/5 no-print" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="grid" style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0,1fr))` }}>
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cx("flex flex-col items-center justify-center gap-1 h-16 text-[11px] font-semibold", active(n.href) ? "text-brand-blue-dark" : "text-brand-gray")}
            >
              <n.icon className={cx("size-5", n.href === "/commandes/nouveau" && "text-brand-orange")} />
              {n.label}
            </Link>
          ))}
        </div>
      </nav>
      )}
    </div>
  );
}
