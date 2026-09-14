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
  | "pose"
  | "autre";

export interface Product {
  id: string;
  category: ProductCategory;
  label: string;
  detail?: string;
  /** Prix conseillé TTC. 0 = prix à saisir par le commercial. */
  priceTTC: number;
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
  /** Prix unitaire TTC saisi par le commercial (le HT et la TVA en sont déduits). */
  unitPriceTTC: number;
}

export type FinancingMode = "comptant" | "credit";
export type PaymentMethod = "cheque" | "virement" | "cb" | "especes";

/** Échéancier des règlements comptant (montants TTC). */
export interface PaymentSchedule {
  commande: number;
  visiteTechnique: number;
  livraison: number;
  installation: number;
}

export interface Financing {
  mode: FinancingMode;
  echeancier: PaymentSchedule;
  /** Mode de règlement de l'acompte à la commande. */
  acompteMode?: PaymentMethod;
  /** Chèque d'acompte récupéré par le commercial. */
  chequeRecupere?: boolean;
  // --- Crédit ---
  organisme?: string;
  /** Taux débiteur annuel figé au moment de la création du bon (%). */
  taux?: number;
  /** Taux d'assurance annuel figé (% du capital emprunté). */
  tauxAssurance?: number;
  avecAssurance?: boolean;
  dureeMois?: number;
  reportMois?: number;
  nbEmprunteurs?: number;
  dateNaissance1?: string;
  dateNaissance2?: string;
  enActivite?: boolean;
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
  /** Remise commerciale globale en € TTC. */
  remiseTTC: number;
  vatRate: number;
  financing: Financing;
  notes?: string;
  /** Délai d'installation annoncé au client, en mois. */
  delaiInstallationMois?: number;
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

/** Paramètres gérés par la direction (espace Paramètres). */
export interface AppSettings {
  /** Taux débiteur annuel appliqué aux nouveaux bons (%). */
  tauxNominal: number;
  /** Taux d'assurance emprunteur annuel (% du capital emprunté). */
  tauxAssurance: number;
  /** Durées proposées au client, en mois. */
  dureesProposees: number[];
  organismeDefaut: string;
  tvaDefaut: number;
  updatedAt?: string;
  updatedBy?: string;
}
