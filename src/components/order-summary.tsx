"use client";

import type { Order } from "@/lib/types";
import { computeTotals } from "@/lib/pricing";
import { eur } from "@/lib/format";
import { categoryShort } from "@/lib/catalog";

const paymentLabel: Record<string, string> = { cheque: "chèque", virement: "virement", cb: "carte bancaire", especes: "espèces" };

export function OrderSummary({ order, compact }: { order: Order; compact?: boolean }) {
  const t = computeTotals(order);
  const f = order.financing;
  return (
    <div className="space-y-4">
      <div className="rounded-[16px] border border-line bg-panel overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface text-[10.5px] uppercase tracking-[0.12em] text-muted">
            <tr>
              <th className="text-left font-semibold px-4 py-2.5">Désignation</th>
              <th className="text-center font-semibold px-2 py-2.5 w-14">Qté</th>
              {!compact && <th className="text-right font-semibold px-3 py-2.5 w-28 hidden sm:table-cell">PU HT</th>}
              <th className="text-right font-semibold px-3 sm:px-4 py-2.5 w-28 sm:w-32">Total HT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {order.lines.map((l) => (
              <tr key={l.id}>
                <td className="px-3 sm:px-4 py-2.5">
                  <div className="font-medium leading-snug">{l.label}</div>
                  <div className="text-xs text-muted">{[l.detail, categoryShort(l.category)].filter(Boolean).join(" · ")}</div>
                  {!compact && <div className="text-xs text-muted sm:hidden">PU : {eur(l.unitPriceHT)} HT</div>}
                </td>
                <td className="text-center px-2 py-2.5">{l.quantity}</td>
                {!compact && <td className="text-right px-3 py-2.5 tabular-nums hidden sm:table-cell">{eur(l.unitPriceHT)}</td>}
                <td className="text-right px-3 sm:px-4 py-2.5 num font-semibold whitespace-nowrap">{eur(l.quantity * l.unitPriceHT)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-[16px] border border-line bg-panel p-4 text-sm space-y-1.5">
          <div className="text-[10px] uppercase tracking-[0.14em] text-muted font-bold mb-2">Paiement & financement</div>
          <div className="font-semibold">
            {f.mode === "comptant" ? "Paiement comptant" : f.mode === "credit" ? "Financement par crédit" : "Paiement mixte (comptant + crédit)"}
          </div>
          {t.acompte > 0 && (
            <div>
              Acompte : <b>{eur(t.acompte)}</b>
              {f.acompteMode ? ` (${paymentLabel[f.acompteMode]})` : ""}
            </div>
          )}
          {t.montantFinance > 0 && (
            <>
              <div>
                Montant financé : <b>{eur(t.montantFinance)}</b>
                {f.organisme ? ` · ${f.organisme}` : ""}
              </div>
              {(f.dureeMois || t.mensualite) && (
                <div>
                  {f.dureeMois ? `${f.dureeMois} mensualités` : "Mensualités"}
                  {t.mensualite ? ` de ${eur(t.mensualite)}` : ""}
                  {f.taeg ? ` · TAEG ${f.taeg} %` : ""}
                  {f.reportMois ? ` · report ${f.reportMois} mois` : ""}
                </div>
              )}
            </>
          )}
          {t.soldeComptant > 0 && (
            <div>
              Solde à l&apos;installation : <b>{eur(t.soldeComptant)}</b>
            </div>
          )}
          {f.aides ? <div className="text-muted">Aides estimées : {eur(f.aides)} (indicatif)</div> : null}
          {f.commentaire && <div className="text-muted">{f.commentaire}</div>}
        </div>

        <div className="rounded-[16px] bg-night text-white p-4 text-sm">
          <div className="space-y-1.5">
            {t.remiseHT > 0 && (
              <>
                <Row label="Sous-total HT" value={eur(t.brutHT)} />
                <Row label="Remise HT" value={`- ${eur(t.remiseHT)}`} />
              </>
            )}
            <Row label="Total HT" value={eur(t.totalHT)} />
            <Row label={`TVA ${order.vatRate} %`} value={eur(t.tva)} />
          </div>
          <div className="mt-3 rounded-[12px] bg-brand-orange text-white px-4 py-3 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em]">Total TTC</span>
            <span className="num font-semibold text-[22px]">{eur(t.totalTTC)}</span>
          </div>
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
