export type Role = "commercial" | "directeur" | "secretaire";

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
  type: "text" | "select" | "number";
  options?: string[];
  placeholder?: string;
  /** Champ obligatoire à l'ajout du produit (ex. marque, référence). */
  required?: boolean;
  unit?: string;
  default?: string;
  /** Non répété dans le résumé de la ligne (déjà présent dans le libellé). */
  hideInSummary?: boolean;
  /** Liste de références proposées à la saisie (clé de `REFERENCES`), la saisie libre reste possible. */
  suggest?: string;
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
  /** Précision affichée dans l'info-bulle du prix conseillé. */
  priceNote?: string;
  /** Champs complémentaires à renseigner (marque, référence, puissance…). */
  attributes?: ProductAttribute[];
  /** Taux de TVA du matériel (20 % par défaut). */
  vatRate?: number;
  /** La ligne contient une installation (part du TTC). Vrai par défaut pour le matériel. */
  poseIncluse?: boolean;
  /** Produit « Personnalisé » : le libellé est construit à partir des champs saisis. */
  custom?: boolean;
  labelFrom?: (attrs: Record<string, string>) => string;
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
  /** Prix unitaire TTC saisi par le commercial, installation comprise (le HT et la TVA en sont déduits). */
  unitPriceTTC: number;
  /** Taux de TVA du matériel (%). */
  vatRate: number;
  /** La ligne contient une installation : une part du TTC (taux de pose) lui est affectée automatiquement. */
  poseIncluse: boolean;
  /** Taux de TVA de l'installation (%). */
  poseVatRate: number;
}

export type FinancingMode = "comptant" | "credit";
export type PaymentMethod = "cheque" | "virement";
export type InteretModalite = "normal" | "compense" | "gratuit";
export type Situation = "activite" | "retraite";

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
  /** Mode de règlement : chèque ou virement (obligatoire). */
  acompteMode?: PaymentMethod;
  /** Chèque d'acompte récupéré par le commercial. */
  chequeRecupere?: boolean;
  // --- Crédit ---
  organisme?: string;
  /** Modalité des intérêts : normale, compensée ou gratuite. */
  modaliteInteret?: InteretModalite;
  /** Taux débiteur annuel figé au moment du choix de l'organisme et de la modalité (%). */
  taux?: number;
  /** Taux d'assurance annuel figé (% du capital emprunté). */
  tauxAssurance?: number;
  avecAssurance?: boolean;
  dureeMois?: number;
  /** TAEG communiqué par l'organisme, figé sur le bon (%). */
  taeg?: number;
  /** Report de la première échéance : 0 (sans) ou 180 jours (6 mois). */
  reportJours?: number;
  nbEmprunteurs?: number;
  dateNaissance1?: string;
  dateNaissance2?: string;
  situation?: Situation;
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
  /** Part d'installation incluse dans le TTC des lignes concernées (% du TTC), figée à la création du bon. */
  poseRate: number;
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

/** Taux d'un organisme de financement, modifiables par la direction. */
export interface OrganismeRates {
  /** Taux débiteur annuel, modalité normale (%). */
  tauxNormal: number;
  /** Taux débiteur annuel, intérêts compensés (%). La modalité gratuite est à 0 %. */
  tauxCompense: number;
  /** TAEG indicatif, modalité normale (%). */
  taeg: number;
  /** Assurance DIM : % annuel du capital emprunté. */
  tauxAssurance: number;
}

/** Paramètres gérés par la direction (espace Paramètres et tableau de bord). */
export interface AppSettings {
  organismes: Record<string, OrganismeRates>;
  /** Durées proposées au client, en mois. */
  dureesProposees: number[];
  organismeDefaut: string;
  tvaDefaut: number;
  /** Part d'installation incluse dans le TTC (% du TTC). */
  poseRate: number;
  /** TVA appliquée à l'installation (%). */
  poseVatRate: number;
  updatedAt?: string;
  updatedBy?: string;
}

// ---------------------------------------------------------------------------
// Suivi de dossier (secrétariat)
// ---------------------------------------------------------------------------

export type Decision = "attente" | "accord" | "refus";
export type PlanStatut = "a_planifier" | "planifie" | "confirme" | "en_cours" | "fait" | "reporte";
export type Creneau = "journee" | "matin" | "apres_midi";

/** Étape planifiable d'un dossier : visite technique, livraison ou pose. */
export interface PlanItem {
  statut: PlanStatut;
  date?: string;
  creneau?: Creneau;
  /** Visite technique : nom du technicien ; pose : technicien / poseur. */
  responsable?: string;
  note?: string;
}

export interface StoredFile {
  id: string;
  name: string;
  addedAt: string;
  /** Chemin dans le stockage (Supabase) ou data-URL compressée (mode démo). */
  path?: string;
  dataUrl?: string;
}

export interface DossierDoc {
  recu: boolean;
  files: StoredFile[];
}

export interface DossierSuivi {
  orderId: string;
  visite: PlanItem;
  livraison: PlanItem;
  pose: PlanItem;
  /** Commande du matériel, par ligne du bon. */
  commandes: Record<string, { fournisseur?: string; date?: string }>;
  acompteDate?: string;
  soldeDate?: string;
  soldeMontant?: number;
  financement: Decision;
  dp: { deposeeLe?: string; statut: Decision };
  enedis: { reference?: string; statut: Decision };
  consuel: { date?: string; statut: Decision };
  documents: Record<string, DossierDoc>;
  observations?: string;
  updatedAt?: string;
  updatedBy?: string;
}

// ---------------------------------------------------------------------------
// SAV
// ---------------------------------------------------------------------------

export type SavStatut = "ouvert" | "en_cours" | "planifie" | "resolu";
export type SavUrgence = "normale" | "urgente";

export interface SavComment {
  id: string;
  at: string;
  authorId: string;
  authorName: string;
  authorRole: Role;
  text: string;
}

export interface Sav {
  id: string;
  numero: string;
  statut: SavStatut;
  urgence: SavUrgence;
  objet: string;
  description: string;
  orderId?: string;
  orderNumero?: string;
  /** Commercial propriétaire du bon d'origine (visibilité). */
  commercialId?: string;
  client: { nom: string; telephone?: string; adresse?: string; ville?: string };
  declaredById: string;
  declaredByName: string;
  declaredByRole: Role;
  assigneA?: string;
  datePrevue?: string;
  creneau?: Creneau;
  files: StoredFile[];
  comments: SavComment[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}
