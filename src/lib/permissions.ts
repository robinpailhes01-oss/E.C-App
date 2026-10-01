import type { Role } from "./types";

/** Direction et secrétariat : voient tous les dossiers et les mettent à jour. */
export const isStaff = (r: Role) => r === "directeur" || r === "secretaire";

export const homePath = (r: Role) => (r === "directeur" ? "/tableau-de-bord" : r === "secretaire" ? "/dossiers" : "/commandes");

export const ROLE_LABEL: Record<Role, string> = { directeur: "Direction", secretaire: "Secrétariat", commercial: "Commercial" };
