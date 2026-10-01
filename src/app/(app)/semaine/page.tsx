"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ExternalLink, MapPin, Phone, Plus, User } from "lucide-react";
import { getStore } from "@/lib/data";
import { useAuth } from "@/components/auth-provider";
import type { DossierSuivi, Order, PlanItem, Sav } from "@/lib/types";
import {
  CRENEAU_LABEL,
  KIND_COLOR,
  KIND_LABEL,
  PLAN_LABEL,
  PLAN_TONE,
  addDays,
  buildEvents,
  computeProgress,
  emptyDossier,
  isoDay,
  mondayOf,
  parseDay,
  type AgendaEvent,
  type EventKind,
} from "@/lib/dossier";
import { customerName } from "@/lib/format";
import { isStaff } from "@/lib/permissions";
import { Badge, Button, Card, Field, Input, Modal, Reveal, Select, Spinner, cx } from "@/components/ui";
import { PlanEditor, ProgressBar } from "@/components/dossier-ui";

const fmtLong = (d: Date) => d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
const KINDS: EventKind[] = ["pose", "visite", "livraison", "sav"];

export default function WeekPage() {
  const { user } = useAuth();
  const staff = isStaff(user.role);
  const [orders, setOrders] = React.useState<Order[] | null>(null);
  const [dossiers, setDossiers] = React.useState<DossierSuivi[]>([]);
  const [savs, setSavs] = React.useState<Sav[]>([]);
  const [weekStart, setWeekStart] = React.useState(() => mondayOf(new Date()));
  const [kinds, setKinds] = React.useState<Record<EventKind, boolean>>({ pose: true, visite: true, livraison: true, sav: true });
  const [open, setOpen] = React.useState<AgendaEvent | null>(null);
  const [plan, setPlan] = React.useState<{ orderId?: string; date?: string } | null>(null);

  const [tick, setTick] = React.useState(0);
  const load = React.useCallback(() => setTick((t) => t + 1), []);
  React.useEffect(() => {
    let alive = true;
    Promise.all([getStore().listOrders(), getStore().listDossiers(), getStore().listSav()]).then(([o, d, sv]) => {
      if (!alive) return;
      setOrders(o);
      setDossiers(d);
      setSavs(sv);
    });
    return () => {
      alive = false;
    };
  }, [tick]);

  const events = React.useMemo(() => (orders ? buildEvents(orders, dossiers, savs).filter((e) => kinds[e.kind]) : []), [orders, dossiers, savs, kinds]);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = isoDay(new Date());
  const weekEvents = events.filter((e) => e.date >= isoDay(days[0]) && e.date <= isoDay(days[6]));
  const counts = KINDS.map((k) => ({ k, n: weekEvents.filter((e) => e.kind === k).length }));

  const dossierMap = React.useMemo(() => new Map(dossiers.map((d) => [d.orderId, d])), [dossiers]);
  const toPlan = React.useMemo(
    () =>
      (orders ?? [])
        .filter((o) => o.status === "signe")
        .filter((o) => {
          const d = dossierMap.get(o.id);
          return !d || (d.pose.statut === "a_planifier" && !d.pose.date);
        }),
    [orders, dossierMap],
  );

  if (!orders) return <Spinner />;

  const range = `${days[0].toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} au ${days[6].toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`;

  return (
    <div>
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">Agenda</p>
            <h1 className="font-display text-[28px] sm:text-[32px] font-semibold text-ink leading-tight mt-1">La semaine</h1>
            <p className="text-sm text-muted mt-1">
              Du {range} · {staff ? "mettez à jour les poses, les vendeurs voient l'avancement." : "où en sont vos poses."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setWeekStart((w) => addDays(w, -7))} aria-label="Semaine précédente">
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setWeekStart(mondayOf(new Date()))}>
              Aujourd&apos;hui
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setWeekStart((w) => addDays(w, 7))} aria-label="Semaine suivante">
              <ChevronRight className="size-4" />
            </Button>
            {staff && (
              <Button variant="accent" size="sm" onClick={() => setPlan({})}>
                <Plus className="size-4" /> Planifier
              </Button>
            )}
          </div>
        </div>
      </Reveal>

      <div className="flex flex-wrap gap-2 mb-5">
        {counts.map(({ k, n }) => (
          <button
            key={k}
            type="button"
            onClick={() => setKinds((s) => ({ ...s, [k]: !s[k] }))}
            className={cx("h-9 px-3.5 rounded-full text-[13px] font-semibold border transition inline-flex items-center gap-2", kinds[k] ? "bg-panel border-line-strong text-ink" : "bg-transparent border-line text-muted line-through")}
          >
            <span className="size-2.5 rounded-full" style={{ background: KIND_COLOR[k] }} />
            {KIND_LABEL[k]}
            <span className="num text-muted">{n}</span>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-7 gap-3">
        {days.map((day) => {
          const iso = isoDay(day);
          const list = events.filter((e) => e.date === iso);
          const isToday = iso === today;
          return (
            <div key={iso} className={cx("rounded-[16px] border p-2.5 min-h-24 lg:min-h-64", isToday ? "border-brand-blue/50 bg-brand-blue-soft/40" : "border-line bg-panel/60")}>
              <div className="flex items-baseline justify-between gap-2 px-1 mb-2">
                <div className={cx("text-[12px] font-bold uppercase tracking-[0.1em]", isToday ? "text-brand-blue-dark" : "text-muted")}>
                  <span className="lg:hidden">{fmtLong(day)}</span>
                  <span className="hidden lg:inline">{day.toLocaleDateString("fr-FR", { weekday: "short" })} {day.getDate()}</span>
                </div>
                {staff && (
                  <button type="button" onClick={() => setPlan({ date: iso })} className="size-6 grid place-items-center rounded-full text-muted hover:bg-ink/6 hover:text-ink" aria-label={`Planifier le ${fmtLong(day)}`}>
                    <Plus className="size-3.5" />
                  </button>
                )}
              </div>
              {list.length === 0 ? (
                <div className="text-xs text-muted/70 px-1 py-1">—</div>
              ) : (
                <ul className="space-y-2">
                  {list.map((e) => (
                    <li key={e.id}>
                      <button type="button" onClick={() => setOpen(e)} className="w-full text-left rounded-[12px] bg-panel border border-line hover:border-line-strong shadow-[var(--shadow-ambient)] p-2.5 pl-3 relative overflow-hidden transition">
                        <span className="absolute left-0 top-0 bottom-0 w-1" style={{ background: KIND_COLOR[e.kind] }} />
                        <div className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: KIND_COLOR[e.kind] }}>
                          {KIND_LABEL[e.kind]} · {CRENEAU_LABEL[e.creneau]}
                        </div>
                        <div className="font-semibold text-[13.5px] leading-snug mt-0.5">{e.client}</div>
                        <div className="text-[11.5px] text-muted">{[e.ville, e.responsable].filter(Boolean).join(" · ")}</div>
                        <div className="mt-1.5">
                          {e.statut === "sav" ? <Badge tone="red">SAV</Badge> : <Badge tone={PLAN_TONE[e.statut]} dot>{PLAN_LABEL[e.statut]}</Badge>}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* A planifier */}
      <Reveal delay={0.1}>
        <Card className="mt-6 p-5">
          <div className="flex items-baseline justify-between gap-2 mb-3">
            <h2 className="font-display font-semibold text-[17px]">Ventes à planifier</h2>
            <span className="text-sm text-muted">{toPlan.length} dossier{toPlan.length > 1 ? "s" : ""} sans date de pose</span>
          </div>
          {toPlan.length === 0 ? (
            <p className="text-sm text-muted">Toutes les poses ont une date.</p>
          ) : (
            <ul className="divide-y divide-line">
              {toPlan.map((o) => (
                <li key={o.id} className="py-2.5 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{customerName(o.customer)}</div>
                    <div className="text-xs text-muted">
                      {o.numero} · {o.customer.ville} · {o.commercialName}
                      {o.delaiInstallationMois ? ` · annoncée sous ${o.delaiInstallationMois} mois` : ""}
                    </div>
                  </div>
                  <Link href={`/dossiers/${o.id}`} className="text-sm font-semibold text-brand-blue hidden sm:block">
                    Dossier
                  </Link>
                  {staff && (
                    <Button size="sm" variant="secondary" onClick={() => setPlan({ orderId: o.id })}>
                      Planifier
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </Reveal>

      <EventModal event={open} orders={orders} dossierMap={dossierMap} staff={staff} onClose={() => setOpen(null)} onSaved={() => { setOpen(null); load(); }} />
      <PlanModal
        key={`${plan?.orderId ?? ""}-${plan?.date ?? ""}-${plan ? "o" : "c"}`}
        open={plan !== null}
        orders={orders.filter((o) => o.status === "signe")}
        dossierMap={dossierMap}
        initial={plan ?? {}}
        onClose={() => setPlan(null)}
        onSaved={() => { setPlan(null); load(); }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------

function EventModal({
  event,
  orders,
  dossierMap,
  staff,
  onClose,
  onSaved,
}: {
  event: AgendaEvent | null;
  orders: Order[];
  dossierMap: Map<string, DossierSuivi>;
  staff: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  return (
    <Modal open={event !== null} onClose={onClose} title={event ? `${KIND_LABEL[event.kind]} · ${event.client}` : ""} wide>
      {event && <EventBody key={event.id} event={event} orders={orders} dossierMap={dossierMap} staff={staff} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  );
}

function EventBody({
  event,
  orders,
  dossierMap,
  staff,
  onClose,
  onSaved,
}: {
  event: AgendaEvent;
  orders: Order[];
  dossierMap: Map<string, DossierSuivi>;
  staff: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const kind = event.kind !== "sav" ? event.kind : null;
  const order = event.orderId ? orders.find((o) => o.id === event.orderId) : undefined;
  const dossier = event.orderId ? dossierMap.get(event.orderId) ?? emptyDossier(event.orderId) : null;
  const [item, setItem] = React.useState<PlanItem | null>(() => (dossier && kind ? { ...dossier[kind] } : null));
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const save = async () => {
    if (!dossier || !kind || !item) return;
    setSaving(true);
    setError(null);
    try {
      await getStore().saveDossier({ ...dossier, [kind]: item });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  };

  const progress = order && dossier ? computeProgress(order, dossier) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-ink-2">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="size-4 text-muted" />
          {event.ville || "—"}
        </span>
        {event.telephone && (
          <a href={`tel:${event.telephone}`} className="inline-flex items-center gap-1.5 underline decoration-dotted">
            <Phone className="size-4 text-muted" />
            {event.telephone}
          </a>
        )}
        {event.commercialName && (
          <span className="inline-flex items-center gap-1.5">
            <User className="size-4 text-muted" />
            Vendeur : {event.commercialName}
          </span>
        )}
        <span className="font-mono text-muted">{event.numero}</span>
      </div>
      <p className="text-sm">
        {fmtLong(parseDay(event.date))} · <b>{CRENEAU_LABEL[event.creneau]}</b>
        {event.responsable ? ` · ${event.responsable}` : ""}
      </p>

      {progress && (
        <div className="rounded-[14px] border border-line bg-surface-2 p-3.5">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted mb-2">Avancement du dossier</div>
          <ProgressBar progress={progress} />
        </div>
      )}

      {staff && kind && item ? (
        <PlanEditor title={KIND_LABEL[kind]} item={item} onChange={setItem} responsableLabel={kind === "livraison" ? undefined : kind === "pose" ? "Poseur / technicien" : "Technicien"} />
      ) : (
        event.statut !== "sav" && (
          <Badge tone={PLAN_TONE[event.statut]} dot>
            {PLAN_LABEL[event.statut]}
          </Badge>
        )
      )}
      {event.kind === "sav" && <p className="text-sm text-ink-2">{event.title}</p>}
      {event.note && event.kind !== "sav" && <p className="text-sm text-muted">Note : {event.note}</p>}
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <div className="flex flex-wrap justify-between gap-2 pt-1">
        <div className="flex gap-2">
          {event.orderId && event.kind !== "sav" && (
            <Link href={`/dossiers/${event.orderId}`}>
              <Button variant="secondary" size="sm">
                <ExternalLink className="size-4" /> Ouvrir le dossier
              </Button>
            </Link>
          )}
          {event.kind === "sav" && (
            <Link href="/sav">
              <Button variant="secondary" size="sm">
                <ExternalLink className="size-4" /> Ouvrir le SAV
              </Button>
            </Link>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>
            Fermer
          </Button>
          {staff && kind && (
            <Button onClick={save} loading={saving}>
              Enregistrer
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function PlanModal({
  open,
  orders,
  dossierMap,
  initial,
  onClose,
  onSaved,
}: {
  open: boolean;
  orders: Order[];
  dossierMap: Map<string, DossierSuivi>;
  initial: { orderId?: string; date?: string };
  onClose: () => void;
  onSaved: () => void;
}) {
  const [orderId, setOrderId] = React.useState(initial.orderId ?? "");
  const [kind, setKind] = React.useState<"pose" | "visite" | "livraison">("pose");
  const [item, setItem] = React.useState<PlanItem>({ statut: "planifie", date: initial.date, creneau: "journee" });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const save = async () => {
    if (!orderId || !item.date) return;
    setSaving(true);
    setError(null);
    try {
      const d = dossierMap.get(orderId) ?? emptyDossier(orderId);
      await getStore().saveDossier({ ...d, [kind]: { ...d[kind], ...item } });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Planifier une intervention">
      <div className="space-y-4">
        <Field label="Dossier" required>
          <Select value={orderId} onChange={(e) => setOrderId(e.target.value)}>
            <option value="">— Choisir un dossier —</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {customerName(o.customer)} · {o.customer.ville} · {o.numero}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Type d'intervention">
          <Select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
            <option value="pose">Pose</option>
            <option value="visite">Visite technique</option>
            <option value="livraison">Livraison</option>
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date" required>
            <Input type="date" value={item.date ?? ""} onChange={(e) => setItem({ ...item, date: e.target.value })} />
          </Field>
          <Field label="Créneau">
            <Select value={item.creneau ?? "journee"} onChange={(e) => setItem({ ...item, creneau: e.target.value as PlanItem["creneau"] })}>
              {Object.entries(CRENEAU_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </Field>
        </div>
        {kind !== "livraison" && (
          <Field label={kind === "pose" ? "Poseur / technicien" : "Technicien"}>
            <Input value={item.responsable ?? ""} onChange={(e) => setItem({ ...item, responsable: e.target.value })} placeholder="Nom" />
          </Field>
        )}
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button onClick={save} loading={saving} disabled={!orderId || !item.date}>Planifier</Button>
        </div>
      </div>
    </Modal>
  );
}
