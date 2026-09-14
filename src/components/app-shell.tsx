"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { FileText, LayoutDashboard, LogOut, PlusCircle } from "lucide-react";
import { useAuth } from "./auth-provider";
import { getStore } from "@/lib/data";
import { Initials, cx } from "./ui";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const isDirector = user.role === "directeur";

  const nav = [
    ...(isDirector ? [{ href: "/tableau-de-bord", label: "Tableau de bord", short: "Tableau", icon: LayoutDashboard }] : []),
    { href: "/commandes", label: "Bons de commande", short: "Bons", icon: FileText },
    { href: "/commandes/nouveau", label: "Nouveau bon", short: "Nouveau", icon: PlusCircle },
  ];
  // Les pages de saisie ont leur propre barre d'action : on masque la navigation basse.
  const wizardPage = pathname === "/commandes/nouveau" || pathname.endsWith("/modifier");
  const active = (href: string) => (href === "/commandes" ? pathname === href || /^\/commandes\/(?!nouveau)/.test(pathname) : pathname.startsWith(href));

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-30 no-print">
        <div className="energy-line" />
        <div className="bg-panel/85 backdrop-blur-xl border-b border-line">
          <div className="mx-auto max-w-6xl px-4 h-16 flex items-center gap-4">
            <Link href={isDirector ? "/tableau-de-bord" : "/commandes"} className="flex items-center gap-3">
              <Image src="/logo.png" alt="Énergies Concept" width={64} height={40} priority className="h-10 w-auto" />
              <span className="hidden sm:flex flex-col leading-none">
                <span className="font-display font-semibold text-[15px] text-ink">Bons de commande</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted mt-1">Espace commercial</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 ml-8">
              {nav.map((n) => {
                const on = active(n.href);
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={cx(
                      "relative h-10 px-3.5 rounded-[10px] text-[13.5px] font-semibold inline-flex items-center gap-2 transition-colors",
                      on ? "text-ink" : "text-muted hover:text-ink",
                    )}
                  >
                    {on && (
                      <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-[10px] bg-ink/6" transition={{ type: "spring", stiffness: 500, damping: 40 }} />
                    )}
                    <n.icon className={cx("relative size-4", n.href === "/commandes/nouveau" && "text-brand-orange")} />
                    <span className="relative">{n.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="ml-auto flex items-center gap-3">
              {getStore().mode === "demo" && (
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-brand-orange/30 bg-brand-orange-soft text-brand-orange-dark text-[10px] font-bold px-2.5 py-1 uppercase tracking-[0.14em]">
                  <span className="size-1.5 rounded-full bg-brand-orange" /> Démo
                </span>
              )}
              <div className="flex items-center gap-2.5">
                <Initials name={user.fullName} tone={isDirector ? "night" : "blue"} className="size-9 text-[12px]" />
                <div className="hidden sm:block leading-tight">
                  <div className="text-[13.5px] font-semibold text-ink">{user.fullName}</div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">{isDirector ? "Direction" : "Commercial"}</div>
                </div>
              </div>
              <button onClick={signOut} className="size-10 grid place-items-center rounded-[10px] text-muted hover:text-ink hover:bg-ink/5 transition" aria-label="Se déconnecter" title="Se déconnecter">
                <LogOut className="size-[18px]" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className={cx("flex-1 mx-auto w-full max-w-6xl px-4 py-6 md:py-8 md:pb-12", wizardPage ? "pb-6" : "pb-28")}>{children}</main>

      {!wizardPage && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-panel/90 backdrop-blur-xl border-t border-line no-print" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <div className="grid" style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0,1fr))` }}>
            {nav.map((n) => {
              const on = active(n.href);
              return (
                <Link key={n.href} href={n.href} className={cx("relative flex flex-col items-center justify-center gap-1 h-16 text-[11px] font-semibold", on ? "text-ink" : "text-muted")}>
                  {on && <motion.span layoutId="tab-ind" className="absolute top-0 h-0.5 w-10 rounded-full bg-brand-blue" />}
                  <n.icon className={cx("size-5", n.href === "/commandes/nouveau" && "text-brand-orange")} />
                  {n.short}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
