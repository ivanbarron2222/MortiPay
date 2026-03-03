import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";
const envTenantSlug = import.meta.env.VITE_TENANT_SLUG?.trim() ?? "demo-shop";

const TENANT_SLUG_KEY = "mf_tenant_slug";

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export function isSupabaseEnabled() {
  return import.meta.env.VITE_USE_SUPABASE === "true" && Boolean(supabase);
}

export function getActiveTenantSlug(): string {
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(TENANT_SLUG_KEY);
    if (stored) return stored;
  }
  return envTenantSlug;
}

export function setActiveTenantSlug(slug: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(TENANT_SLUG_KEY, slug);
  }
}

export function clearActiveTenantSlug() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(TENANT_SLUG_KEY);
  }
}
