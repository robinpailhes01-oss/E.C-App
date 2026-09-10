export const eur = (n: number | null | undefined, opts: Intl.NumberFormatOptions = {}) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2, ...opts }).format(n ?? 0);

export const eur0 = (n: number | null | undefined) => eur(n, { maximumFractionDigits: 0, minimumFractionDigits: 0 });

export const dateFr = (iso?: string | null, withTime = false) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
};

export const monthKey = (iso: string) => iso.slice(0, 7);

export const monthLabel = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
};

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const customerName = (c: { civilite?: string; nom?: string; prenom?: string }) =>
  [c.civilite, c.prenom, c.nom].filter(Boolean).join(" ").trim() || "Client";

export const STATUS_LABEL: Record<string, string> = {
  brouillon: "Brouillon",
  signe: "Signé",
  annule: "Annulé",
};
