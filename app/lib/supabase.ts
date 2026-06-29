"use client";

// Supabase access for the Crown Jewels dashboard.
//
// The app is a static export with no server of its own, so it talks to Supabase
// directly from the browser using the public anon key (safe by design — it is
// gated by Row-Level Security, not by secrecy; see supabase/schema.sql).
//
// Until the two env vars are set the whole backend is simply "off": every hook
// falls back to localStorage and the app behaves exactly as it does today. The
// moment the keys are present (set at build time, inlined per Next.js
// `NEXT_PUBLIC_` rules) the same code paths light up against the cloud.

import type { SupabaseClient } from "@supabase/supabase-js";

// Static references so Next.js inlines them into the client bundle at build.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export type BackendMode = "local" | "cloud";

/** True once both Supabase env vars are present (set at build time). */
export function isBackendConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/** "cloud" when configured, otherwise "local" (localStorage only). */
export function backendMode(): BackendMode {
  return isBackendConfigured() ? "cloud" : "local";
}

let clientPromise: Promise<SupabaseClient | null> | null = null;

/**
 * Lazily create (once) and return the Supabase client, or null if the backend
 * isn't configured. Dynamically imported so the supabase-js bundle is only
 * pulled when the keys actually exist.
 */
export function getSupabase(): Promise<SupabaseClient | null> {
  if (!isBackendConfigured()) return Promise.resolve(null);
  if (!clientPromise) {
    clientPromise = import("@supabase/supabase-js")
      .then(({ createClient }) =>
        createClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
          },
        })
      )
      .catch((e) => {
        console.warn("[supabase] client init failed; staying local", e);
        return null;
      });
  }
  return clientPromise;
}
