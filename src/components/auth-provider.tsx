"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { getStore } from "@/lib/data";
import type { Profile } from "@/lib/types";
import { Spinner } from "./ui";

interface AuthCtx {
  user: Profile;
  signOut: () => Promise<void>;
}

const Ctx = React.createContext<AuthCtx | null>(null);

export function useAuth() {
  const c = React.useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = React.useState<Profile | null | undefined>(undefined);

  React.useEffect(() => {
    let cancelled = false;
    getStore()
      .getSession()
      .then((p) => {
        if (cancelled) return;
        if (!p) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        else setUser(p);
      })
      .catch(() => router.replace("/login"));
    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  const signOut = React.useCallback(async () => {
    await getStore().signOut();
    router.replace("/login");
  }, [router]);

  if (!user) return <Spinner label="Connexion…" />;
  return <Ctx.Provider value={{ user, signOut }}>{children}</Ctx.Provider>;
}
