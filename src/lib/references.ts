/**
 * Références produits proposées à la saisie (liste déroulante, saisie libre toujours possible).
 *
 * Les références sont fournies par Énergies Concept au fil de l'eau (cf. Arnaud) : une rubrique
 * par type de matériel. Une rubrique absente = saisie libre (marque et référence restent obligatoires).
 * Choisir une référence connue renseigne automatiquement la marque.
 *
 * En attente : micro-onduleurs, ballons, bornes de recharge, SSC.
 */
export interface Reference {
  marque: string;
  ref: string;
  /** Rappel affiché sous le champ (caractéristiques principales). */
  detail?: string;
}

export const REFERENCES: Record<string, Reference[]> = {
  /** Panneaux photovoltaïques. */
  panneaux: [
    {
      marque: "FHE",
      ref: "FHE-500W-BVN-MASTER",
      detail: "500 Wc · bi-verre bifacial full black · TOPCon · cellules G12 · garantie 30 ans matériel et puissance",
    },
  ],
  /** Batteries de stockage. */
  batteries: [
    { marque: "FHE", ref: "INFINITYCELL 6", detail: "Batterie haute tension · décharge 90 % · extensible jusqu'à 46,08 kWh · garantie 15 ans ou 6 000 cycles" },
    { marque: "FHE", ref: "INFINITYCELL 12", detail: "Batterie haute tension · décharge 90 % · extensible jusqu'à 46,08 kWh · garantie 15 ans ou 6 000 cycles" },
  ],
  /** Onduleurs hybrides. */
  onduleurs: [
    { marque: "FHE", ref: "MASTER HYBRID monophasé", detail: "Onduleur hybride monophasé haute tension · fonction backup · IP65 · jusqu'à 7 modules batterie (33,24 kWh) · garantie 15 ans pièces" },
    { marque: "FHE", ref: "ONDULEUR P3-S triphasé", detail: "Onduleur hybride triphasé 6 à 12 kW · haute tension, compatible batteries · IP65 · suivi à distance · garantie 15 ans pièces" },
  ],
  /** Pompes à chaleur air-eau, gamme Dynamic (monophasé 220-240 V, R-32, télécommande incluse). */
  pac: [
    { marque: "FHE", ref: "Dynamic 8", detail: "PAC air-eau R-32 · 8,4 kW (A7/W35) · SCOP 5,22 · 220-240 V mono · fusible D32" },
    { marque: "FHE", ref: "Dynamic 10", detail: "PAC air-eau R-32 · 10 kW (A7/W35) · SCOP 5,2 · 220-240 V mono · fusible D32" },
    { marque: "FHE", ref: "Dynamic 12", detail: "PAC air-eau R-32 · 12,1 kW (A7/W35) · SCOP 4,81 · 220-240 V mono · fusible D45" },
    { marque: "FHE", ref: "Dynamic 14", detail: "PAC air-eau R-32 · 14,5 kW (A7/W35) · SCOP 4,72 · 220-240 V mono · fusible D45" },
    { marque: "FHE", ref: "Dynamic 16", detail: "PAC air-eau R-32 · 15,9 kW (A7/W35) · SCOP 4,62 · 220-240 V mono · fusible D45" },
  ],
};

const norm = (s: string) => s.trim().toLowerCase();
export const referencesOf = (group?: string): Reference[] => (group ? REFERENCES[group] ?? [] : []);
export const marquesOf = (group?: string): string[] => [...new Set(referencesOf(group).map((r) => r.marque))];
/** Texte « marque référence » pour les champs qui regroupent les deux. */
export const referenceLabel = (r: Reference) => `${r.marque} ${r.ref}`;

/** Retrouve une référence connue à partir de la valeur saisie : la référence seule, ou « marque référence ». */
export const findReference = (group: string | undefined, value: string): Reference | undefined =>
  referencesOf(group).find((r) => norm(r.ref) === norm(value) || norm(referenceLabel(r)) === norm(value));
