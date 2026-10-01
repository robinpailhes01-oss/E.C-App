/**
 * Références produits proposées à la saisie (liste déroulante).
 *
 * EN ATTENTE des références fournies par Énergies Concept : tant que la liste est vide,
 * la marque et la référence se saisissent librement (elles restent obligatoires).
 * Clés : identifiant produit (ex. "pv-3") ou rubrique (ex. "pv").
 */
export const REFERENCES: Record<string, { marques?: string[]; refs?: string[] }> = {};

export const referencesFor = (productId: string | undefined, category: string) => REFERENCES[productId ?? ""] ?? REFERENCES[category] ?? {};
