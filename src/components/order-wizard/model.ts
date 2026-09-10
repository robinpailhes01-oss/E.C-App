import type { Customer, Order, Profile } from "@/lib/types";
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
  telephone: "",
  email: "",
  typeLogement: "maison",
  proprietaire: true,
  anneeConstruction: "",
  surfaceM2: "",
  chauffageActuel: "",
  factureAnnuelle: "",
});

export const emptyOrder = (user: Profile): Order => ({
  id: uid(),
  numero: "",
  status: "brouillon",
  commercialId: user.id,
  commercialName: user.fullName,
  customer: emptyCustomer(),
  lines: [],
  remiseHT: 0,
  vatRate: DEFAULT_VAT_RATE,
  financing: { mode: "comptant", acompte: 0, acompteMode: "cheque" },
  notes: "",
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
