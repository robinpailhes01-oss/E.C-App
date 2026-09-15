export type Role = "commercial" | "directeur";

export interface Profile {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  phone?: string;
  active: boolean;
}

export type ProductCategory = "pv" | "ballon" | "pac_air_eau" | "pac_air_air" | "ssc" | "autre";

export interface ProductAttribute {
  key: string;
  label: string;
  type: "text" | "select";
  options?: string[];
  placeholder?: string;
}

export interface Product {
  id: string;
  category: ProductCategory;
  /** Sous-groupe affiché dans la rubrique (ex. « Kits sans stockage », « Options »). */
  group: string;
  label: string;
  /** Descriptif technique imprimé sur le bon (repris du bon papier). */
  description?: string;
  /** Prix conseillé TTC (affiché seulement via l'info-bulle). 0 = pas de prix conseillé. */
  priceTTC: number;
  /** Champs complémentaires à renseigner (marque, référence, puissance…). */
  attributes?: ProductAttribute[];
  /** Ligne de pose / mise en service. */
  installation?: boolean;
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
  /** Adresse de chantier identique à l'adresse de facturation. */
  chantierIdentique: boolean;
  adresseChantier?: string;
  codePostalChantier?: string;
  villeChantier?: string;
  telephone: string;
  portable?: string;
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
  /** Descriptif technique imprimé sous la désignation. */
  description?: string;
  detail?: string;
  /** Valeurs des champs complémentaires (marque, référence…). */
  attributes?: Record<string, string>;
  quantity: number;
  /** Prix unitaire TTC saisi par le commercial (le HT et la TVA en sont déduits). */
  unitPriceTTC: number;
  /** Taux de TVA de la ligne (%). */
  vatRate: number;
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
  /** TAEG communiqué par l'organisme, figé sur le bon (%). */
  taeg?: number;
  /** Report de la première échéance, en jours (180 sur le bon papier). */
  reportJours?: number;
  nbEmprunteurs?: number;
  dateNaissance1?: string;
  dateNaissance2?: string;
  enActivite?: boolean;
  /** Prime CEE estimée (montant imprimé dans la clause CEE du bon). */
  primeCEE?: number;
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
  /** Taux de TVA par défaut appliqué aux nouvelles lignes (%). */
  vatRate: number;
  /** Attestation TVA réduite : habitation de plus de deux ans, occupée à plus de 50 % à usage d'habitation. */
  attestationTvaReduite?: boolean;
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
  /** TAEG indicatif communiqué par l'organisme (%). */
  taeg: number;
  /** Durées proposées au client, en mois. */
  dureesProposees: number[];
  organismeDefaut: string;
  tvaDefaut: number;
  updatedAt?: string;
  updatedBy?: string;
}
