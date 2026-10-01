import type { AppSettings, Customer, Order, Profile } from "@/lib/types";
import { DEFAULT_VAT_RATE } from "@/lib/catalog";
import { ratesFor } from "@/lib/settings";
import { computeTotals } from "@/lib/pricing";
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
  poseRate: settings.poseRate,
  financing: {
    mode: "comptant",
    echeancier: { commande: 0, visiteTechnique: 0, livraison: 0, installation: 0 },
    acompteMode: undefined,
    chequeRecupere: false,
    organisme: settings.organismeDefaut,
    modaliteInteret: "normal",
    ...ratesFor(settings, settings.organismeDefaut, "normal"),
    avecAssurance: false,
    nbEmprunteurs: 1,
    situation: "activite",
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

export interface PaymentErrors {
  echeancier?: string;
  mode?: string;
  organisme?: string;
  duree?: string;
}

/** Étape Paiement : échéancier réparti et mode de règlement obligatoires. */
export function validatePayment(order: Order): PaymentErrors {
  const e: PaymentErrors = {};
  const t = computeTotals(order);
  const f = order.financing;
  if (f.mode === "comptant") {
    if (Math.abs(t.resteARepartir) > 0.009) {
      e.echeancier = `Répartissez la totalité du montant dans l'échéancier : il reste ${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(t.resteARepartir)} à placer.`;
    }
    if (!f.acompteMode) e.mode = "Choisissez le mode de règlement : chèque ou virement.";
  } else {
    if (!f.organisme) e.organisme = "Choisissez l'organisme de financement.";
    if (!f.dureeMois) e.duree = "Choisissez la durée du crédit.";
    if (t.acomptes > 0 && !f.acompteMode) e.mode = "Choisissez le mode de règlement de l'apport : chèque ou virement.";
  }
  return e;
}

export const STEPS = [
  { key: "client", label: "Client" },
  { key: "produits", label: "Produits" },
  { key: "tarifs", label: "Tarifs & financement" },
  { key: "signature", label: "Récap & signature" },
] as const;
