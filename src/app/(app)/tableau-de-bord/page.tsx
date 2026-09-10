"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getStore } from "@/lib/data";
import { useAuth } from "@/components/auth-provider";
import type { Order, Profile, ProductCategory } from "@/lib/types";
import { computeTotals } from "@/lib/pricing";
import { CATEGORIES, categoryColor, categoryShort } from "@/lib/catalog";
import { STATUS_LABEL, customerName, dateFr, eur0, monthKey, monthLabel } from "@/lib/format";
import { Badge, Card, EmptyState, SegmentedControl, Select, Spinner, statusTone } from "@/components/ui";

type Period = "mois" | "3mois" | "12mois" | "tout";

const periodStart = (p: Period): string | null => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (p === "mois") d.setDate(1);
  else if (p === "3mois") d.setMonth(d.getMonth() - 3);
  else if (p === "12mois") d.setMonth(d.getMonth() - 12);
  else return null;
  return d.toISOString();
};

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = React.useState<Order[] | null>(null);
  const [profiles, setProfiles] = React.useState<Profile[]>([]);
  const [period, setPeriod] = React.useState<Period>("12mois");
  const [commercial, setCommercial] = React.useState("");

  React.useEffect(() => {
    if (user.role !== "directeur") {
      router.replace("/commandes");
      return;
    }
    Promise.all([getStore().listOrders(), getStore().listProfiles()]).then(([o, p]) => {
      setOrders(o);
      setProfiles(p.filter((x) => x.role === "commercial" || o.some((y) => y.commercialId === x.id)));
    });
  }, [user.role, router]);

  const data = React.useMemo(() => {
    if (!orders) return null;
    const start = periodStart(period);
    const inPeriod = orders.filter((o) => (!start || (o.signedAt || o.createdAt) >= start) && (!commercial || o.commercialId === commercial));
    const signed = inPeriod.filter((o) => o.status === "signe");
    const drafts = inPeriod.filter((o) => o.status === "brouillon");
    const cancelled = inPeriod.filter((o) => o.status === "annule");
    const totals = signed.map((o) => computeTotals(o));
    const caTTC = totals.reduce((s, t) => s + t.totalTTC, 0);
    const caHT = totals.reduce((s, t) => s + t.totalHT, 0);
    const decided = signed.length + cancelled.length;

    // CA par mois (12 derniers mois glissants, ou période)
    const months: Record<string, { ca: number; n: number }> = {};
    const now = new Date();
    const span = period === "mois" ? 1 : period === "3mois" ? 3 : 12;
    if (period !== "tout") {
      for (let i = span - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months[monthKey(d.toISOString())] = { ca: 0, n: 0 };
      }
    }
    signed.forEach((o, i) => {
      const k = monthKey(o.signedAt || o.createdAt);
      months[k] = months[k] || { ca: 0, n: 0 };
      months[k].ca += totals[i].totalTTC;
      months[k].n += 1;
    });
    const byMonth = Object.keys(months)
      .sort()
      .map((k) => ({ key: k, label: monthLabel(k), ...months[k] }));

    // CA par famille de produit (HT, ventilé par ligne)
    const byCat: Record<string, number> = {};
    signed.forEach((o) => o.lines.forEach((l) => (byCat[l.category] = (byCat[l.category] || 0) + l.quantity * l.unitPriceHT)));
    const byCategory = CATEGORIES.filter((c) => byCat[c.id]).map((c) => ({ id: c.id, label: c.short, value: Math.round(byCat[c.id]) }));

    // Par commercial
    const byCom: Record<string, { name: string; signed: number; drafts: number; cancelled: number; ca: number }> = {};
    inPeriod.forEach((o) => {
      const r = (byCom[o.commercialId] ||= { name: o.commercialName, signed: 0, drafts: 0, cancelled: 0, ca: 0 });
      if (o.status === "signe") {
        r.signed += 1;
        r.ca += computeTotals(o).totalTTC;
      } else if (o.status === "brouillon") r.drafts += 1;
      else r.cancelled += 1;
    });
    const byCommercial = Object.entries(byCom)
      .map(([id, r]) => ({ id, ...r }))
      .sort((a, b) => b.ca - a.ca);

    const financed = signed.filter((o) => o.financing.mode !== "comptant").length;

    return { inPeriod, signed, drafts, cancelled, caTTC, caHT, decided, byMonth, byCategory, byCommercial, financed };
  }, [orders, period, commercial]);

  if (user.role !== "directeur") return null;
  if (!orders || !data) return <Spinner />;

  const kpis = [
    { label: "CA signé TTC", value: eur0(data.caTTC), sub: `${eur0(data.caHT)} HT` },
    { label: "Bons signés", value: String(data.signed.length), sub: `${data.drafts.length} brouillon${data.drafts.length > 1 ? "s" : ""} · ${data.cancelled.length} annulé${data.cancelled.length > 1 ? "s" : ""}` },
    { label: "Panier moyen", value: data.signed.length ? eur0(data.caTTC / data.signed.length) : "—", sub: "TTC par bon signé" },
    { label: "Taux de signature", value: data.decided ? `${Math.round((data.signed.length / data.decided) * 100)} %` : "—", sub: "signés / (signés + annulés)" },
    { label: "Financés", value: data.signed.length ? `${Math.round((data.financed / data.signed.length) * 100)} %` : "—", sub: "des bons signés avec crédit" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-sm text-brand-gray">Activité commerciale · {orders.length} bon{orders.length > 1 ? "s" : ""} au total</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={commercial} onChange={(e) => setCommercial(e.target.value)} className="sm:w-56">
            <option value="">Tous les commerciaux</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName}
              </option>
            ))}
          </Select>
          <SegmentedControl
            value={period}
            onChange={setPeriod}
            options={[
              { value: "mois", label: "Ce mois" },
              { value: "3mois", label: "3 mois" },
              { value: "12mois", label: "12 mois" },
              { value: "tout", label: "Tout" },
            ]}
            className="sm:w-80"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4">
            <div className="text-[11px] uppercase tracking-wide text-brand-gray font-semibold">{k.label}</div>
            <div className="text-2xl font-bold tabular-nums mt-1 leading-tight">{k.value}</div>
            <div className="text-xs text-brand-gray mt-1">{k.sub}</div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        <Card className="p-4 lg:col-span-3">
          <h2 className="font-bold mb-1">Chiffre d&apos;affaires signé par mois</h2>
          <p className="text-xs text-brand-gray mb-3">TTC, à la date de signature</p>
          {data.signed.length === 0 ? (
            <EmptyState title="Aucun bon signé sur la période" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byMonth} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="28%">
                  <CartesianGrid vertical={false} stroke="#eceae4" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#6d6e71" }} />
                  <YAxis tickLine={false} axisLine={false} width={56} tick={{ fontSize: 11, fill: "#6d6e71" }} tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)} k€` : `${v} €`)} />
                  <Tooltip
                    cursor={{ fill: "rgba(43,132,184,0.08)" }}
                    content={({ active, payload }) =>
                      active && payload?.length ? (
                        <div className="rounded-xl bg-white border border-gray-200 shadow px-3 py-2 text-sm">
                          <div className="font-semibold">{(payload[0].payload as { label: string }).label}</div>
                          <div>{eur0(payload[0].value as number)} TTC</div>
                          <div className="text-brand-gray text-xs">{(payload[0].payload as { n: number }).n} bon(s) signé(s)</div>
                        </div>
                      ) : null
                    }
                  />
                  <Bar dataKey="ca" fill="#2b84b8" radius={[4, 4, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="p-4 lg:col-span-2">
          <h2 className="font-bold mb-1">Ventes par famille de produit</h2>
          <p className="text-xs text-brand-gray mb-3">Montant HT des lignes signées</p>
          {data.byCategory.length === 0 ? (
            <EmptyState title="Aucune donnée" />
          ) : (
            <>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.byCategory} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }} barCategoryGap="24%">
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="label" width={104} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#1f2328" }} />
                    <Tooltip
                      cursor={{ fill: "rgba(0,0,0,0.04)" }}
                      content={({ active, payload }) =>
                        active && payload?.length ? (
                          <div className="rounded-xl bg-white border border-gray-200 shadow px-3 py-2 text-sm">
                            <div className="font-semibold">{(payload[0].payload as { label: string }).label}</div>
                            <div>{eur0(payload[0].value as number)} HT</div>
                          </div>
                        ) : null
                      }
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22}>
                      {data.byCategory.map((d) => (
                        <Cell key={d.id} fill={categoryColor(d.id as ProductCategory)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 space-y-1 text-sm">
                {data.byCategory.map((d) => (
                  <li key={d.id} className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ background: categoryColor(d.id as ProductCategory) }} />
                    <span className="flex-1 text-brand-gray">{d.label}</span>
                    <span className="font-semibold tabular-nums">{eur0(d.value)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <h2 className="font-bold">Performance par commercial</h2>
        </div>
        {data.byCommercial.length === 0 ? (
          <EmptyState title="Aucune activité sur la période" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-brand-gray">
                <tr>
                  <th className="text-left font-semibold px-4 py-2.5">Commercial</th>
                  <th className="text-right font-semibold px-3 py-2.5">Signés</th>
                  <th className="text-right font-semibold px-3 py-2.5">Brouillons</th>
                  <th className="text-right font-semibold px-3 py-2.5">Annulés</th>
                  <th className="text-right font-semibold px-3 py-2.5">CA TTC</th>
                  <th className="text-right font-semibold px-4 py-2.5">Panier moyen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.byCommercial.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2.5 font-semibold">{r.name}</td>
                    <td className="text-right px-3 py-2.5 tabular-nums">{r.signed}</td>
                    <td className="text-right px-3 py-2.5 tabular-nums text-brand-gray">{r.drafts}</td>
                    <td className="text-right px-3 py-2.5 tabular-nums text-brand-gray">{r.cancelled}</td>
                    <td className="text-right px-3 py-2.5 tabular-nums font-semibold">{eur0(r.ca)}</td>
                    <td className="text-right px-4 py-2.5 tabular-nums">{r.signed ? eur0(r.ca / r.signed) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="overflow-hidden">
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <h2 className="font-bold">Derniers bons de commande</h2>
          <Link href="/commandes" className="text-sm font-semibold text-brand-blue">
            Tout voir →
          </Link>
        </div>
        {data.inPeriod.length === 0 ? (
          <EmptyState title="Aucun bon sur la période" />
        ) : (
          <ul className="divide-y divide-gray-100">
            {data.inPeriod.slice(0, 8).map((o) => (
              <li key={o.id}>
                <Link href={`/commandes/${o.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">
                      {customerName(o.customer)} <span className="text-brand-gray font-normal">· {o.numero}</span>
                    </div>
                    <div className="text-xs text-brand-gray truncate">
                      {dateFr(o.signedAt || o.createdAt)} · {o.commercialName} · {o.lines.map((l) => categoryShort(l.category)).filter((v, i, a) => a.indexOf(v) === i).join(", ")}
                    </div>
                  </div>
                  <Badge tone={statusTone(o.status)}>{STATUS_LABEL[o.status]}</Badge>
                  <div className="w-24 text-right font-semibold tabular-nums">{eur0(computeTotals(o).totalTTC)}</div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
