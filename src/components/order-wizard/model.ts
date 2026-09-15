import type { AppSettings, Customer, Order, Profile } from "@/lib/types";
import { DEFAULT_VAT_RATE } from "@/lib/catalog";
import { uid } from "@/lib/format";

export const emptyCustomer = (): Customer => ({
  civilite: "M.",
  nom: "",
  prenom: "",
  adresse: "",
  complement: "",
  codePostal: "",
  ville: "",
  chantierIdentique: true,
  adresseChantier: "",
  codePostalChantier: "",
  villeChantier: "",
  telephone: "",
  portable: "",
  email: "",
  typeLogement: "maison",
  proprietaire: true,
  anneeConstruction: "",
  surfaceM2: "",
  chauffageActuel: "",
  factureAnnuelle: "",
});

export const emptyOrder = (user: Profile, settings: AppSettings): Order => ({
  id: uid(),
  numero: "",
  status: "brouillon",
  commercialId: user.id,
  commercialName: user.fullName,
  customer: emptyCustomer(),
  lines: [],
  remiseTTC: 0,
  vatRate: settings.tvaDefaut || DEFAULT_VAT_RATE,
  financing: {
    mode: "comptant",
    echeancier: { commande: 0, visiteTechnique: 0, livraison: 0, installation: 0 },
    acompteMode: "cheque",
    chequeRecupere: false,
    organisme: settings.organismeDefaut,
    taux: settings.tauxNominal,
    tauxAssurance: settings.tauxAssurance,
    taeg: settings.taeg,
    avecAssurance: false,
    nbEmprunteurs: 1,
    enActivite: true,
  },
  notes: "",
  delaiInstallationMois: 3,
  dateInstallationPrevue: "",
  lieuSignature: "",
  createdAt: "",
  updatedAt: "",
});

export type CustomerErrors = Partial<Record<keyof Customer, string>>;

export function validateCustomer(c: Customer): CustomerErrors {
  const e: CustomerErrors = {};
  if (!c.nom.trim()) e.nom = "Nom obligatoire";
  if (!c.prenom.trim()) e.prenom = "Prénom obligatoire";
  if (!c.adresse.trim()) e.adresse = "Adresse obligatoire";
  if (!/^\d{5}$/.test(c.codePostal.trim())) e.codePostal = "Code postal à 5 chiffres";
  if (!c.ville.trim()) e.ville = "Ville obligatoire";
  if (!c.chantierIdentique) {
    if (!c.adresseChantier?.trim()) e.adresseChantier = "Adresse de chantier obligatoire";
    if (!/^\d{5}$/.test((c.codePostalChantier ?? "").trim())) e.codePostalChantier = "Code postal à 5 chiffres";
    if (!c.villeChantier?.trim()) e.villeChantier = "Ville obligatoire";
  }
  if (c.telephone.replace(/\D/g, "").length < 10) e.telephone = "Numéro de téléphone invalide";
  if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) e.email = "E-mail invalide";
  return e;
}

export const STEPS = [
  { key: "client", label: "Client" },
  { key: "produits", label: "Produits" },
  { key: "tarifs", label: "Tarifs & financement" },
  { key: "signature", label: "Récap & signature" },
] as const;
