import type { Order, OrderLine } from "./types";

export const DEFAULT_POSE_RATE = 15;

export interface Component {
  ttc: number;
  ht: number;
  tva: number;
  rate: number;
}

export interface LineParts {
  /** TTC de la ligne (quantité × prix unitaire). */
  ttc: number;
  /** Matériel = TTC − installation. */
  materiel: Component;
  /** Installation : part du TTC (taux de pose), TVA propre. Absente si la ligne n'en contient pas. */
  pose: (Component & { pct: number }) | null;
}

export interface Totals {
  brutTTC: number;
  remiseTTC: number;
  totalTTC: number;
  totalHT: number;
  tva: number;
  /** Dont installation (toutes lignes). */
  pose: { ttc: number; ht: number; tva: number };
  /** TVA ventilée par taux (clé = taux en %), matériel et installation confondus. */
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

const component = (ttc: number, rate: number): Component => {
  const ht = ttcToHT(ttc, rate);
  return { ttc, ht, tva: round2(ttc - ht), rate };
};

export const poseRateOf = (o: Pick<Order, "poseRate">) => (o.poseRate === undefined || o.poseRate === null ? DEFAULT_POSE_RATE : o.poseRate);

/**
 * Décompose une ligne : le prix saisi (TTC) comprend toujours l'installation.
 * Installation = taux de pose × TTC ; matériel = TTC − installation (« matériel − pose = total »).
 */
export function lineParts(l: OrderLine, poseRate: number, ratio = 1): LineParts {
  const ttc = round2(l.quantity * l.unitPriceTTC * ratio);
  const poseTTC = l.poseIncluse && poseRate > 0 ? round2((ttc * poseRate) / 100) : 0;
  const matTTC = round2(ttc - poseTTC);
  return {
    ttc,
    materiel: component(matTTC, l.vatRate),
    pose: l.poseIncluse && poseRate > 0 ? { ...component(poseTTC, l.poseVatRate ?? 20), pct: poseRate } : null,
  };
}

export const lineTTC = (l: OrderLine) => round2(l.quantity * l.unitPriceTTC);

/** Mensualité d'un crédit amortissable (taux débiteur annuel, mensualité constante). */
export function monthlyPayment(capital: number, tauxAnnuel: number, months: number): number | null {
  if (!capital || capital <= 0 || !months || months <= 0) return null;
  if (!tauxAnnuel || tauxAnnuel <= 0) return round2(capital / months);
  const r = tauxAnnuel / 100 / 12;
  return round2((capital * r) / (1 - Math.pow(1 + r, -months)));
}

/** Prime d'assurance DIM mensuelle : % annuel du capital emprunté. */
export const monthlyInsurance = (capital: number, tauxAssuranceAnnuel: number) =>
  capital > 0 && tauxAssuranceAnnuel > 0 ? round2((capital * tauxAssuranceAnnuel) / 100 / 12) : 0;

export const scheduleSum = (e: Order["financing"]["echeancier"]) =>
  round2((e?.commande || 0) + (e?.visiteTechnique || 0) + (e?.livraison || 0) + (e?.installation || 0));

export function computeTotals(order: Pick<Order, "lines" | "remiseTTC" | "vatRate" | "financing" | "poseRate">): Totals {
  const poseRate = poseRateOf(order);
  const brutTTC = round2(order.lines.reduce((s, l) => s + lineTTC(l), 0));
  const remiseTTC = Math.min(round2(order.remiseTTC || 0), brutTTC);
  const totalTTC = round2(brutTTC - remiseTTC);
  // La remise est répartie proportionnellement sur chaque composant (matériel / installation).
  const ratio = brutTTC > 0 ? totalTTC / brutTTC : 0;
  const tvaParTaux: Totals["tvaParTaux"] = {};
  const pose = { ttc: 0, ht: 0, tva: 0 };
  const add = (c: Component) => {
    const cur = (tvaParTaux[String(c.rate)] ||= { baseHT: 0, tva: 0, ttc: 0 });
    cur.ttc = round2(cur.ttc + c.ttc);
    cur.baseHT = round2(cur.baseHT + c.ht);
    cur.tva = round2(cur.tva + c.tva);
  };
  for (const l of order.lines) {
    const parts = lineParts(l, poseRate, ratio);
    add(parts.materiel);
    if (parts.pose) {
      add(parts.pose);
      pose.ttc = round2(pose.ttc + parts.pose.ttc);
      pose.ht = round2(pose.ht + parts.pose.ht);
      pose.tva = round2(pose.tva + parts.pose.tva);
    }
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

  return { brutTTC, remiseTTC, totalTTC, totalHT, tva, pose, tvaParTaux, acomptes, resteARepartir, montantFinance, mensualiteHorsAssurance, assuranceMensuelle, mensualite, coutTotalCredit, coutTotalHorsAssurance };
}

/** Tableau des mensualités pour chaque durée proposée (avec et sans assurance DIM). */
export function paymentTable(capital: number, taux: number, tauxAssurance: number, durees: number[]) {
  const assurance = monthlyInsurance(capital, tauxAssurance);
  return durees.map((mois) => {
    const sans = monthlyPayment(capital, taux, mois) ?? 0;
    return { mois, sansAssurance: sans, avecAssurance: round2(sans + assurance), coutTotal: round2(sans * mois), coutTotalAvecAssurance: round2((sans + assurance) * mois) };
  });
}
