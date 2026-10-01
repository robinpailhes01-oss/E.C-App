import type { AppSettings, InteretModalite, OrganismeRates } from "./types";

export const ORGANISMES = ["Sofinco", "Domofinance", "Autre"] as const;

/** Valeurs initiales : à vérifier et à mettre à jour par la direction (tableau de bord). */
export const DEFAULT_RATES: OrganismeRates = { tauxNormal: 6.29, tauxCompense: 6.29, taeg: 6.47, tauxAssurance: 1.2 };

export const DEFAULT_SETTINGS: AppSettings = {
  organismes: Object.fromEntries(ORGANISMES.map((o) => [o, { ...DEFAULT_RATES }])),
  dureesProposees: [12, 24, 36, 48, 60, 72, 84, 96, 108, 120, 144, 180],
  organismeDefaut: "Domofinance",
  tvaDefaut: 20,
  poseRate: 15,
  poseVatRate: 20,
};

export const ALL_DURATIONS = [12, 24, 36, 48, 60, 72, 84, 96, 108, 120, 132, 144, 156, 168, 180];

type LegacySettings = Partial<AppSettings> & { tauxNominal?: number; tauxAssurance?: number; taeg?: number };

export function normalizeSettings(raw: LegacySettings | null | undefined): AppSettings {
  const r = raw ?? {};
  const s: AppSettings = { ...DEFAULT_SETTINGS, ...r, organismes: { ...DEFAULT_SETTINGS.organismes } };
  // Anciens paramètres (taux unique) : repris pour Domofinance.
  if (r.tauxNominal !== undefined || r.taeg !== undefined || r.tauxAssurance !== undefined) {
    const base = { ...DEFAULT_RATES, ...(r.organismes?.Domofinance ?? {}) };
    s.organismes.Domofinance = {
      ...base,
      tauxNormal: r.tauxNominal ?? base.tauxNormal,
      tauxCompense: r.tauxNominal ?? base.tauxCompense,
      taeg: r.taeg ?? base.taeg,
      tauxAssurance: r.tauxAssurance ?? base.tauxAssurance,
    };
  }
  for (const name of Object.keys(r.organismes ?? {})) s.organismes[name] = { ...DEFAULT_RATES, ...r.organismes![name] };
  for (const name of ORGANISMES) s.organismes[name] = { ...DEFAULT_RATES, ...s.organismes[name] };
  if (!ORGANISMES.includes(s.organismeDefaut as (typeof ORGANISMES)[number])) s.organismeDefaut = DEFAULT_SETTINGS.organismeDefaut;
  s.dureesProposees = Array.from(new Set((s.dureesProposees ?? []).filter((d) => Number.isFinite(d) && d > 0))).sort((a, b) => a - b);
  if (s.dureesProposees.length === 0) s.dureesProposees = DEFAULT_SETTINGS.dureesProposees;
  if (!(s.poseRate >= 0 && s.poseRate < 100)) s.poseRate = DEFAULT_SETTINGS.poseRate;
  return s;
}

/** Taux appliqués à un bon selon l'organisme et la modalité des intérêts. */
export function ratesFor(settings: AppSettings, organisme: string | undefined, modalite: InteretModalite = "normal") {
  const o = settings.organismes[organisme ?? ""] ?? settings.organismes[settings.organismeDefaut] ?? DEFAULT_RATES;
  if (modalite === "gratuit") return { taux: 0, taeg: 0, tauxAssurance: o.tauxAssurance };
  if (modalite === "compense") return { taux: o.tauxCompense, taeg: Math.max(0, o.taeg - o.tauxNormal + o.tauxCompense), tauxAssurance: o.tauxAssurance };
  return { taux: o.tauxNormal, taeg: o.taeg, tauxAssurance: o.tauxAssurance };
}
