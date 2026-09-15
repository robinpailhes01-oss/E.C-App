import type { Order, OrderLine } from "./types";

export interface Totals {
  brutTTC: number;
  remiseTTC: number;
  totalTTC: number;
  totalHT: number;
  tva: number;
  /** TVA ventilée par taux (clé = taux en %). */
  tvaParTaux: Record<string, { baseHT: number; tva: number; ttc: number }>;
  /** Somme des règlements de l'échéancier (acomptes / apport). */
  acomptes: number;
  /** Comptant : montant non encore réparti dans l'échéancier. */
  resteARepartir: number;
  /** Crédit : capital financé (TTC moins apport). */
  montantFinance: number;
  mensualiteHorsAssurance: number | null;
  assuranceMensuelle: number | null;
  mensualite: number | null;
  coutTotalCredit: number | null;
  coutTotalHorsAssurance: number | null;
}

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** HT à partir d'un TTC et d'un taux de TVA. */
export const ttcToHT = (ttc: number, vatRate: number) => round2(ttc / (1 + vatRate / 100));

export const lineTTC = (l: OrderLine) => round2(l.quantity * l.unitPriceTTC);
export const lineHT = (l: OrderLine) => ttcToHT(lineTTC(l), l.vatRate);

/** Mensualité d'un crédit amortissable (taux débiteur annuel, mensualité constante). */
export function monthlyPayment(capital: number, tauxAnnuel: number, months: number): number | null {
  if (!capital || capital <= 0 || !months || months <= 0) return null;
  if (!tauxAnnuel || tauxAnnuel <= 0) return round2(capital / months);
  const r = tauxAnnuel / 100 / 12;
  return round2((capital * r) / (1 - Math.pow(1 + r, -months)));
}

/** Prime d'assurance mensuelle : % annuel du capital emprunté. */
export const monthlyInsurance = (capital: number, tauxAssuranceAnnuel: number) =>
  capital > 0 && tauxAssuranceAnnuel > 0 ? round2((capital * tauxAssuranceAnnuel) / 100 / 12) : 0;

export const scheduleSum = (e: Order["financing"]["echeancier"]) =>
  round2((e?.commande || 0) + (e?.visiteTechnique || 0) + (e?.livraison || 0) + (e?.installation || 0));

export function computeTotals(order: Pick<Order, "lines" | "remiseTTC" | "vatRate" | "financing">): Totals {
  const brutTTC = round2(order.lines.reduce((s, l) => s + lineTTC(l), 0));
  const remiseTTC = Math.min(round2(order.remiseTTC || 0), brutTTC);
  const totalTTC = round2(brutTTC - remiseTTC);
  // La remise est répartie proportionnellement sur chaque taux de TVA.
  const ratio = brutTTC > 0 ? totalTTC / brutTTC : 0;
  const tvaParTaux: Totals["tvaParTaux"] = {};
  for (const l of order.lines) {
    const key = String(l.vatRate);
    const ttc = round2(lineTTC(l) * ratio);
    const ht = ttcToHT(ttc, l.vatRate);
    const cur = (tvaParTaux[key] ||= { baseHT: 0, tva: 0, ttc: 0 });
    cur.ttc = round2(cur.ttc + ttc);
    cur.baseHT = round2(cur.baseHT + ht);
    cur.tva = round2(cur.tva + (ttc - ht));
  }
  const totalHT = round2(Object.values(tvaParTaux).reduce((s, v) => s + v.baseHT, 0));
  const tva = round2(totalTTC - totalHT);

  const f = order.financing;
  const acomptes = Math.min(scheduleSum(f.echeancier), totalTTC);
  const resteARepartir = f.mode === "comptant" ? round2(totalTTC - acomptes) : 0;
  const montantFinance = f.mode === "credit" ? round2(totalTTC - acomptes) : 0;

  const mensualiteHorsAssurance = montantFinance > 0 ? monthlyPayment(montantFinance, f.taux || 0, f.dureeMois || 0) : null;
  const assuranceMensuelle = montantFinance > 0 && f.avecAssurance ? monthlyInsurance(montantFinance, f.tauxAssurance || 0) : null;
  const mensualite = mensualiteHorsAssurance !== null ? round2(mensualiteHorsAssurance + (assuranceMensuelle ?? 0)) : null;
  const coutTotalCredit = mensualite && f.dureeMois ? round2(mensualite * f.dureeMois) : null;
  const coutTotalHorsAssurance = mensualiteHorsAssurance && f.dureeMois ? round2(mensualiteHorsAssurance * f.dureeMois) : null;

  return { brutTTC, remiseTTC, totalTTC, totalHT, tva, tvaParTaux, acomptes, resteARepartir, montantFinance, mensualiteHorsAssurance, assuranceMensuelle, mensualite, coutTotalCredit, coutTotalHorsAssurance };
}

/** Tableau des mensualités pour chaque durée proposée (avec et sans assurance). */
export function paymentTable(capital: number, taux: number, tauxAssurance: number, durees: number[]) {
  const assurance = monthlyInsurance(capital, tauxAssurance);
  return durees.map((mois) => {
    const sans = monthlyPayment(capital, taux, mois) ?? 0;
    return { mois, sansAssurance: sans, avecAssurance: round2(sans + assurance), coutTotal: round2(sans * mois), coutTotalAvecAssurance: round2((sans + assurance) * mois) };
  });
}
