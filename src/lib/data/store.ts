import type { AppSettings, Order, OrderFilter, Profile } from "../types";

export interface DataStore {
  readonly mode: "demo" | "supabase";
  /** Comptes de démonstration (mode démo uniquement). */
  demoAccounts(): Profile[];
  signIn(email: string, password: string): Promise<Profile>;
  signOut(): Promise<void>;
  getSession(): Promise<Profile | null>;
  listProfiles(): Promise<Profile[]>;
  listOrders(filter?: OrderFilter): Promise<Order[]>;
  getOrder(id: string): Promise<Order | null>;
  /** Crée ou met à jour un bon. Le numéro est attribué à la création. */
  saveOrder(order: Order): Promise<Order>;
  deleteOrder(id: string): Promise<void>;
  getSettings(): Promise<AppSettings>;
  saveSettings(settings: AppSettings): Promise<AppSettings>;
}
