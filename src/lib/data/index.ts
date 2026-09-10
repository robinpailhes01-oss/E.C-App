import { supabaseConfigured } from "../supabase/client";
import { LocalStore } from "./local";
import type { DataStore } from "./store";
import { SupabaseStore } from "./supabase";

let store: DataStore | null = null;

export function getStore(): DataStore {
  if (!store) store = supabaseConfigured() ? new SupabaseStore() : new LocalStore();
  return store;
}

export type { DataStore } from "./store";
