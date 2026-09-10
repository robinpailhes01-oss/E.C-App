export type Role = "commercial" | "directeur";

export interface Profile {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  phone?: string;
  active: boolean;
}

export type ProductCategory =
  | "pv_sans_stockage"
  | "pv_avec_stockage"
  | "stockage"
  | "pac_air_eau"
  | "ecs"
  | "ssc"
  | "autre";

export interface Product {
  id: string;
  category: ProductCategory;
  label: string;
  detail?: string;
  /** Prix catalogue exprimé en HT (voir catalog.ts pour la convention). */
  priceHT: number;
}

export type Civilite = "M." | "Mme" | "M. et Mme";

export interface Customer {
  civilite: Civilite;
  nom: string;
  prenom: string;
  adresse: string;
  complement?: string;
  codePostal: string;
  ville: string;
  telephone: string;
  email: string;
  typeLogement: "maison" | "appartement";
  proprietaire: boolean;
  anneeConstruction?: string;
  surfaceM2?: string;
  chauffageActuel?: string;
  factureAnnuelle?: string;
}

export interface OrderLine {
  id: string;
  productId?: string;
  category: ProductCategory;
  label: string;
  detail?: string;
  quantity: number;
  unitPriceHT: number;
}

export type FinancingMode = "comptant" | "credit" | "mixte";
export type PaymentMethod = "cheque" | "virement" | "cb" | "especes";

export interface Financing {
  mode: FinancingMode;
  /** Acompte versé à la commande (TTC). */
  acompte: number;
  acompteMode?: PaymentMethod;
  organisme?: string;
  /** Montant financé par le crédit (TTC). */
  montantFinance?: number;
  dureeMois?: number;
  taeg?: number;
  mensualite?: number;
  reportMois?: number;
  /** Aides / primes estimées (information client, non déduites du bon). */
  aides?: number;
  commentaire?: string;
}

export type OrderStatus = "brouillon" | "signe" | "annule";

export interface Order {
  id: string;
  numero: string;
  status: OrderStatus;
  commercialId: string;
  commercialName: string;
  customer: Customer;
  lines: OrderLine[];
  /** Remise commerciale globale en € HT. */
  remiseHT: number;
  vatRate: number;
  financing: Financing;
  notes?: string;
  dateInstallationPrevue?: string;
  lieuSignature?: string;
  signatureClient?: string;
  signatureCommercial?: string;
  signedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderFilter {
  commercialId?: string;
  status?: OrderStatus;
  from?: string;
  to?: string;
}
