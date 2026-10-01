"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, FileText, Loader2 } from "lucide-react";
import { getStore } from "@/lib/data";
import { useAuth } from "@/components/auth-provider";
import type { Decision, DossierSuivi, Order } from "@/lib/types";
import { DOC_DEFS, computeProgress, docApplicable, docOf, emptyDossier } from "@/lib/dossier";
import { computeTotals } from "@/lib/pricing";
import { categoryShort } from "@/lib/catalog";
import { customerName, dateFr, eur } from "@/lib/format";
import { isStaff } from "@/lib/permissions";
import { Badge, Card, EmptyState, Field, Input, Reveal, SectionTitle, Spinner, Textarea, Toggle } from "@/components/ui";
import { NumberInput } from "@/components/number-input";
import { DecisionField, PlanEditor, ProgressBar, StepChips } from "@/components/dossier-ui";
import { PhotoGrid } from "@/components/photo-grid";

export default function DossierPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const readOnly = !isStaff(user.role);
  const [order, setOrder] = React.useState<Order | null | undefined>(undefined);
  const [d, setD] = React.useState<DossierSuivi | null>(null);
  const [state, setState] = React.useState<"idle" | "saving" | "saved" | "error">("idle");
  const [savedAt, setSavedAt] = React.useState<string | null>(null);
  const dirty = React.useRef(false);

  React.useEffect(() => {
    Promise.all([getStore().getOrder(id), getStore().getDossier(id)]).then(([o, dossier]) => {
      setOrder(o);
      setD(dossier ?? emptyDossier(id));
      setSavedAt(dossier?.updatedAt ?? null);
    });
  }, [id]);

  // Enregistrement automatique (secrétariat / direction) : 700 ms après la dernière modification.
  React.useEffect(() => {
    if (!d || readOnly || !dirty.current) return;
    setState("saving");
    const t = setTimeout(() => {
      getStore()
        .saveDossier(d)
        .then((s) => {
          dirty.current = false;
          setSavedAt(s.updatedAt ?? new Date().toISOString());
          setState("saved");
        })
        .catch(() => setState("error"));
    }, 700);
    return () => clearTimeout(t);
  }, [d, readOnly]);

  const update = (fn: (prev: DossierSuivi) => DossierSuivi) => {
    dirty.current = true;
    setD((prev) => (prev ? fn(prev) : prev));
  };

  if (order === undefined || !d) return <Spinner />;
  if (!order) return <EmptyState title="Dossier introuvable" />;

  const progress = computeProgress(order, d);
  const totals = computeTotals(order);
  const credit = order.financing.mode === "credit";
  const materiel = order.lines;
  const setDecision = (key: "dp" | "enedis" | "consuel", statut: Decision) => update((p) => ({ ...p, [key]: { ...p[key], statut } }));

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/dossiers" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink mb-4 transition">
        <ArrowLeft className="size-4" /> Dossiers
      </Link>

      <Reveal>
        <div className="relative overflow-hidden rounded-[var(--radius-card)] bg-night text-white p-5 sm:p-6 mb-4 shadow-[var(--shadow-float)]">
          <div className="absolute -top-24 -right-16 size-64 rounded-full bg-brand-blue/30 blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-display text-[24px] font-semibold">{customerName(order.customer)}</h1>
                  {progress.complete ? <Badge tone="green" dot>Terminé</Badge> : <Badge tone="orange" dot>En cours</Badge>}
                </div>
                <p className="text-sm text-white/65 mt-1">
                  <span className="font-mono">{order.numero}</span> · {order.customer.codePostal} {order.customer.ville} · signé le {dateFr(order.signedAt)} · {order.commercialName}
                </p>
                <p className="text-sm text-white/65">
                  {order.customer.portable || order.customer.telephone}
                  {order.customer.email ? ` · ${order.customer.email}` : ""}
                </p>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">Total TTC</div>
                <div className="num text-[26px] font-semibold leading-none mt-1">{eur(totals.totalTTC)}</div>
                <div className="text-xs text-white/60 mt-1">{credit ? `Financement ${order.financing.organisme ?? ""}` : "Paiement comptant"}</div>
              </div>
            </div>
            <div className="mt-5">
              <ProgressBar progress={progress} dark />
            </div>
            <div className="mt-4">
              <StepChips progress={progress} dark />
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <Link href={`/commandes/${order.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/85 hover:text-white">
                <FileText className="size-4" /> Voir le bon de commande
              </Link>
              {!readOnly && (
                <span className="inline-flex items-center gap-1.5 text-xs text-white/70" aria-live="polite">
                  {state === "saving" && (
                    <>
                      <Loader2 className="size-3.5 animate-spin" /> Enregistrement…
                    </>
                  )}
                  {state === "saved" && (
                    <>
                      <Check className="size-3.5 text-brand-green" /> Enregistré
                    </>
                  )}
                  {state === "error" && <span className="text-red-300">Échec de l&apos;enregistrement</span>}
                  {state === "idle" && savedAt && <>Dernière mise à jour {dateFr(savedAt, true)}{d.updatedBy ? ` · ${d.updatedBy}` : ""}</>}
                </span>
              )}
            </div>
          </div>
        </div>
      </Reveal>

      {readOnly && <p className="mb-4 text-sm text-muted rounded-[14px] bg-surface border border-line px-4 py-3">Consultation : le suivi est mis à jour par le secrétariat et la direction.</p>}

      <div className="space-y-4">
        {/* ------------------------------------------------------------ Planning */}
        <Card className="p-5 sm:p-6">
          <SectionTitle sub="Visite, livraison et pose apparaissent dans l'agenda « La semaine ».">Planning</SectionTitle>
          <div className="grid md:grid-cols-3 gap-3">
            <PlanEditor title="Visite technique" item={d.visite} responsableLabel="Technicien" readOnly={readOnly} onChange={(visite) => update((p) => ({ ...p, visite }))} />
            <PlanEditor title="Livraison" item={d.livraison} readOnly={readOnly} onChange={(livraison) => update((p) => ({ ...p, livraison }))} />
            <PlanEditor
              title="Pose"
              item={d.pose}
              responsableLabel="Poseur / technicien"
              readOnly={readOnly}
              hint={order.delaiInstallationMois ? `Annoncée sous ${order.delaiInstallationMois} mois` : undefined}
              onChange={(pose) => update((p) => ({ ...p, pose }))}
            />
          </div>
        </Card>

        {/* ----------------------------------------------------- Commande matériel */}
        <Card className="p-5 sm:p-6">
          <SectionTitle sub="Fournisseur et date de commande de chaque produit vendu.">Commande du matériel</SectionTitle>
          <ul className="space-y-3">
            {materiel.map((l) => {
              const c = d.commandes[l.id] ?? {};
              return (
                <li key={l.id} className="grid sm:grid-cols-[1fr_14rem_10rem] gap-3 items-end">
                  <div>
                    <div className="font-medium leading-snug">{l.quantity > 1 ? `${l.quantity} × ` : ""}{l.label}</div>
                    <div className="text-xs text-muted">{categoryShort(l.category)}</div>
                  </div>
                  <Field label="Commandé chez">
                    <Input value={c.fournisseur ?? ""} disabled={readOnly} onChange={(e) => update((p) => ({ ...p, commandes: { ...p.commandes, [l.id]: { ...c, fournisseur: e.target.value } } }))} placeholder="Fournisseur" />
                  </Field>
                  <Field label="Le">
                    <Input type="date" value={c.date ?? ""} disabled={readOnly} onChange={(e) => update((p) => ({ ...p, commandes: { ...p.commandes, [l.id]: { ...c, date: e.target.value } } }))} />
                  </Field>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* -------------------------------------------------- Règlement / financement */}
        <Card className="p-5 sm:p-6">
          <SectionTitle sub="Montant, acompte, financement et solde.">Règlement et financement</SectionTitle>
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Montant de la vente">
              <Input value={eur(totals.totalTTC)} readOnly />
            </Field>
            <Field label="Mode de règlement">
              <Input value={order.financing.acompteMode === "virement" ? "Virement" : order.financing.acompteMode === "cheque" ? "Chèque" : "—"} readOnly />
            </Field>
            <Field label="Date acompte" hint={order.financing.echeancier.commande ? `Acompte : ${eur(order.financing.echeancier.commande)}` : undefined}>
              <Input type="date" value={d.acompteDate ?? ""} disabled={readOnly} onChange={(e) => update((p) => ({ ...p, acompteDate: e.target.value || undefined }))} />
            </Field>
            {credit && (
              <>
                <Field label="Organisme financier">
                  <Input value={`${order.financing.organisme ?? ""} · ${eur(totals.montantFinance)}`} readOnly />
                </Field>
                <Field label="Décision de l'organisme" className="sm:col-span-2">
                  <DecisionField value={d.financement} readOnly={readOnly} onChange={(financement) => update((p) => ({ ...p, financement }))} />
                </Field>
              </>
            )}
            <Field label="Solde reçu le">
              <Input type="date" value={d.soldeDate ?? ""} disabled={readOnly} onChange={(e) => update((p) => ({ ...p, soldeDate: e.target.value || undefined }))} />
            </Field>
            <Field label="Montant / solde reçu">
              <NumberInput value={d.soldeMontant} disabled={readOnly} onChange={(v) => update((p) => ({ ...p, soldeMontant: v }))} suffix="€" placeholder="0" />
            </Field>
          </div>
        </Card>

        {/* --------------------------------------------------------- Administratif */}
        <Card className="p-5 sm:p-6">
          <SectionTitle sub="DP mairie, contrat Enedis / prime, Consuel.">Démarches administratives</SectionTitle>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-[1fr_16rem] gap-3 items-end">
              <Field label="DP mairie déposée le">
                <Input type="date" value={d.dp.deposeeLe ?? ""} disabled={readOnly} onChange={(e) => update((p) => ({ ...p, dp: { ...p.dp, deposeeLe: e.target.value || undefined } }))} />
              </Field>
              <DecisionField value={d.dp.statut} readOnly={readOnly} onChange={(v) => setDecision("dp", v)} />
            </div>
            <div className="grid sm:grid-cols-[1fr_16rem] gap-3 items-end">
              <Field label="Contrat Enedis / prime">
                <Input value={d.enedis.reference ?? ""} disabled={readOnly} onChange={(e) => update((p) => ({ ...p, enedis: { ...p.enedis, reference: e.target.value } }))} placeholder="Référence, n° de dossier" />
              </Field>
              <DecisionField value={d.enedis.statut} readOnly={readOnly} onChange={(v) => setDecision("enedis", v)} />
            </div>
            <div className="grid sm:grid-cols-[1fr_16rem] gap-3 items-end">
              <Field label="Date Consuel">
                <Input type="date" value={d.consuel.date ?? ""} disabled={readOnly} onChange={(e) => update((p) => ({ ...p, consuel: { ...p.consuel, date: e.target.value || undefined } }))} />
              </Field>
              <DecisionField value={d.consuel.statut} readOnly={readOnly} onChange={(v) => setDecision("consuel", v)} />
            </div>
          </div>
        </Card>

        {/* ------------------------------------------------------------ Documents */}
        <Card className="p-5 sm:p-6">
          <SectionTitle sub="Cochez les documents reçus et joignez une photo prise à la tablette.">Documents</SectionTitle>
          <ul className="divide-y divide-line">
            {DOC_DEFS.map((def) => {
              const applicable = docApplicable(def, order);
              const doc = docOf(d, def.key);
              return (
                <li key={def.key} className="py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="sm:w-64 shrink-0">
                    <div className="font-medium">{def.label}</div>
                    {!applicable && <div className="text-xs text-muted">Non demandé (paiement comptant)</div>}
                  </div>
                  <div className="shrink-0">
                    <Toggle
                      checked={doc.recu}
                      onChange={(v) => !readOnly && update((p) => ({ ...p, documents: { ...p.documents, [def.key]: { ...docOf(p, def.key), recu: v } } }))}
                      label={doc.recu ? "Reçu" : applicable ? "À recevoir" : "—"}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <PhotoGrid
                      compact
                      scope={`dossiers/${order.id}/${def.key}`}
                      files={doc.files}
                      readOnly={readOnly}
                      onChange={(files) => update((p) => ({ ...p, documents: { ...p.documents, [def.key]: { ...docOf(p, def.key), files, recu: files.length > 0 ? true : docOf(p, def.key).recu } } }))}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="p-5 sm:p-6">
          <SectionTitle sub="Notes internes du secrétariat.">Observations</SectionTitle>
          <Textarea value={d.observations ?? ""} disabled={readOnly} onChange={(e) => update((p) => ({ ...p, observations: e.target.value }))} placeholder="Relances, appels, informations utiles…" />
        </Card>
      </div>
    </div>
  );
}
