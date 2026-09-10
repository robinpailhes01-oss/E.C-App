import type { Product, ProductCategory } from "./types";

/**
 * GRILLE TARIFAIRE Énergies Concept.
 *
 * CONVENTION : les prix de la grille papier sont considérés comme des prix HT,
 * la TVA (20 % par défaut) est ajoutée sur le bon de commande.
 * Si la grille est en réalité exprimée TTC, passez GRID_PRICES_INCLUDE_VAT à true :
 * les montants seront alors convertis en HT (prix / 1,20) automatiquement.
 */
export const GRID_PRICES_INCLUDE_VAT = false;
export const DEFAULT_VAT_RATE = 20;
export const VAT_RATES = [20, 10, 5.5] as const;

const toHT = (gridPrice: number) =>
  GRID_PRICES_INCLUDE_VAT ? Math.round((gridPrice / (1 + DEFAULT_VAT_RATE / 100)) * 100) / 100 : gridPrice;

export const CATEGORIES: { id: ProductCategory; label: string; short: string; color: string }[] = [
  { id: "pv_sans_stockage", label: "Panneaux photovoltaïques · autoconsommation sans stockage", short: "PV sans stockage", color: "#2b84b8" },
  { id: "pv_avec_stockage", label: "Panneaux photovoltaïques · autoconsommation + 5 kW stockage", short: "PV + stockage", color: "#d9781a" },
  { id: "stockage", label: "Système de stockage seul", short: "Stockage", color: "#7c5cbf" },
  { id: "pac_air_eau", label: "Pompe à chaleur air-eau", short: "PAC air-eau", color: "#5c9a2e" },
  { id: "ecs", label: "ECS · Eau chaude sanitaire", short: "ECS", color: "#c0507a" },
  { id: "ssc", label: "SSC · Système solaire combiné", short: "SSC", color: "#9a6b12" },
  { id: "autre", label: "Autre / sur devis", short: "Autre", color: "#9ca3af" },
];

export const categoryLabel = (id: ProductCategory) => CATEGORIES.find((c) => c.id === id)?.label ?? id;
export const categoryShort = (id: ProductCategory) => CATEGORIES.find((c) => c.id === id)?.short ?? id;
export const categoryColor = (id: ProductCategory) => CATEGORIES.find((c) => c.id === id)?.color ?? "#9ca3af";

const p = (id: string, category: ProductCategory, label: string, gridPrice: number, detail?: string): Product => ({
  id,
  category,
  label,
  detail,
  priceHT: toHT(gridPrice),
});

export const PRODUCTS: Product[] = [
  // Panneaux photovoltaïques autoconsommation sans stockage
  p("pv-2", "pv_sans_stockage", "Installation photovoltaïque 2 kW", 8900, "Autoconsommation sans stockage"),
  p("pv-3", "pv_sans_stockage", "Installation photovoltaïque 3 kW", 9900, "Autoconsommation sans stockage"),
  p("pv-4.5", "pv_sans_stockage", "Installation photovoltaïque 4,5 kW", 12900, "Autoconsommation sans stockage"),
  p("pv-6", "pv_sans_stockage", "Installation photovoltaïque 6 kW", 15900, "Autoconsommation sans stockage"),
  p("pv-9", "pv_sans_stockage", "Installation photovoltaïque 9 kW", 21900, "Autoconsommation sans stockage"),
  // Panneaux photovoltaïques autoconsommation + 5 kW stockage
  p("pvs-2", "pv_avec_stockage", "Installation photovoltaïque 2 kW + stockage 5 kW", 13900, "Autoconsommation avec batterie 5 kW"),
  p("pvs-3", "pv_avec_stockage", "Installation photovoltaïque 3 kW + stockage 5 kW", 14900, "Autoconsommation avec batterie 5 kW"),
  p("pvs-5", "pv_avec_stockage", "Installation photovoltaïque 5 kW + stockage 5 kW", 15900, "Autoconsommation avec batterie 5 kW"),
  p("pvs-6", "pv_avec_stockage", "Installation photovoltaïque 6 kW + stockage 5 kW", 18900, "Autoconsommation avec batterie 5 kW"),
  p("pvs-9", "pv_avec_stockage", "Installation photovoltaïque 9 kW + stockage 5 kW", 24900, "Autoconsommation avec batterie 5 kW"),
  // Stockage seul
  p("sto-5", "stockage", "Système de stockage 5 kW", 8900, "Batterie seule"),
  p("sto-plus", "stockage", "Stockage supplémentaire (par 5 kW)", 5900, "Module batterie additionnel"),
  // Pompe à chaleur air-eau
  p("pac-3", "pac_air_eau", "Pompe à chaleur air-eau · Taille 3 (8 kW)", 13900),
  p("pac-4", "pac_air_eau", "Pompe à chaleur air-eau · Taille 4 (11 kW)", 14900),
  p("pac-5", "pac_air_eau", "Pompe à chaleur air-eau · Taille 5 (14 kW)", 15900),
  p("pac-6", "pac_air_eau", "Pompe à chaleur air-eau · Taille 6 (16 kW)", 16900),
  // ECS
  p("ecs-ballon", "ecs", "Ballon thermodynamique", 4900),
  p("ecs-ballon-compl", "ecs", "Ballon thermodynamique en complément d'installation", 2000, "Tarif complément d'une autre installation"),
  p("ecs-cesi", "ecs", "CESI · Chauffe-eau solaire individuel", 8900),
  // SSC
  p("ssc-seul", "ssc", "SSC seul · Système solaire combiné", 16900),
  p("ssc-pac", "ssc", "SSC + Pompe à chaleur", 24900),
];

export const productById = (id: string) => PRODUCTS.find((x) => x.id === id);

export const FINANCING_ORGANISMS = ["Sofinco", "Cetelem", "Cofidis", "Franfinance", "Domofinance", "Financo", "Autre"];
