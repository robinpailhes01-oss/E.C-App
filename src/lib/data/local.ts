import type { AppSettings, Order, OrderFilter, Profile } from "../types";
import { normalizeSettings } from "../settings";
import { COMPANY } from "../company";
import { normalizeOrder } from "./normalize";
import type { DataStore } from "./store";

const KEY_ORDERS = "ec.orders.v1";
const KEY_SESSION = "ec.session.v1";
const KEY_SEQ = "ec.seq.v1";
const KEY_SETTINGS = "ec.settings.v1";

const DEMO_ACCOUNTS: Profile[] = [
  { id: "u-dir", email: "direction@energiesconcept.fr", fullName: "Direction Énergies Concept", role: "directeur", active: true },
  { id: "u-com1", email: "julien@energiesconcept.fr", fullName: "Julien Martin", role: "commercial", phone: "06 12 34 56 78", active: true },
  { id: "u-com2", email: "sophie@energiesconcept.fr", fullName: "Sophie Durand", role: "commercial", phone: "06 98 76 54 32", active: true },
];

const read = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key: string, value: unknown) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode */
  }
};

const applyFilter = (orders: Order[], f?: OrderFilter) =>
  orders.filter((o) => {
    if (f?.commercialId && o.commercialId !== f.commercialId) return false;
    if (f?.status && o.status !== f.status) return false;
    if (f?.from && o.createdAt < f.from) return false;
    if (f?.to && o.createdAt > f.to) return false;
    return true;
  });

export class LocalStore implements DataStore {
  readonly mode = "demo" as const;

  demoAccounts() {
    return DEMO_ACCOUNTS;
  }

  async signIn(email: string) {
    const p = DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
    if (!p) throw new Error("Compte inconnu (mode démo : choisissez un compte dans la liste).");
    write(KEY_SESSION, p.id);
    return p;
  }

  async signOut() {
    write(KEY_SESSION, null);
  }

  async getSession() {
    const id = read<string | null>(KEY_SESSION, null);
    return DEMO_ACCOUNTS.find((a) => a.id === id) ?? null;
  }

  async listProfiles() {
    return DEMO_ACCOUNTS;
  }

  async listOrders(filter?: OrderFilter) {
    const session = await this.getSession();
    const all = read<Order[]>(KEY_ORDERS, []).map(normalizeOrder);
    const scoped = session?.role === "commercial" ? all.filter((o) => o.commercialId === session.id) : all;
    return applyFilter(scoped, filter).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getOrder(id: string) {
    const found = read<Order[]>(KEY_ORDERS, []).find((o) => o.id === id);
    return found ? normalizeOrder(found) : null;
  }

  async saveOrder(order: Order) {
    const all = read<Order[]>(KEY_ORDERS, []);
    const idx = all.findIndex((o) => o.id === order.id);
    const now = new Date().toISOString();
    let saved: Order = { ...order, updatedAt: now };
    if (idx === -1) {
      const year = new Date().getFullYear();
      const seq = read<Record<string, number>>(KEY_SEQ, {});
      seq[year] = (seq[year] ?? 0) + 1;
      write(KEY_SEQ, seq);
      saved = { ...saved, numero: `${COMPANY.orderPrefix}-${year}-${String(seq[year]).padStart(4, "0")}`, createdAt: saved.createdAt || now };
      all.push(saved);
    } else {
      all[idx] = saved;
    }
    write(KEY_ORDERS, all);
    return saved;
  }

  async deleteOrder(id: string) {
    write(
      KEY_ORDERS,
      read<Order[]>(KEY_ORDERS, []).filter((o) => o.id !== id),
    );
  }

  async getSettings() {
    return normalizeSettings(read<Partial<AppSettings> | null>(KEY_SETTINGS, null));
  }

  async saveSettings(settings: AppSettings) {
    const session = await this.getSession();
    const saved = normalizeSettings({ ...settings, updatedAt: new Date().toISOString(), updatedBy: session?.fullName });
    write(KEY_SETTINGS, saved);
    return saved;
  }
}
