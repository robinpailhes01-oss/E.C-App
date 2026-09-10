"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStore } from "@/lib/data";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    getStore()
      .getSession()
      .then((p) => router.replace(p ? (p.role === "directeur" ? "/tableau-de-bord" : "/commandes") : "/login"));
  }, [router]);
  return (
    <div className="flex-1 grid place-items-center text-brand-gray text-sm">Chargement…</div>
  );
}
