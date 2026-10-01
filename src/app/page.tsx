"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStore } from "@/lib/data";
import { homePath } from "@/lib/permissions";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    getStore()
      .getSession()
      .then((p) => router.replace(p ? homePath(p.role) : "/login"));
  }, [router]);
  return (
    <div className="flex-1 grid place-items-center text-muted text-sm">Chargement…</div>
  );
}
