import type { AppSettings, DossierSuivi, Order, OrderFilter, Profile, Sav, StoredFile } from "../types";

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

  // --- Suivi de dossier (secrétariat). Le commercial ne voit que les dossiers de ses bons.
  listDossiers(): Promise<DossierSuivi[]>;
  getDossier(orderId: string): Promise<DossierSuivi>;
  saveDossier(dossier: DossierSuivi): Promise<DossierSuivi>;

  // --- Fichiers (photos de documents, photos SAV)
  uploadFile(scope: string, file: File): Promise<StoredFile>;
  getFileUrl(file: StoredFile): Promise<string>;
  deleteFile(file: StoredFile): Promise<void>;

  // --- SAV
  listSav(): Promise<Sav[]>;
  getSav(id: string): Promise<Sav | null>;
  saveSav(sav: Sav): Promise<Sav>;
}
