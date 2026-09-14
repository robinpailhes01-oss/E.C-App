"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight, Plus, Search } from "lucide-react";
import { getStore } from "@/lib/data";
import { useAuth } from "@/components/auth-provider";
import type { Order, OrderStatus } from "@/lib/types";
import { computeTotals } from "@/lib/pricing";
import { STATUS_LABEL, customerName, dateFr, eur0 } from "@/lib/format";
import { Badge, Button, Card, EmptyState, Input, Reveal, SegmentedControl, Spinner, cx, statusTone } from "@/components/ui";

type Filter = "tous" | OrderStatus;

const accent: Record<OrderStatus, string> = { signe: "bg-brand-green", brouillon: "bg-ink/20", annule: "bg-red-400" };

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = React.useState<Order[] | null>(null);
  const [filter, setFilter] = React.useState<Filter>("tous");
  const [q, setQ] = React.useState("");

  React.useEffect(() => {
    getStore().listOrders().then(setOrders);
  }, []);

  const list = React.useMemo(() => {
    if (!orders) return [];
    const needle = q.trim().toLowerCase();
    return orders.filter((o) => {
      if (filter !== "tous" && o.status !== filter) return false;
      if (!needle) return true;
      return [o.numero, o.customer.nom, o.customer.prenom, o.customer.ville, o.commercialName].join(" ").toLowerCase().includes(needle);
    });
  }, [orders, filter, q]);

  const counts = React.useMemo(() => {
    const c = { signe: 0, brouillon: 0, annule: 0 };
    orders?.forEach((o) => (c[o.status] += 1));
    return c;
  }, [orders]);

  return (
    <div>
      <Reveal>
        <div className="flex items-end justify-between gap-3 mb-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">{user.role === "directeur" ? "Tous les commerciaux" : "Vos bons"}</p>
            <h1 className="font-display text-[28px] sm:text-[32px] font-semibold text-ink leading-tight mt-1">Bons de commande</h1>
            {orders && orders.length > 0 && (
              <p className="text-sm text-muted mt-1">
                <b className="text-ink num">{counts.signe}</b> signé{counts.signe > 1 ? "s" : ""} · <b className="text-ink num">{counts.brouillon}</b> brouillon{counts.brouillon > 1 ? "s" : ""}
                {counts.annule > 0 && (
                  <>
                    {" "}· <b className="text-ink num">{counts.annule}</b> annulé{counts.annule > 1 ? "s" : ""}
                  </>
                )}
              </p>
            )}
          </div>
          <Link href="/commandes/nouveau">
            <Button variant="accent" className="whitespace-nowrap">
              <Plus className="size-4" /> Nouveau bon
            </Button>
          </Link>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un client, un numéro, une ville…" className="pl-10" />
          </div>
          <SegmentedControl
            value={filter}
            onChange={setFilter}
            options={[
              { value: "tous", label: "Tous" },
              { value: "brouillon", label: "Brouillons" },
              { value: "signe", label: "Signés" },
              { value: "annule", label: "Annulés" },
            ]}
            className="sm:w-[26rem]"
          />
        </div>
      </Reveal>

      {!orders ? (
        <Spinner />
      ) : list.length === 0 ? (
        <Card>
          <EmptyState title={orders.length === 0 ? "Aucun bon de commande pour le moment" : "Aucun résultat"}>
            {orders.length === 0 && (
              <Link href="/commandes/nouveau" className="inline-flex items-center gap-1 text-brand-blue font-semibold">
                Créer le premier bon de commande <ArrowUpRight className="size-4" />
              </Link>
            )}
          </EmptyState>
        </Card>
      ) : (
        <ul className="space-y-2.5">
          {list.map((o, i) => {
            const t = computeTotals(o);
            return (
              <motion.li key={o.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: Math.min(i, 8) * 0.04, ease: [0.16, 1, 0.3, 1] }}>
                <Link href={`/commandes/${o.id}`} className="block group">
                  <Card className="relative overflow-hidden p-4 pl-5 hover:border-brand-blue/40 hover:shadow-[0_10px_30px_-14px_rgba(31,127,176,0.35)] transition-[border-color,box-shadow,transform] duration-200 group-active:scale-[0.995]">
                    <span className={cx("absolute left-0 top-3 bottom-3 w-1 rounded-r-full", accent[o.status])} />
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-display font-semibold text-[16px] text-ink">{customerName(o.customer)}</span>
                          <Badge tone={statusTone(o.status)} dot>
                            {STATUS_LABEL[o.status]}
                          </Badge>
                        </div>
                        <div className="text-[13px] text-muted mt-1 truncate">
                          <span className="font-mono text-ink-2">{o.numero}</span> · {o.customer.ville || "—"} · {dateFr(o.signedAt || o.createdAt)}
                          {user.role === "directeur" && ` · ${o.commercialName}`}
                        </div>
                        <div className="text-xs text-muted/80 mt-1 truncate">{o.lines.map((l) => `${l.quantity > 1 ? `${l.quantity}× ` : ""}${l.label}`).join(", ")}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="num font-semibold text-[18px] text-ink">{eur0(t.totalTTC)}</div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">TTC</div>
                      </div>
                      <ArrowUpRight className="size-4 text-muted/60 group-hover:text-brand-blue transition hidden sm:block" />
                    </div>
                  </Card>
                </Link>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
