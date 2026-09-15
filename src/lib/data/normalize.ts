import type { Order } from "../types";

type LegacyLine = Omit<Order["lines"][number], "unitPriceTTC" | "vatRate" | "category"> & { unitPriceHT?: number; unitPriceTTC?: number; vatRate?: number; category: string };
const LEGACY_CATEGORY: Record<string, Order["lines"][number]["category"]> = {
  pv_sans_stockage: "pv",
  pv_avec_stockage: "pv",
  stockage: "pv",
  pose: "pv",
  ecs: "ballon",
  pac_air_eau: "pac_air_eau",
  pac_air_air: "pac_air_air",
  ssc: "ssc",
  autre: "autre",
  pv: "pv",
  ballon: "ballon",
};
type LegacyFinancing = Omit<Order["financing"], "mode" | "echeancier"> & {
  mode?: string;
  echeancier?: Order["financing"]["echeancier"];
  acompte?: number;
  montantFinance?: number;
  mensualite?: number;
  taeg?: number;
};
type LegacyOrder = Omit<Partial<Order>, "lines" | "financing"> & { remiseHT?: number; lines?: LegacyLine[]; financing?: LegacyFinancing };

/** Convertit les bons enregistrés avec l'ancien modèle (prix HT, acompte unique, mode mixte). */
export function normalizeOrder(raw: LegacyOrder): Order {
  const vat = raw.vatRate ?? 20;
  const lines = (raw.lines ?? []).map((l) => {
    const { unitPriceHT, ...rest } = l;
    const unitPriceTTC = l.unitPriceTTC ?? (unitPriceHT !== undefined ? Math.round(unitPriceHT * (1 + vat / 100) * 100) / 100 : 0);
    return { ...rest, unitPriceTTC, vatRate: l.vatRate ?? vat, category: LEGACY_CATEGORY[l.category] ?? "autre" };
  });
  const f: LegacyFinancing = raw.financing ?? {};
  const { acompte, montantFinance, mensualite, taeg, ...fin } = f;
  void montantFinance;
  void mensualite;
  const financing: Order["financing"] = {
    ...fin,
    mode: fin.mode === "credit" || fin.mode === "mixte" ? "credit" : "comptant",
    echeancier: f.echeancier ?? { commande: acompte ?? 0, visiteTechnique: 0, livraison: 0, installation: 0 },
    taux: f.taux ?? taeg,
  };
  const remiseTTC = raw.remiseTTC ?? (raw.remiseHT !== undefined ? Math.round(raw.remiseHT * (1 + vat / 100) * 100) / 100 : 0);
  const customer = { chantierIdentique: true, ...(raw.customer ?? {}) } as Order["customer"];
  return { ...(raw as unknown as Order), customer, lines, financing, remiseTTC, vatRate: vat };
}
