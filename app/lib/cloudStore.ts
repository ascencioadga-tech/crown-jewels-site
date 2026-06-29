"use client";

// Offline-first data layer. Every collection/document hydrates instantly from
// localStorage, then — only when the backend is configured — overlays the
// shared Supabase copy and keeps it in sync (realtime + reconciling writes).
//
// In LOCAL mode this is byte-for-byte the old behavior: read localStorage on
// mount, write it on change. In CLOUD mode the same surface (`items`/`setAll`,
// `value`/`setValue`) transparently reads/writes the shared database and
// receives live updates from other users — which is what makes the Joya →
// Excel live link possible. Nothing here ever throws into the UI: a backend
// hiccup just leaves the local cache in place.

import { useCallback, useEffect, useRef, useState } from "react";
import { backendMode, getSupabase, type BackendMode } from "./supabase";

/* ============================================================
   Demo reset — clears ALL saved app data (orders, inventory,
   lots, prices, settlements, …) so the platform comes up at zero.
   Bump DEMO_VERSION to wipe every browser on its next load. It
   runs once at module-load, before any store reads localStorage,
   so no reload/flash is needed.
   ============================================================ */
const DEMO_VERSION = "blank-2026-06-28-2";
if (typeof window !== "undefined") {
  try {
    if (localStorage.getItem("cj_demo_version") !== DEMO_VERSION) {
      Object.keys(localStorage).forEach((k) => {
        if (k !== "cj_demo_version" && (k.startsWith("cj_") || k.startsWith("kv:"))) {
          localStorage.removeItem(k);
        }
      });
      localStorage.setItem("cj_demo_version", DEMO_VERSION);
    }
  } catch {}
}

type Identified = { id: string };

// Row shape stored in Supabase: { id, data: <the entity as JSON>, updated_at }.
type Row<T> = { id: string; data: T };

export type CloudCollectionOptions<T extends Identified> = {
  /** Supabase table name. */
  table: string;
  /** localStorage key for the offline cache. */
  localKey: string;
  /**
   * Runs once on the instant local hydrate — use for seeds, purges, and
   * import-once logic. Returns the final local list. (Local/demo only; cloud
   * rows always win once fetched, so demo seeds never pollute the shared DB.)
   */
  hydrate?: (loaded: T[]) => T[];
};

export type CloudCollection<T extends Identified> = {
  items: T[];
  hydrated: boolean;
  mode: BackendMode;
  /** Replace the whole list — updates state, the local cache, and (cloud) the DB. */
  setAll: (next: T[]) => void;
};

const stable = (x: unknown) => {
  try {
    return JSON.stringify(x);
  } catch {
    return Math.random().toString();
  }
};

/** A keyed collection (orders, inventory lots, …). */
export function useCloudCollection<T extends Identified>(
  opts: CloudCollectionOptions<T>
): CloudCollection<T> {
  const { table, localKey, hydrate } = opts;
  const mode = backendMode();
  const [items, setItems] = useState<T[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const itemsRef = useRef<T[]>([]);
  itemsRef.current = items;

  const readLocal = useCallback((): T[] => {
    try {
      const raw = localStorage.getItem(localKey);
      if (raw) return JSON.parse(raw) as T[];
    } catch {}
    return [];
  }, [localKey]);

  const writeLocal = useCallback(
    (list: T[]) => {
      try {
        localStorage.setItem(localKey, JSON.stringify(list));
      } catch {}
    },
    [localKey]
  );

  // ---- initial hydrate: instant local, then cloud overlay ----
  useEffect(() => {
    let cancelled = false;
    let local = readLocal();
    if (hydrate) local = hydrate(local);
    writeLocal(local);
    setItems(local);
    setHydrated(true);

    if (mode === "cloud") {
      (async () => {
        const sb = await getSupabase();
        if (!sb || cancelled) return;
        try {
          const { data, error } = await sb.from(table).select("id,data");
          if (error) throw error;
          const rows = ((data as Row<T>[]) ?? []).map((r) => r.data);
          if (!cancelled) {
            setItems(rows);
            writeLocal(rows);
          }
        } catch (e) {
          console.warn(`[cloud:${table}] fetch failed; using local cache`, e);
        }
      })();
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- realtime: refetch on any remote change (cloud only) ----
  useEffect(() => {
    if (mode !== "cloud") return;
    let active = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any;
    (async () => {
      const sb = await getSupabase();
      if (!sb || !active) return;
      channel = sb
        .channel(`rt-${table}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          async () => {
            try {
              const { data } = await sb.from(table).select("id,data");
              const rows = ((data as Row<T>[]) ?? []).map((r) => r.data);
              setItems(rows);
              writeLocal(rows);
            } catch {}
          }
        )
        .subscribe();
    })();
    return () => {
      active = false;
      if (channel) getSupabase().then((sb) => sb?.removeChannel(channel));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- setAll: state + local cache + cloud reconcile (diff upsert/delete) ----
  const setAll = useCallback(
    (next: T[]) => {
      const prev = itemsRef.current;
      setItems(next);
      writeLocal(next);
      if (mode === "cloud") {
        (async () => {
          const sb = await getSupabase();
          if (!sb) return;
          try {
            const prevById = new Map(prev.map((x) => [x.id, x]));
            const nextIds = new Set(next.map((x) => x.id));
            const upserts = next
              .filter((x) => {
                const p = prevById.get(x.id);
                return !p || stable(p) !== stable(x);
              })
              .map((x) => ({
                id: x.id,
                data: x,
                updated_at: new Date().toISOString(),
              }));
            const deletes = prev
              .filter((x) => !nextIds.has(x.id))
              .map((x) => x.id);
            if (upserts.length) await sb.from(table).upsert(upserts);
            if (deletes.length)
              await sb.from(table).delete().in("id", deletes);
          } catch (e) {
            console.warn(`[cloud:${table}] write failed (kept locally)`, e);
          }
        })();
      }
    },
    [mode, table, writeLocal]
  );

  return { items, hydrated, mode, setAll };
}

// ---------------- Singleton documents (prices map, client selection) ----------------

export type CloudDoc<T> = {
  value: T;
  hydrated: boolean;
  mode: BackendMode;
  /** setState-style setter; persists to local + (cloud) the app_kv row. */
  setValue: (next: T | ((prev: T) => T)) => void;
};

/** A single JSON document keyed by name, stored in the `app_kv` table. */
export function useCloudDoc<T>(key: string, initial: T): CloudDoc<T> {
  const mode = backendMode();
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);
  const localKey = `kv:${key}`;

  useEffect(() => {
    let cancelled = false;
    try {
      const raw = localStorage.getItem(localKey);
      if (raw) setValue(JSON.parse(raw) as T);
    } catch {}
    setHydrated(true);

    if (mode === "cloud") {
      (async () => {
        const sb = await getSupabase();
        if (!sb || cancelled) return;
        try {
          const { data } = await sb
            .from("app_kv")
            .select("data")
            .eq("key", key)
            .maybeSingle();
          if (data && !cancelled) {
            setValue((data as { data: T }).data);
            try {
              localStorage.setItem(localKey, JSON.stringify((data as { data: T }).data));
            } catch {}
          }
        } catch (e) {
          console.warn(`[cloud:kv:${key}] fetch failed`, e);
        }
      })();
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mode !== "cloud") return;
    let active = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any;
    (async () => {
      const sb = await getSupabase();
      if (!sb || !active) return;
      channel = sb
        .channel(`rt-kv-${key}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "app_kv", filter: `key=eq.${key}` },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (payload: any) => {
            const d = payload?.new?.data;
            if (d !== undefined) {
              setValue(d as T);
              try {
                localStorage.setItem(localKey, JSON.stringify(d));
              } catch {}
            }
          }
        )
        .subscribe();
    })();
    return () => {
      active = false;
      if (channel) getSupabase().then((sb) => sb?.removeChannel(channel));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved =
          typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          localStorage.setItem(localKey, JSON.stringify(resolved));
        } catch {}
        if (mode === "cloud") {
          (async () => {
            const sb = await getSupabase();
            if (!sb) return;
            try {
              await sb
                .from("app_kv")
                .upsert({ key, data: resolved, updated_at: new Date().toISOString() });
            } catch (e) {
              console.warn(`[cloud:kv:${key}] write failed`, e);
            }
          })();
        }
        return resolved;
      });
    },
    [key, localKey, mode]
  );

  return { value, hydrated, mode, setValue: update };
}
