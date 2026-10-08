import type { Product, ProductAttribute, ProductCategory } from "./types";

/**
 * CATALOGUE Énergies Concept : familles et articles du bon de commande papier.
 *
 * Les prix de la grille tarifaire sont des prix CONSEILLÉS TTC : ils ne sont jamais pré-remplis,
 * le commercial saisit son prix et un « i » bleu lui rappelle le prix conseillé.
 * Le prix saisi comprend l'installation (voir pricing.ts : part de pose automatique).
 */
export const DEFAULT_VAT_RATE = 20;
export const VAT_RATES = [20, 10, 5.5] as const;

export const CATEGORIES: { id: ProductCategory; label: string; short: string; color: string }[] = [
  { id: "pv", label: "Kit photovoltaïque en autoconsommation", short: "Photovoltaïque", color: "#2b84b8" },
  { id: "ballon", label: "Ballon thermodynamique · eau chaude sanitaire", short: "Ballon thermo", color: "#c0507a" },
  { id: "pac_air_eau", label: "Pompe à chaleur air-eau", short: "PAC air-eau", color: "#5c9a2e" },
  { id: "pac_air_air", label: "Chauffage réversible air/air", short: "PAC air/air", color: "#d9781a" },
  { id: "ssc", label: "Système solaire combiné", short: "Solaire combiné", color: "#9a6b12" },
  { id: "autre", label: "Autres produits", short: "Autres", color: "#7c5cbf" },
];

export const categoryLabel = (id: ProductCategory) => CATEGORIES.find((c) => c.id === id)?.label ?? id;
export const categoryShort = (id: ProductCategory) => CATEGORIES.find((c) => c.id === id)?.short ?? id;
export const categoryColor = (id: ProductCategory) => CATEGORIES.find((c) => c.id === id)?.color ?? "#9ca3af";

/** Libellé de la ligne d'installation imprimée sous chaque produit. */
export const installationLabel = (cat: ProductCategory) =>
  ({
    pv: "Installation et mise en service photovoltaïque",
    ballon: "Installation et mise en service thermodynamique",
    pac_air_eau: "Installation et mise en service pompe à chaleur",
    pac_air_air: "Installation et mise en service pompe à chaleur Air/Air",
    ssc: "Installation et mise en service solaire combiné",
    autre: "Installation et mise en service",
  })[cat];

const PV_DESC =
  "Panneaux photovoltaïques monocristallins de 500 Wc, demi-cellules, rectangulaires, technologie TOPCON, module bi-verre et bi-facial. Garantie 30 ans de rendement à 87,4 % de production. Kit de montage sur mesure : crochets tuiles, rails, vis à bois, étrier inter./exter., câble et coffret AC.";
export const MICRO_DESC = "Micro-onduleurs garantie 25 ans, taux d'efficacité MPPT de 99,8 %, conformes à la norme EN 50549-1:2019. Plage de puissance DC du module 400-670.";
const BALLON_DESC = "3 modes de fonctionnement intelligent éco / hybride / électrique. Label énergétique A+. Garantie 3 ans cuve et 2 ans pièces.";
const PAC_DESC =
  "Module hydraulique, groupe extérieur, contrôleur, télécommande modulante + récepteur, soupape de décharge différentielle, réchauffeur, disjoncteur, câble, couronne cuivre bitube isolée. Garantie fabricant 3 ans pièces + 5 ans compresseur.";
const CARPORT_DESC = "Carport solaire en aluminium, panneaux BIPV Polaris structurellement étanches, poteaux réglables en hauteur, gouttière sans descente. Garantie 15 ans pièces.";
const AIRAIR_DESC = "Garantie 3 ans pièces + 5 ans compresseur.";

/** Marque et référence : obligatoires pour tout matériel (références en attente, voir references.ts). */
const marque = (label = "Marque", suggest?: string): ProductAttribute => ({ key: "marque", label, type: "text", required: true, placeholder: "ex. fabricant", suggest });
const ref = (label = "Référence", suggest?: string): ProductAttribute => ({ key: "ref", label, type: "text", required: true, placeholder: "référence constructeur", suggest });

const ONDULEUR_REF: ProductAttribute = { key: "onduleurRef", label: "Onduleur · marque / référence", type: "text", placeholder: "facultatif", suggest: "onduleurs" };
const BATTERIE_REF: ProductAttribute = { key: "batterieRef", label: "Batterie · marque / référence", type: "text", placeholder: "facultatif", suggest: "batteries" };
const ONDULEUR: ProductAttribute[] = [
  { key: "onduleur", label: "Onduleur", type: "select", options: ["Micro-onduleurs", "Onduleur hybride"], default: "Micro-onduleurs" },
  ONDULEUR_REF,
];
const kitAttrs = (stockage: boolean): ProductAttribute[] => [
  marque("Marque des panneaux", "panneaux"),
  ref("Référence des panneaux", "panneaux"),
  ...ONDULEUR.map((a) => (a.key === "onduleur" && stockage ? { ...a, default: "Onduleur hybride" } : a)),
  ...(stockage ? [BATTERIE_REF] : []),
];
const PAC_ATTRS: ProductAttribute[] = [
  marque("Marque", "pac"),
  ref("Référence", "pac"),
  { key: "type", label: "Type", type: "select", options: ["Bi-bloc", "Mono-bloc"] },
  { key: "mode", label: "Chaudière", type: "select", options: ["Relève de chaudière", "En suppression de la chaudière"] },
  { key: "phase", label: "Alimentation", type: "select", options: ["Monophasé", "Triphasé"] },
];

type P = Omit<Product, "priceTTC"> & Partial<Pick<Product, "priceTTC">>;
const p = (x: P): Product => ({ priceTTC: 0, ...x });

const fmtKw = (n: number | string) => String(n).replace(".", ",");

export const PRODUCTS: Product[] = [
  // ============================================================ Photovoltaïque
  ...([
    [3, 9900],
    [6, 15900],
    [9, 21900],
  ] as const).map(([kw, prix]) =>
    p({ id: `pv-${kw}`, category: "pv", group: "Kits sans stockage", label: `Kit photovoltaïque ${kw} kW en autoconsommation`, description: PV_DESC, priceTTC: prix, attributes: kitAttrs(false) }),
  ),
  p({
    id: "pv-custom",
    category: "pv",
    group: "Kits sans stockage",
    label: "Kit photovoltaïque personnalisé",
    custom: true,
    description: PV_DESC,
    attributes: [{ key: "puissance", label: "Puissance du kit", type: "number", unit: "kW", required: true, hideInSummary: true, placeholder: "ex. 4,5" }, ...kitAttrs(false)],
    labelFrom: (a) => `Kit photovoltaïque ${fmtKw(a.puissance || "…")} kW en autoconsommation`,
  }),

  ...([
    [2, 13900],
    [3, 14900],
    [5, 15900],
    [6, 18900],
  ] as const).map(([kw, prix]) =>
    p({ id: `pvs-${kw}`, category: "pv", group: "Kits avec stockage", label: `Kit photovoltaïque ${kw} kW en autoconsommation + stockage 5 kW`, description: PV_DESC, priceTTC: prix, attributes: kitAttrs(true) }),
  ),
  p({
    id: "pvs-9",
    category: "pv",
    group: "Kits avec stockage",
    label: "Kit photovoltaïque 9 kW en autoconsommation + stockage 10 kW",
    description: PV_DESC,
    priceTTC: 30800,
    priceNote: "Kit 9 kW + stockage 5 kW de la grille (24 900 €) + stockage supplémentaire 5 kW (5 900 €). À confirmer.",
    attributes: kitAttrs(true),
  }),
  p({
    id: "pvs-custom",
    category: "pv",
    group: "Kits avec stockage",
    label: "Kit photovoltaïque avec stockage personnalisé",
    custom: true,
    description: PV_DESC,
    attributes: [
      { key: "puissance", label: "Puissance du kit", type: "number", unit: "kW", required: true, hideInSummary: true, placeholder: "ex. 6" },
      { key: "stockage", label: "Stockage", type: "number", unit: "kW", required: true, hideInSummary: true, default: "5", placeholder: "ex. 10" },
      ...kitAttrs(true),
    ],
    labelFrom: (a) => `Kit photovoltaïque ${fmtKw(a.puissance || "…")} kW en autoconsommation + stockage ${fmtKw(a.stockage || "…")} kW`,
  }),

  p({
    id: "sto-5",
    category: "pv",
    group: "Stockage seul",
    label: "Système de stockage 5 kW (batterie + onduleur)",
    priceTTC: 8900,
    attributes: [marque("Batterie · marque", "batteries"), ref("Batterie · référence", "batteries"), ONDULEUR_REF],
  }),
  p({ id: "sto-plus", category: "pv", group: "Stockage seul", label: "Stockage supplémentaire (par 5 kW)", priceTTC: 5900, attributes: [marque("Batterie · marque", "batteries"), ref("Batterie · référence", "batteries")] }),

  p({ id: "opt-mylight", category: "pv", group: "Options", label: "Batterie virtuelle MyLight", poseIncluse: false }),
  p({ id: "opt-passerelle", category: "pv", group: "Options", label: "Passerelle de communication", poseIncluse: false }),
  p({ id: "opt-depose", category: "pv", group: "Options", label: "Dépose / repose toiture", priceTTC: 4900, poseIncluse: false }),
  p({ id: "pv-carport-1", category: "pv", group: "Carport solaire", label: "Carport solaire FHE PARK+ · 1 place", description: CARPORT_DESC, attributes: [marque("Marque", "carport"), ref("Référence", "carport")] }),
  p({ id: "pv-carport-2", category: "pv", group: "Carport solaire", label: "Carport solaire FHE PARK+ · 2 places", description: CARPORT_DESC, attributes: [marque("Marque", "carport"), ref("Référence", "carport")] }),
  p({ id: "opt-borne-1", category: "pv", group: "Options", label: "Borne de recharge véhicule électrique · 1 place", attributes: [marque(), ref()] }),
  p({ id: "opt-borne-2", category: "pv", group: "Options", label: "Borne de recharge véhicule électrique · 2 places", attributes: [marque(), ref()] }),

  // ====================================================== Ballon thermodynamique
  p({
    id: "ballon",
    category: "ballon",
    group: "Ballon",
    label: "Ballon thermodynamique",
    description: BALLON_DESC,
    priceTTC: 4900,
    attributes: [marque(), ref(), { key: "capacite", label: "Capacité", type: "number", unit: "L", placeholder: "ex. 200" }],
  }),
  p({
    id: "ballon-compl",
    category: "ballon",
    group: "Ballon",
    label: "Ballon thermodynamique en complément d'installation",
    description: BALLON_DESC,
    priceTTC: 2000,
    attributes: [marque(), ref(), { key: "capacite", label: "Capacité", type: "number", unit: "L", placeholder: "ex. 200" }],
  }),
  p({ id: "cesi", category: "ballon", group: "Solaire", label: "CESI · Chauffe-eau solaire individuel", priceTTC: 8900, attributes: [marque(), ref()] }),

  // ================================================================ PAC air-eau
  ...([
    ["3", "8", 13900],
    ["4", "11", 14900],
    ["5", "14", 15900],
    ["6", "16", 16900],
  ] as const).map(([taille, kw, prix]) =>
    p({ id: `pac-${taille}`, category: "pac_air_eau", group: "Pompe à chaleur", label: `Pompe à chaleur air-eau · Taille ${taille} (${kw} kW)`, description: PAC_DESC, priceTTC: prix, vatRate: 5.5, attributes: PAC_ATTRS }),
  ),

  // ================================================================ PAC air/air
  p({
    id: "airair-kit",
    category: "pac_air_air",
    group: "Chauffage réversible",
    label: "Kit de chauffage réversible air/air",
    description: AIRAIR_DESC,
    attributes: [marque(), ref(), { key: "produits", label: "Produits (unités intérieures / extérieures)", type: "text" }],
  }),

  // ===================================================================== SSC
  p({ id: "ssc-seul", category: "ssc", group: "Système solaire combiné", label: "SSC seul · Système solaire combiné", priceTTC: 16900, attributes: [marque(), ref()] }),
  p({ id: "ssc-pac", category: "ssc", group: "Système solaire combiné", label: "SSC + Pompe à chaleur", priceTTC: 24900, attributes: [marque(), ref()] }),
];

export const productById = (id: string) => PRODUCTS.find((x) => x.id === id);
export const productsByCategory = (cat: ProductCategory) => PRODUCTS.filter((x) => x.category === cat);
export const groupsOf = (cat: ProductCategory) => Array.from(new Set(productsByCategory(cat).map((x) => x.group)));

export const FINANCING_ORGANISMS = ["Sofinco", "Domofinance", "Autre"];

/** Champs complémentaires d'une ligne, formatés pour l'affichage (« Marque : X · Référence : Y »). */
export function formatLineAttributes(line: { productId?: string; attributes?: Record<string, string> }): string {
  if (!line.attributes) return "";
  const defs = line.productId ? productById(line.productId)?.attributes ?? [] : [];
  return Object.entries(line.attributes)
    .filter(([k, v]) => v && v.trim() && !defs.find((d) => d.key === k)?.hideInSummary)
    .map(([k, v]) => {
      const d = defs.find((x) => x.key === k);
      const label = d?.label ?? (k === "marque" ? "Marque" : k === "ref" ? "Référence" : "");
      const value = d?.unit ? `${v} ${d.unit}` : v;
      return label ? `${label} : ${value}` : value;
    })
    .join(" · ");
}
