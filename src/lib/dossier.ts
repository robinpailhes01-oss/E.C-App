import type { Creneau, Decision, DossierDoc, DossierSuivi, Order, PlanItem, PlanStatut, Sav } from "./types";
import { customerName } from "./format";

// ---------------------------------------------------------------------------
// Documents à collecter (page « suivi » du carnet papier)
// ---------------------------------------------------------------------------

export interface DocDef {
  key: string;
  label: string;
  /** Toujours demandé. */
  always?: boolean;
  /** Demandé seulement en cas de financement. */
  credit?: boolean;
}

export const DOC_DEFS: DocDef[] = [
  { key: "cni", label: "CNI", always: true },
  { key: "justifDom", label: "Justificatif de domicile", always: true },
  { key: "avisImpot", label: "Avis d'impôt", always: true },
  { key: "factureElec", label: "Facture d'électricité", always: true },
  { key: "photoDisjoncteur", label: "Photo disjoncteur + compteur", always: true },
  { key: "mandatDP", label: "Mandat DP", always: true },
  { key: "rib", label: "RIB (si financement)", credit: true },
  { key: "bulletinSalaire", label: "Bulletin de salaire", credit: true },
];

export const docApplicable = (def: DocDef, order: Order) => def.always || (def.credit && order.financing.mode === "credit");

// ---------------------------------------------------------------------------
// Libellés
// ---------------------------------------------------------------------------

export const PLAN_LABEL: Record<PlanStatut, string> = {
  a_planifier: "À planifier",
  planifie: "Planifié",
  confirme: "Confirmé",
  en_cours: "En cours",
  fait: "Fait",
  reporte: "Reporté",
};
export const PLAN_TONE: Record<PlanStatut, "gray" | "blue" | "orange" | "green" | "red"> = {
  a_planifier: "gray",
  planifie: "blue",
  confirme: "blue",
  en_cours: "orange",
  fait: "green",
  reporte: "red",
};
export const CRENEAU_LABEL: Record<Creneau, string> = { journee: "Journée", matin: "Matin", apres_midi: "Après-midi" };
export const DECISION_LABEL: Record<Decision, string> = { attente: "En attente", accord: "Accord", refus: "Refus" };
export const DECISION_TONE: Record<Decision, "gray" | "green" | "red"> = { attente: "gray", accord: "green", refus: "red" };

export type EventKind = "visite" | "livraison" | "pose" | "sav";
export const KIND_LABEL: Record<EventKind, string> = { visite: "Visite technique", livraison: "Livraison", pose: "Pose", sav: "SAV" };
export const KIND_COLOR: Record<EventKind, string> = { visite: "#7c5cbf", livraison: "#d9781a", pose: "#2b84b8", sav: "#c0507a" };

// ---------------------------------------------------------------------------
// Création / normalisation
// ---------------------------------------------------------------------------

const emptyPlan = (): PlanItem => ({ statut: "a_planifier" });

export const emptyDossier = (orderId: string): DossierSuivi => ({
  orderId,
  visite: emptyPlan(),
  livraison: emptyPlan(),
  pose: emptyPlan(),
  commandes: {},
  financement: "attente",
  dp: { statut: "attente" },
  enedis: { statut: "attente" },
  consuel: { statut: "attente" },
  documents: {},
});

export function normalizeDossier(raw: Partial<DossierSuivi> | null | undefined, orderId: string): DossierSuivi {
  const base = emptyDossier(orderId);
  const r = raw ?? {};
  return {
    ...base,
    ...r,
    orderId,
    visite: { ...base.visite, ...(r.visite ?? {}) },
    livraison: { ...base.livraison, ...(r.livraison ?? {}) },
    pose: { ...base.pose, ...(r.pose ?? {}) },
    dp: { ...base.dp, ...(r.dp ?? {}) },
    enedis: { ...base.enedis, ...(r.enedis ?? {}) },
    consuel: { ...base.consuel, ...(r.consuel ?? {}) },
    commandes: r.commandes ?? {},
    documents: r.documents ?? {},
  };
}

export const docOf = (d: DossierSuivi, key: string): DossierDoc => d.documents[key] ?? { recu: false, files: [] };

// ---------------------------------------------------------------------------
// Avancement du dossier
// ---------------------------------------------------------------------------

export interface Step {
  key: string;
  label: string;
  applicable: boolean;
  done: boolean;
  /** Précision affichée sous l'étape (date, statut…). */
  info?: string;
  /** Étape refusée (financement, DP, Consuel). */
  blocked?: boolean;
}

export interface Progress {
  steps: Step[];
  done: number;
  total: number;
  percent: number;
  current?: Step;
  complete: boolean;
}

const fmtDay = (iso?: string) => (iso ? new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }) : "");

export function computeProgress(order: Order, d: DossierSuivi): Progress {
  const credit = order.financing.mode === "credit";
  const hasPV = order.lines.some((l) => l.category === "pv");
  const docsMissing = DOC_DEFS.filter((def) => docApplicable(def, order) && !docOf(d, def.key).recu).length;
  const materiel = order.lines.filter((l) => l.poseIncluse || l.category !== "autre");
  const commandees = materiel.filter((l) => d.commandes[l.id]?.fournisseur?.trim()).length;

  const steps: Step[] = [
    { key: "signe", label: "Bon signé", applicable: true, done: order.status === "signe" },
    { key: "docs", label: "Documents reçus", applicable: true, done: docsMissing === 0, info: docsMissing ? `${docsMissing} manquant${docsMissing > 1 ? "s" : ""}` : undefined },
    { key: "financement", label: "Financement accordé", applicable: credit, done: d.financement === "accord", blocked: d.financement === "refus", info: d.financement === "refus" ? "Refusé" : undefined },
    { key: "dp", label: "DP mairie accordée", applicable: hasPV, done: d.dp.statut === "accord", blocked: d.dp.statut === "refus", info: d.dp.deposeeLe ? `déposée le ${fmtDay(d.dp.deposeeLe)}` : undefined },
    { key: "visite", label: "Visite technique", applicable: true, done: d.visite.statut === "fait", info: d.visite.date ? fmtDay(d.visite.date) : undefined },
    { key: "commande", label: "Matériel commandé", applicable: materiel.length > 0, done: materiel.length > 0 && commandees === materiel.length, info: materiel.length ? `${commandees}/${materiel.length}` : undefined },
    { key: "livraison", label: "Livraison", applicable: true, done: d.livraison.statut === "fait", info: d.livraison.date ? fmtDay(d.livraison.date) : undefined },
    { key: "pose", label: "Pose", applicable: true, done: d.pose.statut === "fait", info: d.pose.date ? fmtDay(d.pose.date) : undefined },
    { key: "consuel", label: "Consuel", applicable: hasPV, done: d.consuel.statut === "accord", blocked: d.consuel.statut === "refus" },
    { key: "solde", label: "Dossier soldé", applicable: true, done: Boolean(d.soldeDate), info: d.soldeDate ? fmtDay(d.soldeDate) : undefined },
  ];
  const applicable = steps.filter((s) => s.applicable);
  const done = applicable.filter((s) => s.done).length;
  const current = applicable.find((s) => !s.done);
  return { steps, done, total: applicable.length, percent: applicable.length ? Math.round((done / applicable.length) * 100) : 0, current, complete: !current };
}

// ---------------------------------------------------------------------------
// Agenda
// ---------------------------------------------------------------------------

export interface AgendaEvent {
  id: string;
  kind: EventKind;
  date: string;
  creneau: Creneau;
  statut: PlanStatut | "sav";
  responsable?: string;
  orderId?: string;
  savId?: string;
  client: string;
  ville?: string;
  telephone?: string;
  commercialId?: string;
  commercialName?: string;
  note?: string;
  numero?: string;
  title: string;
}

export function buildEvents(orders: Order[], dossiers: DossierSuivi[], savs: Sav[]): AgendaEvent[] {
  const byOrder = new Map(orders.map((o) => [o.id, o]));
  const events: AgendaEvent[] = [];
  for (const d of dossiers) {
    const o = byOrder.get(d.orderId);
    if (!o || o.status === "annule") continue;
    (["visite", "livraison", "pose"] as const).forEach((kind) => {
      const item = d[kind];
      if (!item.date) return;
      events.push({
        id: `${o.id}:${kind}`,
        kind,
        date: item.date,
        creneau: item.creneau ?? "journee",
        statut: item.statut,
        responsable: item.responsable,
        orderId: o.id,
        client: customerName(o.customer),
        ville: o.customer.chantierIdentique ? o.customer.ville : o.customer.villeChantier,
        telephone: o.customer.portable || o.customer.telephone,
        commercialId: o.commercialId,
        commercialName: o.commercialName,
        note: item.note,
        numero: o.numero,
        title: KIND_LABEL[kind],
      });
    });
  }
  for (const s of savs) {
    if (!s.datePrevue || s.statut === "resolu") continue;
    events.push({
      id: `sav:${s.id}`,
      kind: "sav",
      date: s.datePrevue,
      creneau: s.creneau ?? "journee",
      statut: "sav",
      responsable: s.assigneA,
      savId: s.id,
      orderId: s.orderId,
      client: s.client.nom,
      ville: s.client.ville,
      telephone: s.client.telephone,
      commercialId: s.commercialId,
      note: s.objet,
      numero: s.numero,
      title: `SAV · ${s.objet}`,
    });
  }
  return events.sort((a, b) => a.date.localeCompare(b.date) || a.creneau.localeCompare(b.creneau));
}

// ---------------------------------------------------------------------------
// Dates (semaine du lundi)
// ---------------------------------------------------------------------------

export const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const parseDay = (iso: string) => new Date(`${iso}T00:00:00`);
export const mondayOf = (d: Date) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  return x;
};
export const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
