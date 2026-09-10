"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { getStore } from "@/lib/data";
import { Button, Card, Field, Input } from "@/components/ui";
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

  return (
    <div className="flex-1 grid place-items-center p-4">
      <Card className="w-full max-w-md p-6 sm:p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <Image src="/logo.png" alt="Énergies Concept" width={160} height={99} priority className="h-20 w-auto" />
          <h1 className="mt-4 text-xl font-bold tracking-tight">Espace commercial</h1>
          <p className="text-sm text-brand-gray">Bons de commande, signature et suivi.</p>
        </div>

        {store.mode === "demo" ? (
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-wide font-semibold text-brand-gray">Mode démo · choisissez un compte</p>
            {store.demoAccounts().map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => demo(p)}
                disabled={loading}
                className="w-full flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3.5 text-left hover:border-brand-blue hover:bg-brand-blue/5 transition"
              >
                <span className={`size-10 rounded-full grid place-items-center text-white font-bold ${p.role === "directeur" ? "bg-brand-orange" : "bg-brand-blue"}`}>
                  {p.fullName
                    .split(" ")
                    .map((s) => s[0])
                    .join("")
                    .slice(0, 2)}
                </span>
                <span>
                  <span className="block font-semibold">{p.fullName}</span>
                  <span className="block text-xs text-brand-gray">{p.role === "directeur" ? "Direction · tableau de bord" : "Commercial"}</span>
                </span>
              </button>
            ))}
            <p className="text-xs text-gray-400 pt-2">
              Les données sont stockées dans ce navigateur. Configurez Supabase (voir README) pour un usage en équipe.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <Field label="E-mail" required>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
            </Field>
            <Field label="Mot de passe" required>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
            </Field>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Se connecter
            </Button>
          </form>
        )}
      </Card>
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
