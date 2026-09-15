import type { Product, ProductAttribute, ProductCategory } from "./types";

/**
 * CATALOGUE Énergies Concept : familles et articles du bon de commande papier,
 * prix conseillés TTC issus de la grille tarifaire (jamais pré-remplis : le
 * commercial saisit le prix, l'info-bulle lui rappelle le prix conseillé).
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

const PV_DESC =
  "Panneaux photovoltaïques monocristallins de 500 Wc, demi-cellules, rectangulaires, technologie TOPCON, module bi-verre et bi-facial. Garantie 30 ans de rendement à 87,4 % de production. Kit de montage sur mesure : crochets tuiles, rails, vis à bois, étrier inter./exter., câble et coffret AC.";
const MICRO_DESC = "Micro-onduleurs garantie 25 ans, taux d'efficacité MPPT de 99,8 %, conformes à la norme EN 50549-1:2019. Plage de puissance DC du module 400-670.";
const BALLON_DESC = "3 modes de fonctionnement intelligent éco / hybride / électrique. Label énergétique A+. Garantie 3 ans cuve et 2 ans pièces.";
const PAC_DESC =
  "Module hydraulique, groupe extérieur, contrôleur, télécommande modulante + récepteur, soupape de décharge différentielle, réchauffeur, disjoncteur, câble, couronne cuivre bitube isolée. Garantie fabricant 3 ans pièces + 5 ans compresseur.";
const AIRAIR_DESC = "Garantie 3 ans pièces + 5 ans compresseur.";

const MARQUE_REF: ProductAttribute[] = [
  { key: "marque", label: "Marque", type: "text" },
  { key: "ref", label: "Référence", type: "text" },
];
const PAC_ATTRS: ProductAttribute[] = [
  { key: "marque", label: "Marque", type: "text" },
  { key: "ref", label: "Référence", type: "text" },
  { key: "type", label: "Type", type: "select", options: ["Bi-bloc", "Mono-bloc"] },
  { key: "mode", label: "Chaudière", type: "select", options: ["Relève de chaudière", "En suppression de la chaudière"] },
  { key: "phase", label: "Alimentation", type: "select", options: ["Monophasé", "Triphasé"] },
];

type P = Omit<Product, "priceTTC" | "attributes" | "description" | "installation"> & Partial<Pick<Product, "priceTTC" | "attributes" | "description" | "installation">>;
const p = (x: P): Product => ({ priceTTC: 0, ...x });

export const PRODUCTS: Product[] = [
  // ------------------------------------------------------------ Photovoltaïque
  ...([2, 3, 4.5, 6, 9] as const).map((kw, i) =>
    p({ id: `pv-${kw}`, category: "pv", group: "Kits sans stockage", label: `Kit photovoltaïque ${String(kw).replace(".", ",")} kW en autoconsommation`, description: PV_DESC, priceTTC: [8900, 9900, 12900, 15900, 21900][i], attributes: MARQUE_REF }),
  ),
  ...([2, 3, 5, 6, 9] as const).map((kw, i) =>
    p({ id: `pvs-${kw}`, category: "pv", group: "Kits avec stockage 5 kW", label: `Kit photovoltaïque ${kw} kW en autoconsommation + stockage 5 kW`, description: PV_DESC, priceTTC: [13900, 14900, 15900, 18900, 24900][i], attributes: MARQUE_REF }),
  ),
  p({ id: "sto-5", category: "pv", group: "Stockage seul", label: "Système de stockage 5 kW", priceTTC: 8900, attributes: MARQUE_REF }),
  p({ id: "sto-plus", category: "pv", group: "Stockage seul", label: "Stockage supplémentaire (par 5 kW)", priceTTC: 5900, attributes: MARQUE_REF }),
  p({ id: "pv-micro", category: "pv", group: "Options du kit", label: "Micro-onduleurs", description: MICRO_DESC }),
  p({ id: "pv-passerelle", category: "pv", group: "Options du kit", label: "Passerelle de communication" }),
  p({ id: "pv-onduleur", category: "pv", group: "Options du kit", label: "Onduleur hybride", attributes: [{ key: "puissance", label: "Puissance (kW)", type: "text", placeholder: "ex. 6" }, { key: "ref", label: "Référence", type: "text" }] }),
  p({ id: "pv-batterie", category: "pv", group: "Options du kit", label: "Batterie", attributes: [{ key: "puissance", label: "Capacité (kW)", type: "text", placeholder: "ex. 5" }, { key: "ref", label: "Référence", type: "text" }] }),
  p({ id: "pv-install", category: "pv", group: "Pose", label: "Installation et mise en service photovoltaïque", installation: true }),

  // ------------------------------------------------------ Ballon thermodynamique
  p({ id: "ballon", category: "ballon", group: "Ballon", label: "Ballon thermodynamique", description: BALLON_DESC, priceTTC: 4900, attributes: [{ key: "marque", label: "Marque / modèle", type: "text" }, { key: "capacite", label: "Capacité (L)", type: "text", placeholder: "ex. 200" }] }),
  p({ id: "ballon-compl", category: "ballon", group: "Ballon", label: "Ballon thermodynamique en complément d'installation", description: BALLON_DESC, priceTTC: 2000, attributes: [{ key: "marque", label: "Marque / modèle", type: "text" }, { key: "capacite", label: "Capacité (L)", type: "text", placeholder: "ex. 200" }] }),
  p({ id: "cesi", category: "ballon", group: "Solaire", label: "CESI · Chauffe-eau solaire individuel", priceTTC: 8900, attributes: MARQUE_REF }),
  p({ id: "ballon-install", category: "ballon", group: "Pose", label: "Installation et mise en service thermodynamique", installation: true }),

  // ------------------------------------------------------------ PAC air-eau
  ...([
    ["3", "8", 13900],
    ["4", "11", 14900],
    ["5", "14", 15900],
    ["6", "16", 16900],
  ] as const).map(([taille, kw, prix]) =>
    p({ id: `pac-${taille}`, category: "pac_air_eau", group: "Pompe à chaleur", label: `Pompe à chaleur air-eau · Taille ${taille} (${kw} kW)`, description: PAC_DESC, priceTTC: prix, attributes: PAC_ATTRS }),
  ),
  p({ id: "pac-install", category: "pac_air_eau", group: "Pose", label: "Installation et mise en service pompe à chaleur", installation: true }),

  // ------------------------------------------------------------ PAC air/air
  p({ id: "airair-kit", category: "pac_air_air", group: "Chauffage réversible", label: "Kit de chauffage réversible air/air", description: AIRAIR_DESC, attributes: [{ key: "marque", label: "Marque", type: "text" }, { key: "produits", label: "Produits (unités intérieures / extérieures)", type: "text" }] }),
  p({ id: "airair-install", category: "pac_air_air", group: "Pose", label: "Installation et mise en service pompe à chaleur air/air", installation: true }),

  // ------------------------------------------------------------ SSC
  p({ id: "ssc-seul", category: "ssc", group: "Système solaire combiné", label: "SSC seul · Système solaire combiné", priceTTC: 16900, attributes: MARQUE_REF }),
  p({ id: "ssc-pac", category: "ssc", group: "Système solaire combiné", label: "SSC + Pompe à chaleur", priceTTC: 24900, attributes: MARQUE_REF }),
  p({ id: "ssc-install", category: "ssc", group: "Pose", label: "Installation et mise en service solaire combiné", installation: true }),
];

export const productById = (id: string) => PRODUCTS.find((x) => x.id === id);
export const productsByCategory = (cat: ProductCategory) => PRODUCTS.filter((x) => x.category === cat);
export const groupsOf = (cat: ProductCategory) => Array.from(new Set(productsByCategory(cat).map((x) => x.group)));

export const FINANCING_ORGANISMS = ["Domofinance", "Sofinco", "Cetelem", "Cofidis", "Franfinance", "Financo", "Autre"];

/** Attributs d'une ligne formatés pour l'affichage (« Capacité 5 kW · Huawei LUNA2000 »). */
export function formatLineAttributes(line: { productId?: string; attributes?: Record<string, string> }): string {
  if (!line.attributes) return "";
  const defs = line.productId ? productById(line.productId)?.attributes ?? [] : [];
  return Object.entries(line.attributes)
    .filter(([, v]) => v && v.trim())
    .map(([k, v]) => {
      const def = defs.find((d) => d.key === k);
      if (k === "puissance") return `${v} kW`;
      if (k === "capacite") return `${v} L`;
      void def;
      return v;
    })
    .join(" · ");
}
