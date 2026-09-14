"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { getStore } from "@/lib/data";
import { Button, Field, Initials, Input } from "@/components/ui";
import type { Profile } from "@/lib/types";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const store = getStore();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const go = (p: Profile) => {
    const next = params.get("next");
    router.replace(next && next !== "/" ? next : p.role === "directeur" ? "/tableau-de-bord" : "/commandes");
  };

  React.useEffect(() => {
    store.getSession().then((p) => p && go(p));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      go(await store.signIn(email, password));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible");
    } finally {
      setLoading(false);
    }
  };

  const demo = async (p: Profile) => {
    setLoading(true);
    try {
      go(await store.signIn(p.email, ""));
    } finally {
      setLoading(false);
    }
  };

  const ease = [0.16, 1, 0.3, 1] as const;

  return (
    <div className="flex-1 grid grid-rows-[auto_1fr] lg:grid-rows-1 lg:grid-cols-[1.1fr_1fr] min-h-dvh">
      {/* Panneau de marque */}
      <section className="relative overflow-hidden bg-night text-white px-6 py-8 lg:px-14 lg:py-14 flex flex-col">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-24 size-[420px] rounded-full bg-brand-blue/30 blur-3xl" />
          <div className="absolute bottom-[-140px] right-[-80px] size-[380px] rounded-full bg-brand-orange/25 blur-3xl" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-brand-blue via-brand-green to-brand-orange opacity-80 lg:hidden" />
        </div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="relative flex items-center gap-3">
          <span className="rounded-2xl bg-white p-2 shadow-[var(--shadow-float)]">
            <Image src="/logo.png" alt="Énergies Concept" width={88} height={54} priority className="h-11 w-auto" />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Espace commercial</span>
        </motion.div>

        <div className="relative mt-7 lg:mt-auto lg:mb-10 max-w-md">
          <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease }} className="font-display text-[28px] lg:text-[44px] leading-[1.08] font-semibold">
            Le bon de commande, <span className="text-brand-orange">signé sur place</span>.
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2, ease }} className="mt-3 text-[14px] lg:text-[15px] text-white/70 leading-relaxed">
            Coordonnées, produits, tarifs TTC et financement en quatre étapes. Signature client au doigt, PDF prêt à partager avant de quitter le salon.
          </motion.p>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.9, delay: 0.35, ease }} className="energy-line w-24 rounded-full mt-8 origin-left hidden lg:block" />
        </div>
      </section>

      {/* Formulaire */}
      <section className="flex items-center justify-center px-5 py-10 lg:px-14">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15, ease }} className="w-full max-w-md">
          <h2 className="font-display text-2xl font-semibold text-ink">Connexion</h2>
          <p className="text-sm text-muted mt-1">Accédez à vos bons de commande.</p>

          {store.mode === "demo" ? (
            <div className="mt-7 space-y-2.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Mode démo · choisissez un compte</p>
              {store.demoAccounts().map((p, i) => (
                <motion.button
                  key={p.id}
                  type="button"
                  onClick={() => demo(p)}
                  disabled={loading}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.25 + i * 0.06, ease }}
                  whileTap={{ scale: 0.985 }}
                  className="group w-full flex items-center gap-3.5 rounded-[16px] border border-line bg-panel p-3.5 text-left shadow-[var(--shadow-ambient)] hover:border-brand-blue/40 transition-colors"
                >
                  <Initials name={p.fullName} tone={p.role === "directeur" ? "night" : "blue"} className="size-11 text-[13px]" />
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold text-ink">{p.fullName}</span>
                    <span className="block text-xs text-muted">{p.role === "directeur" ? "Direction · tableau de bord" : "Commercial"}</span>
                  </span>
                  <ArrowRight className="size-4 text-muted group-hover:text-brand-blue group-hover:translate-x-0.5 transition" />
                </motion.button>
              ))}
              <p className="text-xs text-muted/80 pt-3 leading-relaxed">Les données sont stockées dans ce navigateur. Configurez Supabase (voir README) pour un usage en équipe.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-7 space-y-4">
              <Field label="E-mail" required>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
              </Field>
              <Field label="Mot de passe" required>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
              </Field>
              {error && <p className="text-sm font-medium text-red-600">{error}</p>}
              <Button type="submit" className="w-full" size="lg" loading={loading} variant="night">
                Se connecter <ArrowRight className="size-4" />
              </Button>
            </form>
          )}
        </motion.div>
      </section>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense>
      <LoginInner />
    </React.Suspense>
  );
}
