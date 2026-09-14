import type { Order } from "../types";

type LegacyLine = Omit<Order["lines"][number], "unitPriceTTC"> & { unitPriceHT?: number; unitPriceTTC?: number };
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
    return { ...rest, unitPriceTTC };
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
  return { ...(raw as unknown as Order), lines, financing, remiseTTC, vatRate: vat };
}
