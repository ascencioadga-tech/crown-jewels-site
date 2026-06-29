"use client";

import type { Commodity } from "../daily-quote/data";
import type { Order } from "./useOrders";
import { useCloudCollection } from "../../lib/cloudStore";

// ---- Inventory model ----
// One row of the Google-sheet board's TOP section: a lot of product on hand
// (Holdover) or arriving (Incoming), from a grower/supplier, with quantities
// spread across that commodity's size columns.

export type LotKind = "holdover" | "incoming";

export type InventoryLot = {
  id: string;
  commodityId: string;
  kind: LotKind;
  grower: string; // grower / supplier
  label: string; // brand / label
  arrivalDate: string; // YYYY-MM-DD
  manifest: string; // manifest #
  /** Units per size, keyed by the raw size label as entered. */
  quantities: Record<string, number>;
  createdAt: string; // ISO
};

const INV_KEY = "cj_inventory_v3_blank";
const INV_SEED_KEY = "cj_inventory_seed_20260522";

// Normalize a size label so "6's" and "6", "72'S" and "72's" collapse to one
// column — but keep distinct codes like SS / STA / SSL intact.
export const normSize = (s: string) =>
  s
    .trim()
    .toUpperCase()
    .replace(/['’]\s*S$/, "") // 6's -> 6, 72'S -> 72
    .replace(/\s+/g, "");

// Storage moved to the shared cloud store (app/lib/cloudStore.ts).

let lotSeq = 0;
export function newLotId(): string {
  return `lot-${Date.now()}-${lotSeq++}`;
}

// ---- Seed: Agripacking, Nogales AZ — week of 05/22/2026 ----
// Cucumbers + Melons use the same size codes as the recorded blue-sheet
// orders so the board nets out cleanly; the rest show fresh availability.
const SEED_LOTS: InventoryLot[] = [];

export function useInventory() {
  const {
    items: lots,
    hydrated,
    setAll: persist,
  } = useCloudCollection<InventoryLot>({
    table: "inventory_lots",
    localKey: INV_KEY,
    hydrate: (loaded) => {
      let all = loaded;
      try {
        if (!localStorage.getItem(INV_SEED_KEY)) {
          const have = new Set(all.map((l) => l.id));
          const toAdd = SEED_LOTS.filter((l) => !have.has(l.id));
          all = [...toAdd, ...all];
          localStorage.setItem(INV_SEED_KEY, "1");
        }
      } catch {}
      return all;
    },
  });

  const addLot = (lot: InventoryLot) => persist([lot, ...lots]);
  /** Add several lots at once (e.g. all commodities on a received load). */
  const addLots = (newLots: InventoryLot[]) =>
    newLots.length ? persist([...newLots, ...lots]) : undefined;
  const updateLot = (id: string, patch: Partial<InventoryLot>) =>
    persist(lots.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const removeLot = (id: string) => persist(lots.filter((l) => l.id !== id));

  return { lots, hydrated, addLot, addLots, updateLot, removeLot };
}

// ---- Board builder: nets inventory against orders, by size column ----

export type BoardColumn = { key: string; label: string };

export type BoardLotRow = InventoryLot & {
  qtyByCol: Record<string, number>;
  total: number;
};

export type BoardOrderRow = {
  orderId: string;
  orderNumber: string;
  customer: string;
  destination: string;
  po: string;
  shipDate: string;
  qtyByCol: Record<string, number>;
  total: number;
};

export type CommodityBoard = {
  columns: BoardColumn[];
  lotRows: BoardLotRow[];
  orderRows: BoardOrderRow[];
  startingByCol: Record<string, number>;
  orderedByCol: Record<string, number>;
  availableByCol: Record<string, number>;
  startingTotal: number;
  orderedTotal: number;
  availableTotal: number;
  oversold: boolean;
};

const sumValues = (m: Record<string, number>) =>
  Object.values(m).reduce((s, n) => s + (n || 0), 0);

/** Collapse a lot's raw-keyed quantities into normalized-key buckets. */
function normalizedLot(lot: InventoryLot): Record<string, number> {
  const out: Record<string, number> = {};
  Object.entries(lot.quantities).forEach(([raw, q]) => {
    const k = normSize(raw);
    out[k] = (out[k] || 0) + (q || 0);
  });
  return out;
}

export function buildBoard(
  commodity: Commodity,
  allLots: InventoryLot[],
  allOrders: Order[]
): CommodityBoard {
  const lots = allLots.filter((l) => l.commodityId === commodity.id);
  // Orders still drawing on today's inventory: open / confirmed (not yet
  // shipped, invoiced, or paid — those cycles are done) and not cancelled.
  const orders = allOrders.filter(
    (o) =>
      (o.status === "open" || o.status === "confirmed") &&
      o.lines.some((l) => l.commodityId === commodity.id)
  );

  // ---- Resolve the size columns ----
  const catalogByKey = new Map(
    commodity.sizes.map((s) => [normSize(s.size), s.size])
  );
  const seen = new Map<string, string>(); // key -> display label
  const pushKey = (key: string, label: string) => {
    if (!seen.has(key)) seen.set(key, catalogByKey.get(key) ?? label);
  };

  let hasData = false;
  lots.forEach((l) =>
    Object.keys(l.quantities).forEach((raw) => {
      hasData = true;
      pushKey(normSize(raw), raw);
    })
  );
  orders.forEach((o) =>
    o.lines
      .filter((l) => l.commodityId === commodity.id)
      .forEach((l) => {
        hasData = true;
        pushKey(normSize(l.size), l.size);
      })
  );
  if (!hasData) commodity.sizes.forEach((s) => pushKey(normSize(s.size), s.size));

  // Order: catalog order first, then any extra data sizes in insertion order.
  const columns: BoardColumn[] = [];
  commodity.sizes.forEach((s) => {
    const k = normSize(s.size);
    if (seen.has(k) && !columns.some((c) => c.key === k))
      columns.push({ key: k, label: seen.get(k)! });
  });
  for (const [k, label] of seen) {
    if (!columns.some((c) => c.key === k)) columns.push({ key: k, label });
  }

  // ---- Lot rows + starting totals ----
  const startingByCol: Record<string, number> = {};
  columns.forEach((c) => (startingByCol[c.key] = 0));

  const lotRows: BoardLotRow[] = lots
    .slice()
    .sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "holdover" ? -1 : 1;
      return a.arrivalDate.localeCompare(b.arrivalDate);
    })
    .map((lot) => {
      const norm = normalizedLot(lot);
      const qtyByCol: Record<string, number> = {};
      columns.forEach((c) => {
        const q = norm[c.key] || 0;
        qtyByCol[c.key] = q;
        startingByCol[c.key] += q;
      });
      return { ...lot, qtyByCol, total: sumValues(qtyByCol) };
    });

  // ---- Order rows + ordered totals ----
  const orderedByCol: Record<string, number> = {};
  columns.forEach((c) => (orderedByCol[c.key] = 0));

  const orderRows: BoardOrderRow[] = orders.map((o) => {
    const qtyByCol: Record<string, number> = {};
    columns.forEach((c) => (qtyByCol[c.key] = 0));
    o.lines
      .filter((l) => l.commodityId === commodity.id)
      .forEach((l) => {
        const k = normSize(l.size);
        if (qtyByCol[k] === undefined) qtyByCol[k] = 0;
        qtyByCol[k] += l.quantity || 0;
        orderedByCol[k] = (orderedByCol[k] || 0) + (l.quantity || 0);
      });
    return {
      orderId: o.id,
      orderNumber: o.orderNumber,
      customer: o.customerName,
      destination: o.destination,
      po: o.customerPO,
      shipDate: o.shipDate,
      qtyByCol,
      total: sumValues(qtyByCol),
    };
  });

  // ---- Available = starting - ordered ----
  const availableByCol: Record<string, number> = {};
  let oversold = false;
  columns.forEach((c) => {
    const a = (startingByCol[c.key] || 0) - (orderedByCol[c.key] || 0);
    availableByCol[c.key] = a;
    if (a < 0) oversold = true;
  });

  const startingTotal = sumValues(startingByCol);
  const orderedTotal = sumValues(orderedByCol);

  return {
    columns,
    lotRows,
    orderRows,
    startingByCol,
    orderedByCol,
    availableByCol,
    startingTotal,
    orderedTotal,
    availableTotal: startingTotal - orderedTotal,
    oversold,
  };
}
