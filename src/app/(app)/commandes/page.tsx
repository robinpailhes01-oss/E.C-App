"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { getStore } from "@/lib/data";
import { useAuth } from "@/components/auth-provider";
import type { Order, OrderStatus } from "@/lib/types";
import { computeTotals } from "@/lib/pricing";
import { STATUS_LABEL, customerName, dateFr, eur0 } from "@/lib/format";
import { Badge, Button, Card, EmptyState, Input, SegmentedControl, Spinner, statusTone } from "@/components/ui";

type Filter = "tous" | OrderStatus;

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

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bons de commande</h1>
          <p className="text-sm text-brand-gray">{user.role === "directeur" ? "Tous les commerciaux" : "Vos bons de commande"}</p>
        </div>
        <Link href="/commandes/nouveau">
          <Button variant="accent" className="whitespace-nowrap">
            <Plus className="size-4" /> Nouveau bon
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
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
          className="sm:w-96"
        />
      </div>

      {!orders ? (
        <Spinner />
      ) : list.length === 0 ? (
        <Card>
          <EmptyState title={orders.length === 0 ? "Aucun bon de commande pour le moment" : "Aucun résultat"}>
            {orders.length === 0 && (
              <Link href="/commandes/nouveau" className="text-brand-blue font-semibold">
                Créer le premier bon de commande →
              </Link>
            )}
          </EmptyState>
        </Card>
      ) : (
        <ul className="space-y-2.5">
          {list.map((o) => {
            const t = computeTotals(o);
            return (
              <li key={o.id}>
                <Link href={`/commandes/${o.id}`} className="block">
                  <Card className="p-4 hover:border-brand-blue/50 transition">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold">{customerName(o.customer)}</span>
                          <Badge tone={statusTone(o.status)}>{STATUS_LABEL[o.status]}</Badge>
                        </div>
                        <div className="text-sm text-brand-gray mt-0.5 truncate">
                          {o.numero} · {o.customer.ville || "—"} · {dateFr(o.signedAt || o.createdAt)}
                          {user.role === "directeur" && ` · ${o.commercialName}`}
                        </div>
                        <div className="text-xs text-gray-400 mt-1 truncate">{o.lines.map((l) => `${l.quantity > 1 ? `${l.quantity}× ` : ""}${l.label}`).join(", ")}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold tabular-nums">{eur0(t.totalTTC)}</div>
                        <div className="text-xs text-brand-gray">TTC</div>
                      </div>
                    </div>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
