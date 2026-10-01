"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight, Search } from "lucide-react";
import { getStore } from "@/lib/data";
import { useAuth } from "@/components/auth-provider";
import type { DossierSuivi, Order } from "@/lib/types";
import { computeProgress, docApplicable, docOf, DOC_DEFS, emptyDossier } from "@/lib/dossier";
import { computeTotals } from "@/lib/pricing";
import { customerName, dateFr, eur0 } from "@/lib/format";
import { isStaff } from "@/lib/permissions";
import { Badge, Card, EmptyState, Input, Reveal, SegmentedControl, Spinner, cx } from "@/components/ui";
import { ProgressBar } from "@/components/dossier-ui";

type Filter = "cours" | "termines" | "tous";

export default function DossiersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = React.useState<Order[] | null>(null);
  const [dossiers, setDossiers] = React.useState<Record<string, DossierSuivi>>({});
  const [filter, setFilter] = React.useState<Filter>("cours");
  const [q, setQ] = React.useState("");
  const [chips, setChips] = React.useState<{ docs: boolean; planifier: boolean }>({ docs: false, planifier: false });

  React.useEffect(() => {
    Promise.all([getStore().listOrders(), getStore().listDossiers()]).then(([o, d]) => {
      setOrders(o.filter((x) => x.status === "signe"));
      setDossiers(Object.fromEntries(d.map((x) => [x.orderId, x])));
    });
  }, []);

  const rows = React.useMemo(() => {
    if (!orders) return [];
    const needle = q.trim().toLowerCase();
    return orders
      .map((o) => {
        const d = dossiers[o.id] ?? emptyDossier(o.id);
        const progress = computeProgress(o, d);
        const docsMissing = DOC_DEFS.filter((def) => docApplicable(def, o) && !docOf(d, def.key).recu).length;
        return { o, d, progress, docsMissing };
      })
      .filter(({ o, progress, d, docsMissing }) => {
        if (filter === "cours" && progress.complete) return false;
        if (filter === "termines" && !progress.complete) return false;
        if (chips.docs && docsMissing === 0) return false;
        if (chips.planifier && !(d.pose.statut === "a_planifier" && !d.pose.date)) return false;
        if (!needle) return true;
        return [o.numero, o.customer.nom, o.customer.prenom, o.customer.ville, o.commercialName].join(" ").toLowerCase().includes(needle);
      })
      .sort((a, b) => (a.progress.percent - b.progress.percent) || (b.o.signedAt ?? "").localeCompare(a.o.signedAt ?? ""));
  }, [orders, dossiers, filter, q, chips]);

  const staff = isStaff(user.role);

  return (
    <div>
      <Reveal>
        <div className="mb-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">{staff ? "Suivi des dossiers" : "Vos dossiers"}</p>
          <h1 className="font-display text-[28px] sm:text-[32px] font-semibold text-ink leading-tight mt-1">Dossiers</h1>
          <p className="text-sm text-muted mt-1">{staff ? "Documents, planning, administratif : du bon signé jusqu'au solde." : "Où en sont vos ventes signées : documents, DP, pose, Consuel."}</p>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="flex flex-col sm:flex-row gap-3 mb-3">
          <div className="relative flex-1">
            <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un client, un numéro, une ville…" className="pl-10" />
          </div>
          <SegmentedControl
            value={filter}
            onChange={setFilter}
            options={[
              { value: "cours", label: "En cours" },
              { value: "termines", label: "Terminés" },
              { value: "tous", label: "Tous" },
            ]}
            className="sm:w-80"
          />
        </div>
        <div className="flex flex-wrap gap-2 mb-5">
          {(
            [
              ["docs", "Documents manquants"],
              ["planifier", "Pose à planifier"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setChips((c) => ({ ...c, [k]: !c[k] }))}
              className={cx("h-9 px-3.5 rounded-full text-[13px] font-semibold border transition", chips[k] ? "bg-night text-white border-night" : "bg-panel text-ink-2 border-line-strong hover:border-ink/30")}
            >
              {label}
            </button>
          ))}
        </div>
      </Reveal>

      {!orders ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState title={orders.length === 0 ? "Aucun dossier pour le moment" : "Aucun dossier ne correspond"}>
            {orders.length === 0 ? "Un dossier apparaît dès qu'un bon de commande est signé." : "Modifiez les filtres ou la recherche."}
          </EmptyState>
        </Card>
      ) : (
        <ul className="space-y-2.5">
          {rows.map(({ o, progress, docsMissing, d }, i) => (
            <motion.li key={o.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: Math.min(i, 8) * 0.04, ease: [0.16, 1, 0.3, 1] }}>
              <Link href={`/dossiers/${o.id}`} className="block group">
                <Card className="p-4 hover:border-brand-blue/40 hover:shadow-[0_10px_30px_-14px_rgba(31,127,176,0.35)] transition-[border-color,box-shadow] duration-200">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display font-semibold text-[16px] text-ink">{customerName(o.customer)}</span>
                        {progress.complete ? <Badge tone="green" dot>Terminé</Badge> : docsMissing > 0 && <Badge tone="orange" dot>{docsMissing} doc. manquant{docsMissing > 1 ? "s" : ""}</Badge>}
                      </div>
                      <div className="text-[13px] text-muted mt-1">
                        <span className="font-mono text-ink-2">{o.numero}</span> · {o.customer.ville || "—"} · signé le {dateFr(o.signedAt)} · {o.commercialName}
                      </div>
                      <div className="mt-3">
                        <ProgressBar progress={progress} />
                      </div>
                      {(d.pose.date || d.visite.date) && (
                        <div className="text-xs text-muted mt-2">
                          {d.visite.date && <span>Visite {dateFr(d.visite.date)}</span>}
                          {d.visite.date && d.pose.date && " · "}
                          {d.pose.date && <span>Pose {dateFr(d.pose.date)}</span>}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="num font-semibold text-[18px] text-ink">{eur0(computeTotals(o).totalTTC)}</div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">TTC</div>
                      <ArrowUpRight className="size-4 text-muted/60 group-hover:text-brand-blue transition ml-auto mt-2 hidden sm:block" />
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
