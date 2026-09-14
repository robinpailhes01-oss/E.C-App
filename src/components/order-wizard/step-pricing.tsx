"use client";

import type { Financing, Order } from "@/lib/types";
import { FINANCING_ORGANISMS, VAT_RATES } from "@/lib/catalog";
import { computeTotals, monthlyPayment } from "@/lib/pricing";
import { eur } from "@/lib/format";
import { Field, Input, SectionTitle, SegmentedControl, Select, Textarea } from "@/components/ui";
import { NumberInput } from "@/components/number-input";

export function StepPricing({ order, onChange }: { order: Order; onChange: (patch: Partial<Order>) => void }) {
  const t = computeTotals(order);
  const f = order.financing;
  const setF = (patch: Partial<Financing>) => onChange({ financing: { ...f, ...patch } });
  const setLine = (id: string, patch: { quantity?: number; unitPriceHT?: number }) =>
    onChange({ lines: order.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)) });

  const estimated = t.montantFinance > 0 ? monthlyPayment(t.montantFinance, f.taeg || 0, f.dureeMois || 0) : null;

  return (
    <div className="space-y-8">
      <section>
        <SectionTitle sub="Prix catalogue pré-remplis en HT, ajustables ligne par ligne.">Tarifs</SectionTitle>
        {/* Mobile : cartes */}
        <ul className="sm:hidden space-y-2.5">
          {order.lines.map((l) => (
            <li key={l.id} className="rounded-[16px] border border-line bg-panel p-3.5">
              <div className="font-medium leading-snug">{l.label}</div>
              <div className="grid grid-cols-[4.5rem_1fr_auto] gap-2 items-end mt-2.5">
                <Field label="Qté">
                  <Input type="number" min={1} value={l.quantity} onChange={(e) => setLine(l.id, { quantity: Math.max(1, parseInt(e.target.value || "1", 10)) })} className="text-center h-10 px-1" />
                </Field>
                <Field label="PU HT">
                  <NumberInput value={l.unitPriceHT} onChange={(v) => setLine(l.id, { unitPriceHT: v ?? 0 })} suffix="€" className="text-right h-10" />
                </Field>
                <div className="text-right pb-2.5">
                  <div className="text-[10px] uppercase tracking-[0.12em] text-muted font-bold">Total HT</div>
                  <div className="num font-semibold">{eur(l.quantity * l.unitPriceHT)}</div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Tablette / bureau : tableau */}
        <div className="hidden sm:block rounded-[16px] border border-line bg-panel overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface text-[10.5px] uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="text-left font-semibold px-4 py-2.5">Désignation</th>
                <th className="text-center font-semibold px-2 py-2.5 w-20">Qté</th>
                <th className="text-right font-semibold px-2 py-2.5 w-40">PU HT</th>
                <th className="text-right font-semibold px-4 py-2.5 w-32">Total HT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {order.lines.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-2.5">
                    <div className="font-medium leading-snug">{l.label}</div>
                  </td>
                  <td className="px-2 py-2">
                    <Input type="number" min={1} value={l.quantity} onChange={(e) => setLine(l.id, { quantity: Math.max(1, parseInt(e.target.value || "1", 10)) })} className="text-center h-10 px-1" />
                  </td>
                  <td className="px-2 py-2">
                    <NumberInput value={l.unitPriceHT} onChange={(v) => setLine(l.id, { unitPriceHT: v ?? 0 })} suffix="€" className="text-right h-10" />
                  </td>
                  <td className="text-right px-4 py-2.5 num font-semibold">{eur(l.quantity * l.unitPriceHT)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mt-4">
          <Field label="Remise commerciale (HT)" hint="Montant en euros déduit du total HT">
            <NumberInput value={order.remiseHT || undefined} onChange={(v) => onChange({ remiseHT: v ?? 0 })} suffix="€" placeholder="0" />
          </Field>
          <Field label="Taux de TVA" hint="20 % par défaut">
            <Select value={order.vatRate} onChange={(e) => onChange({ vatRate: parseFloat(e.target.value) })}>
              {VAT_RATES.map((r) => (
                <option key={r} value={r}>
                  {r} %
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Date d'installation prévue">
            <Input type="date" value={order.dateInstallationPrevue ?? ""} onChange={(e) => onChange({ dateInstallationPrevue: e.target.value })} />
          </Field>
        </div>

        <div className="mt-4 rounded-[16px] bg-night text-white p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <Stat label="Total HT" value={eur(t.totalHT)} />
          <Stat label={`TVA ${order.vatRate} %`} value={eur(t.tva)} />
          <Stat label="Remise" value={t.remiseHT ? `- ${eur(t.remiseHT)}` : "—"} />
          <Stat label="Total TTC" value={eur(t.totalTTC)} accent />
        </div>
      </section>

      <section>
        <SectionTitle sub="Comptant, crédit ou mixte.">Financement</SectionTitle>
        <SegmentedControl
          value={f.mode}
          onChange={(mode) => setF({ mode, montantFinance: mode === "mixte" ? f.montantFinance : undefined })}
          options={[
            { value: "comptant", label: "Comptant" },
            { value: "credit", label: "Crédit" },
            { value: "mixte", label: "Mixte" },
          ]}
          className="max-w-md"
        />

        <div className="grid sm:grid-cols-3 gap-4 mt-4">
          <Field label="Acompte à la commande (TTC)" hint="Aucun encaissement avant 7 jours (vente à domicile)">
            <NumberInput value={f.acompte || undefined} onChange={(v) => setF({ acompte: v ?? 0 })} suffix="€" placeholder="0" />
          </Field>
          <Field label="Mode de règlement de l'acompte">
            <Select value={f.acompteMode ?? "cheque"} onChange={(e) => setF({ acompteMode: e.target.value as Financing["acompteMode"] })}>
              <option value="cheque">Chèque</option>
              <option value="virement">Virement</option>
              <option value="cb">Carte bancaire</option>
              <option value="especes">Espèces</option>
            </Select>
          </Field>
          <Field label="Aides / primes estimées" hint="Indicatif, non déduit du bon">
            <NumberInput value={f.aides} onChange={(v) => setF({ aides: v })} suffix="€" placeholder="0" />
          </Field>
        </div>

        {f.mode !== "comptant" && (
          <div className="mt-4 rounded-[16px] border border-brand-blue/25 bg-brand-blue-soft/60 p-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="Organisme de crédit">
                <Select value={f.organisme ?? ""} onChange={(e) => setF({ organisme: e.target.value })}>
                  <option value="">— Choisir —</option>
                  {FINANCING_ORGANISMS.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </Select>
              </Field>
              {f.mode === "mixte" ? (
                <Field label="Montant financé (TTC)" hint={`Max ${eur(t.totalTTC - t.acompte)}`}>
                  <NumberInput value={f.montantFinance} onChange={(v) => setF({ montantFinance: v })} suffix="€" />
                </Field>
              ) : (
                <Field label="Montant financé (TTC)" hint="Total TTC moins acompte">
                  <Input value={eur(t.montantFinance)} readOnly />
                </Field>
              )}
              <Field label="Durée (mois)">
                <NumberInput value={f.dureeMois} onChange={(v) => setF({ dureeMois: v ? Math.round(v) : undefined })} suffix="mois" placeholder="ex. 120" />
              </Field>
              <Field label="TAEG (%)">
                <NumberInput value={f.taeg} onChange={(v) => setF({ taeg: v })} suffix="%" placeholder="ex. 4,9" />
              </Field>
              <Field label="Report (mois)">
                <NumberInput value={f.reportMois} onChange={(v) => setF({ reportMois: v ? Math.round(v) : undefined })} suffix="mois" placeholder="0" />
              </Field>
              <Field label="Mensualité (€)" hint={estimated ? `Estimation : ${eur(estimated)} / mois` : "Renseignez durée et TAEG"}>
                <NumberInput value={f.mensualite} onChange={(v) => setF({ mensualite: v })} suffix="€" placeholder={estimated ? String(estimated) : ""} />
              </Field>
            </div>
            {t.mensualite && f.dureeMois ? (
              <p className="text-sm mt-3">
                <b>{f.dureeMois} × {eur(t.mensualite)}</b> = {eur(t.coutTotalCredit)} au total
                {t.soldeComptant > 0 ? ` · solde comptant à l'installation : ${eur(t.soldeComptant)}` : ""}
              </p>
            ) : null}
          </div>
        )}

        {f.mode === "comptant" && t.soldeComptant > 0 && (
          <p className="text-sm mt-3 text-muted">
            Solde à régler à l&apos;installation : <b className="text-ink">{eur(t.soldeComptant)}</b>
          </p>
        )}

        <Field label="Commentaire financement" className="mt-4">
          <Textarea value={f.commentaire ?? ""} onChange={(e) => setF({ commentaire: e.target.value })} placeholder="Conditions particulières, assurance emprunteur…" className="min-h-20" />
        </Field>
      </section>

      <section>
        <SectionTitle sub="Imprimées sur le bon de commande.">Observations</SectionTitle>
        <Textarea value={order.notes ?? ""} onChange={(e) => onChange({ notes: e.target.value })} placeholder="Précisions techniques, accès, contraintes de pose, matériel existant…" />
      </section>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={accent ? "rounded-[12px] bg-brand-orange px-3 py-2.5" : "px-3 py-2.5"}>
      <div className={`text-[10px] uppercase tracking-[0.14em] font-bold ${accent ? "text-white/80" : "text-white/55"}`}>{label}</div>
      <div className={`num font-semibold mt-0.5 ${accent ? "text-white text-xl" : "text-white text-[17px]"}`}>{value}</div>
    </div>
  );
}
