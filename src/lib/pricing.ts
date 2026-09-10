import type { Order } from "./types";

export interface Totals {
  brutHT: number;
  remiseHT: number;
  totalHT: number;
  tva: number;
  totalTTC: number;
  acompte: number;
  montantFinance: number;
  soldeComptant: number;
  mensualite: number | null;
  coutTotalCredit: number | null;
}

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Mensualité d'un crédit amortissable classique. */
export function monthlyPayment(capital: number, taeg: number, months: number): number | null {
  if (!capital || !months || months <= 0) return null;
  if (!taeg || taeg <= 0) return round2(capital / months);
  const r = Math.pow(1 + taeg / 100, 1 / 12) - 1;
  return round2((capital * r) / (1 - Math.pow(1 + r, -months)));
}

export function computeTotals(order: Pick<Order, "lines" | "remiseHT" | "vatRate" | "financing">): Totals {
  const brutHT = round2(order.lines.reduce((s, l) => s + l.quantity * l.unitPriceHT, 0));
  const remiseHT = Math.min(round2(order.remiseHT || 0), brutHT);
  const totalHT = round2(brutHT - remiseHT);
  const tva = round2((totalHT * order.vatRate) / 100);
  const totalTTC = round2(totalHT + tva);
  const acompte = Math.min(round2(order.financing.acompte || 0), totalTTC);

  const f = order.financing;
  let montantFinance = 0;
  if (f.mode === "credit") montantFinance = round2(totalTTC - acompte);
  else if (f.mode === "mixte") montantFinance = Math.min(round2(f.montantFinance || 0), round2(totalTTC - acompte));

  const soldeComptant = round2(totalTTC - acompte - montantFinance);
  const mensualite =
    montantFinance > 0
      ? f.mensualite && f.mensualite > 0
        ? round2(f.mensualite)
        : monthlyPayment(montantFinance, f.taeg || 0, f.dureeMois || 0)
      : null;
  const coutTotalCredit = mensualite && f.dureeMois ? round2(mensualite * f.dureeMois) : null;

  return { brutHT, remiseHT, totalHT, tva, totalTTC, acompte, montantFinance, soldeComptant, mensualite, coutTotalCredit };
}
