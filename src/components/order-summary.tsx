"use client";

import type { Order } from "@/lib/types";
import { computeTotals, ttcToHT } from "@/lib/pricing";
import { attrsText } from "./order-wizard/step-products";
import { eur } from "@/lib/format";
import { categoryShort } from "@/lib/catalog";

const paymentLabel: Record<string, string> = { cheque: "chèque", virement: "virement", cb: "carte bancaire", especes: "espèces" };

export function scheduleRows(order: Order) {
  const e = order.financing.echeancier;
  return [
    ["À la commande", e.commande],
    ["À la visite technique", e.visiteTechnique],
    ["À la livraison", e.livraison],
    ["À l'installation", e.installation],
  ].filter(([, v]) => (v as number) > 0) as [string, number][];
}

export function OrderSummary({ order, compact }: { order: Order; compact?: boolean }) {
  const t = computeTotals(order);
  const f = order.financing;
  const rows = scheduleRows(order);
  return (
    <div className="space-y-4">
      <div className="rounded-[16px] border border-line bg-panel overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface text-[10.5px] uppercase tracking-[0.12em] text-muted">
            <tr>
              <th className="text-left font-semibold px-3 sm:px-4 py-2.5">Désignation</th>
              <th className="text-center font-semibold px-2 py-2.5 w-14">Qté</th>
              {!compact && <th className="text-right font-semibold px-3 py-2.5 w-28 hidden sm:table-cell">PU TTC</th>}
              <th className="text-right font-semibold px-3 sm:px-4 py-2.5 w-28 sm:w-32">Total TTC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {order.lines.map((l) => (
              <tr key={l.id}>
                <td className="px-3 sm:px-4 py-2.5">
                  <div className="font-medium leading-snug">{l.label}</div>
                  <div className="text-xs text-muted">{[categoryShort(l.category), attrsText(l), l.detail].filter(Boolean).join(" · ")}</div>
                  <div className="text-xs text-muted">
                    {!compact && <span className="sm:hidden">PU {eur(l.unitPriceTTC)} TTC · </span>}
                    {eur(ttcToHT(l.unitPriceTTC, l.vatRate))} HT / unité · TVA {l.vatRate} %
                  </div>
                </td>
                <td className="text-center px-2 py-2.5">{l.quantity}</td>
                {!compact && <td className="text-right px-3 py-2.5 tabular-nums hidden sm:table-cell">{eur(l.unitPriceTTC)}</td>}
                <td className="text-right px-3 sm:px-4 py-2.5 num font-semibold whitespace-nowrap">{eur(l.quantity * l.unitPriceTTC)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-[16px] border border-line bg-panel p-4 text-sm space-y-1.5">
          <div className="text-[10px] uppercase tracking-[0.14em] text-muted font-bold mb-2">Paiement</div>
          <div className="font-semibold">{f.mode === "comptant" ? "Paiement comptant" : `Financement ${f.organisme ?? ""}`.trim()}</div>
          {rows.length > 0 && (
            <ul className="space-y-0.5">
              {rows.map(([label, v]) => (
                <li key={label} className="flex justify-between">
                  <span className="text-muted">{label}</span>
                  <b className="num">{eur(v)}</b>
                </li>
              ))}
            </ul>
          )}
          {(f.echeancier.commande || 0) > 0 && f.acompteMode && (
            <div className="text-muted text-xs">
              Acompte par {paymentLabel[f.acompteMode]}
              {f.chequeRecupere ? " · chèque récupéré" : ""}
            </div>
          )}
          {f.mode === "comptant" && t.resteARepartir > 0 && (
            <div className="text-brand-orange-dark font-medium">Reste à répartir : {eur(t.resteARepartir)}</div>
          )}
          {f.mode === "credit" && (
            <>
              <div>
                Montant financé : <b className="num">{eur(t.montantFinance)}</b>
              </div>
              {t.mensualite && f.dureeMois ? (
                <div>
                  <b>{f.dureeMois} mensualités de {eur(t.mensualite)}</b> {f.avecAssurance ? "avec" : "sans"} assurance · taux {String(f.taux ?? 0).replace(".", ",")} %
                  {f.reportJours ? ` · report ${f.reportJours} jours` : ""}
                </div>
              ) : (
                <div className="text-brand-orange-dark font-medium">Durée non choisie</div>
              )}
              <div className="text-xs text-muted">Sous réserve d&apos;acceptation du dossier par l&apos;organisme de financement.</div>
            </>
          )}
          {f.aides ? <div className="text-muted">Aides estimées : {eur(f.aides)} (indicatif)</div> : null}
          {f.commentaire && <div className="text-muted">{f.commentaire}</div>}
        </div>

        <div className="rounded-[16px] bg-night text-white p-4 text-sm">
          <div className="space-y-1.5">
            {t.remiseTTC > 0 && (
              <>
                <Row label="Sous-total TTC" value={eur(t.brutTTC)} />
                <Row label="Remise TTC" value={`- ${eur(t.remiseTTC)}`} />
              </>
            )}
            <Row label="Total HT" value={eur(t.totalHT)} />
            {Object.keys(t.tvaParTaux)
              .sort((a, b) => parseFloat(b) - parseFloat(a))
              .map((k) => (
                <Row key={k} label={`TVA ${k} %`} value={eur(t.tvaParTaux[k].tva)} />
              ))}
          </div>
          <div className="mt-3 rounded-[12px] bg-brand-orange text-white px-4 py-3 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em]">Total TTC</span>
            <span className="num font-semibold text-[22px]">{eur(t.totalTTC)}</span>
          </div>
          {order.delaiInstallationMois ? <div className="text-xs text-white/60 mt-3">Délai d&apos;installation : {order.delaiInstallationMois} mois</div> : null}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-white/60">{label}</span>
      <span className="num font-semibold">{value}</span>
    </div>
  );
}
