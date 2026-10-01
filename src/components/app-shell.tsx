"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { CalendarDays, FileText, FolderKanban, LayoutDashboard, LifeBuoy, LogOut, PlusCircle, Settings2 } from "lucide-react";
import { useAuth } from "./auth-provider";
import { getStore } from "@/lib/data";
import { Initials, cx } from "./ui";
import { homePath, ROLE_LABEL } from "@/lib/permissions";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  
  const role = user.role;
  type NavItem = { href: string; label: string; short: string; icon: typeof FileText; mobile: boolean };
  const nav: NavItem[] = [
    ...(role === "directeur" ? [{ href: "/tableau-de-bord", label: "Tableau de bord", short: "Tableau", icon: LayoutDashboard, mobile: true }] : []),
    ...(role === "secretaire" ? [{ href: "/dossiers", label: "Dossiers", short: "Dossiers", icon: FolderKanban, mobile: true }] : []),
    { href: "/commandes", label: "Bons de commande", short: "Bons", icon: FileText, mobile: true },
    ...(role !== "secretaire" ? [{ href: "/commandes/nouveau", label: "Nouveau bon", short: "Nouveau", icon: PlusCircle, mobile: role === "commercial" }] : []),
    ...(role !== "secretaire" ? [{ href: "/dossiers", label: role === "commercial" ? "Mes dossiers" : "Dossiers", short: "Dossiers", icon: FolderKanban, mobile: true }] : []),
    { href: "/semaine", label: "La semaine", short: "Semaine", icon: CalendarDays, mobile: true },
    { href: "/sav", label: "SAV", short: "SAV", icon: LifeBuoy, mobile: true },
    ...(role === "directeur" ? [{ href: "/parametres", label: "Paramètres", short: "Réglages", icon: Settings2, mobile: false }] : []),
  ];
  const mobileNav = nav.filter((n) => n.mobile);
  // Les pages de saisie ont leur propre barre d'action : on masque la navigation basse.
  const wizardPage = pathname === "/commandes/nouveau" || pathname.endsWith("/modifier");
  const active = (href: string) => (href === "/commandes" ? pathname === href || /^\/commandes\/(?!nouveau)/.test(pathname) : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-30 no-print">
        <div className="energy-line" />
        <div className="bg-panel/85 backdrop-blur-xl border-b border-line">
          <div className="mx-auto max-w-6xl px-4 h-16 flex items-center gap-4">
            <Link href={homePath(role)} className="flex items-center gap-3">
              <Image src="/logo.png" alt="Énergies Concept" width={64} height={40} priority className="h-10 w-auto" />
              <span className="hidden sm:flex md:hidden flex-col leading-none">
                <span className="font-display font-semibold text-[15px] text-ink">Bons de commande</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted mt-1">Espace commercial</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-0.5 ml-4 lg:ml-8">
              {nav.map((n) => {
                const on = active(n.href);
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={cx(
                      "relative h-10 px-2.5 lg:px-3 rounded-[10px] text-[13.5px] font-semibold inline-flex items-center gap-1.5 lg:gap-2 transition-colors",
                      on ? "text-ink" : "text-muted hover:text-ink",
                    )}
                  >
                    {on && (
                      <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-[10px] bg-ink/6" transition={{ type: "spring", stiffness: 500, damping: 40 }} />
                    )}
                    <n.icon className={cx("relative size-4", n.href === "/commandes/nouveau" && "text-brand-orange")} />
                    <span className="relative whitespace-nowrap">{n.short}</span>
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
              <div className="flex items-center gap-2.5" title={`${user.fullName} · ${ROLE_LABEL[role]}`}>
                <Initials name={user.fullName} tone={role === "directeur" ? "night" : role === "secretaire" ? "orange" : "blue"} className="size-9 text-[12px]" />
                <div className="hidden 2xl:block leading-tight">
                  <div className="text-[13.5px] font-semibold text-ink">{user.fullName}</div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">{ROLE_LABEL[role]}</div>
                </div>
              </div>
              {role === "directeur" && (
                <Link href="/parametres" className="md:hidden size-10 grid place-items-center rounded-[10px] text-muted hover:text-ink hover:bg-ink/5 transition" aria-label="Paramètres">
                  <Settings2 className="size-[18px]" />
                </Link>
              )}
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
          <div className="grid" style={{ gridTemplateColumns: `repeat(${mobileNav.length}, minmax(0,1fr))` }}>
            {mobileNav.map((n) => {
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
