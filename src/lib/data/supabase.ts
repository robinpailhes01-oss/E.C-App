import type { Order, OrderFilter, Profile } from "../types";
import { computeTotals } from "../pricing";
import { getSupabase } from "../supabase/client";
import type { DataStore } from "./store";

type ProfileRow = { id: string; email: string; full_name: string; role: Profile["role"]; phone: string | null; active: boolean };

type OrderRow = {
  id: string;
  numero: string;
  status: Order["status"];
  commercial_id: string;
  commercial_name: string;
  customer: Order["customer"];
  lines: Order["lines"];
  remise_ht: number;
  vat_rate: number;
  financing: Order["financing"];
  notes: string | null;
  date_installation_prevue: string | null;
  lieu_signature: string | null;
  signature_client: string | null;
  signature_commercial: string | null;
  signed_at: string | null;
  created_at: string;
  updated_at: string;
};

const toProfile = (r: ProfileRow): Profile => ({
  id: r.id,
  email: r.email,
  fullName: r.full_name,
  role: r.role,
  phone: r.phone ?? undefined,
  active: r.active,
});

const toOrder = (r: OrderRow): Order => ({
  id: r.id,
  numero: r.numero,
  status: r.status,
  commercialId: r.commercial_id,
  commercialName: r.commercial_name,
  customer: r.customer,
  lines: r.lines,
  remiseHT: Number(r.remise_ht),
  vatRate: Number(r.vat_rate),
  financing: r.financing,
  notes: r.notes ?? undefined,
  dateInstallationPrevue: r.date_installation_prevue ?? undefined,
  lieuSignature: r.lieu_signature ?? undefined,
  signatureClient: r.signature_client ?? undefined,
  signatureCommercial: r.signature_commercial ?? undefined,
  signedAt: r.signed_at ?? undefined,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const toRow = (o: Order) => {
  const t = computeTotals(o);
  return {
    id: o.id,
    status: o.status,
    commercial_id: o.commercialId,
    commercial_name: o.commercialName,
    customer: o.customer,
    lines: o.lines,
    remise_ht: o.remiseHT,
    vat_rate: o.vatRate,
    financing: o.financing,
    notes: o.notes ?? null,
    date_installation_prevue: o.dateInstallationPrevue ?? null,
    lieu_signature: o.lieuSignature ?? null,
    signature_client: o.signatureClient ?? null,
    signature_commercial: o.signatureCommercial ?? null,
    signed_at: o.signedAt ?? null,
    total_ht: t.totalHT,
    total_ttc: t.totalTTC,
    customer_name: `${o.customer.nom} ${o.customer.prenom}`.trim(),
  };
};

export class SupabaseStore implements DataStore {
  readonly mode = "supabase" as const;

  demoAccounts(): Profile[] {
    return [];
  }

  private async profileFor(userId: string): Promise<Profile | null> {
    const { data, error } = await getSupabase().from("profiles").select("*").eq("id", userId).maybeSingle();
    if (error) throw error;
    return data ? toProfile(data as ProfileRow) : null;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await getSupabase().auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message === "Invalid login credentials" ? "Identifiants incorrects." : error.message);
    const profile = await this.profileFor(data.user.id);
    if (!profile) throw new Error("Profil introuvable : demandez à la direction d'activer votre compte.");
    if (!profile.active) throw new Error("Compte désactivé.");
    return profile;
  }

  async signOut() {
    await getSupabase().auth.signOut();
  }

  async getSession() {
    const { data } = await getSupabase().auth.getSession();
    if (!data.session) return null;
    return this.profileFor(data.session.user.id);
  }

  async listProfiles() {
    const { data, error } = await getSupabase().from("profiles").select("*").order("full_name");
    if (error) throw error;
    return (data as ProfileRow[]).map(toProfile);
  }

  async listOrders(filter?: OrderFilter) {
    let q = getSupabase().from("orders").select("*").order("created_at", { ascending: false });
    if (filter?.commercialId) q = q.eq("commercial_id", filter.commercialId);
    if (filter?.status) q = q.eq("status", filter.status);
    if (filter?.from) q = q.gte("created_at", filter.from);
    if (filter?.to) q = q.lte("created_at", filter.to);
    const { data, error } = await q;
    if (error) throw error;
    return (data as OrderRow[]).map(toOrder);
  }

  async getOrder(id: string) {
    const { data, error } = await getSupabase().from("orders").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? toOrder(data as OrderRow) : null;
  }

  async saveOrder(order: Order) {
    const { data, error } = await getSupabase().from("orders").upsert(toRow(order), { onConflict: "id" }).select("*").single();
    if (error) throw error;
    return toOrder(data as OrderRow);
  }

  async deleteOrder(id: string) {
    const { error } = await getSupabase().from("orders").delete().eq("id", id);
    if (error) throw error;
  }
}
