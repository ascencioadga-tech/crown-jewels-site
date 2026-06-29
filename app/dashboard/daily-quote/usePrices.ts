"use client";

// Daily-quote prices and client selection. Backed by the shared cloud store:
// localStorage in local mode, a Supabase `app_kv` row (with realtime) once the
// backend is configured. Same surface as before — { prices, setPrices, hydrated }.

import { useCloudDoc } from "../../lib/cloudStore";

export function usePrices() {
  const { value: prices, setValue: setPrices, hydrated } = useCloudDoc<    Record<string, string>
  >("prices_v2", {});
  return { prices, setPrices, hydrated };
}

export function useSelectedClients() {
  const { value: selected, setValue: setSelected, hydrated } = useCloudDoc<    string[]
  >("selected_clients_v2", []);
  return { selected, setSelected, hydrated };
}
