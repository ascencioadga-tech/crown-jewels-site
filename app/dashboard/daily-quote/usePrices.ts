"use client";

import { useEffect, useState } from "react";

const KEY = "cj_dash_prices";

export function usePrices() {
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setPrices(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(prices));
    } catch {}
  }, [prices, hydrated]);

  return { prices, setPrices, hydrated };
}

const CLIENTS_KEY = "cj_dash_clients";

export function useSelectedClients() {
  const [selected, setSelected] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CLIENTS_KEY);
      if (raw) setSelected(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(CLIENTS_KEY, JSON.stringify(selected));
    } catch {}
  }, [selected, hydrated]);

  return { selected, setSelected, hydrated };
}
