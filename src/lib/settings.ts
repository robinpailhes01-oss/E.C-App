import type { AppSettings } from "./types";

export const DEFAULT_SETTINGS: AppSettings = {
  tauxNominal: 6.29,
  tauxAssurance: 1.2,
  dureesProposees: [12, 24, 36, 48, 60, 72, 84, 96, 108, 120, 144, 180],
  organismeDefaut: "Domofinance",
  tvaDefaut: 20,
};

export const ALL_DURATIONS = [12, 24, 36, 48, 60, 72, 84, 96, 108, 120, 132, 144, 156, 168, 180];

export function normalizeSettings(raw: Partial<AppSettings> | null | undefined): AppSettings {
  const s = { ...DEFAULT_SETTINGS, ...(raw ?? {}) };
  s.dureesProposees = Array.from(new Set((s.dureesProposees ?? []).filter((d) => Number.isFinite(d) && d > 0))).sort((a, b) => a - b);
  if (s.dureesProposees.length === 0) s.dureesProposees = DEFAULT_SETTINGS.dureesProposees;
  return s;
}
