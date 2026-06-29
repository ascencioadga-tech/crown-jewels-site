"use client";

/* ============================================================
   Crown Jewels — Inbound uploads (the Ship Sheet → Receiving pipe)

   When a grower hits "Send to Nogales" on the Ship Sheet, the load
   is written here; the Receiving app reads it and shows it in the
   48-hour arrivals window. Same offline-first store as orders &
   inventory (localStorage now, Supabase-syncable later), so the
   two apps share one source of truth.

   The `Inbound` shape is the contract — it matches exactly what
   Receiving renders for an arrival.
   ============================================================ */

import { useCloudCollection } from "../lib/cloudStore";

/** One declared line on a load. */
export type Line = {
  /** Commodity name as declared on the manifest. */
  n: string;
  /** Glyph id from ProduceGlyph (data ids). */
  cid: string;
  /** Pack / size. */
  sz: string;
  /** Grower-side lot number. */
  lot: string;
  /** Cases declared by the grower. */
  dec: number;
};

/* ---------------- Lot lifecycle ----------------
   A load IS a grower lot-bundle. The same record is followed end to end:
   declared (the moment the farmer sends) → received (checked in at the dock,
   posted to inventory) → settled (sold & liquidated to the grower). Accounting
   reads every status; the Settlement Sheet turns "received" lots into "settled". */
export type LotStatus = "declared" | "received" | "settled";

/** The grower liquidation, written when a lot is settled. */
export type LotSettlement = {
  soldCases: number;
  /** FOB sale price per case. */
  fobPrice: number;
  /** soldCases × fobPrice. */
  gross: number;
  commissionPct: number;
  commission: number;
  /** Cold storage, freight, inspection, etc. */
  charges: number;
  /** Grower net = gross − commission − charges. */
  net: number;
  settledAt: string;
};

/** A load crossing into Nogales — the unit Receiving works against, and the
    lot every other app follows. */
export type Inbound = {
  id: string;
  grower: string;
  region: string;
  truck: string;
  manifest: string;
  seal: string;
  when: "today" | "tomorrow";
  eta: string;
  rel: string;
  arrived: boolean;
  uploaded: string;
  /** Reefer pulp temp in °F at the dock (— before arrival). */
  temp: string;
  /** Receiver / crew assigned at the door. */
  receiver: string;
  /** Dock door, once at the dock. */
  door: string;
  /** Set once the load is received & posted to inventory — drops it from arrivals for good. */
  received?: boolean;
  /** Cases actually received at the dock (after shorts/overs), set on post. */
  receivedCases?: number;
  /** Lifecycle status. Missing = derive from received/settlement (back-compat). */
  status?: LotStatus;
  /** Grower liquidation, set when the lot is settled. */
  settlement?: LotSettlement;
  /** Realized sale value across all shipped orders drawn from this lot
      (Σ cases × unit price). Accumulated by Shipping on confirm; the
      Settlement Sheet pre-fills the lot's gross from this. */
  soldValue?: number;
  /** Cases of this lot that have actually shipped & sold. */
  soldCases?: number;
  lines: Line[];
};

const KEY = "cj_inbound_uploads_v2_blank";

/* ---- lot helpers (shared across apps) ---- */
export const lotCases = (l: Inbound) => l.lines.reduce((a, ln) => a + ln.dec, 0);
export const lotCode = (l: Inbound) => l.lines[0]?.lot || l.id;
export function lotStatus(l: Inbound): LotStatus {
  if (l.settlement || l.status === "settled") return "settled";
  if (l.received || l.status === "received") return "received";
  return "declared";
}

export function useInboundUploads() {
  const { items, hydrated, setAll } = useCloudCollection<Inbound>({
    table: "inbound_uploads",
    localKey: KEY,
  });
  /** Add (or replace) a load — newest first. Stamps it "declared". */
  const addUpload = (load: Inbound) =>
    setAll([{ ...load, status: load.status ?? "declared" }, ...items.filter((x) => x.id !== load.id)]);
  /** Mark a load received & posted — leaves the arrivals window, advances the lot. */
  const markReceived = (id: string, receivedCases?: number) =>
    setAll(
      items.map((x) =>
        x.id === id
          ? { ...x, received: true, status: "received", receivedCases: receivedCases ?? lotCases(x) }
          : x
      )
    );
  /** Settle & liquidate a lot to the grower — the end of the thread. */
  const markSettled = (id: string, settlement: LotSettlement) =>
    setAll(items.map((x) => (x.id === id ? { ...x, status: "settled", settlement } : x)));
  /** Accumulate realized sale value/cases onto lots when an order ships.
      `sales` maps inbound-load id → { cases, value } drawn from that lot,
      so the lot knows how much its product actually sold for. */
  const recordSale = (sales: Record<string, { cases: number; value: number }>) => {
    const ids = Object.keys(sales);
    if (ids.length === 0) return;
    setAll(
      items.map((x) => {
        const s = sales[x.id];
        if (!s) return x;
        return {
          ...x,
          soldCases: (x.soldCases || 0) + s.cases,
          soldValue: (x.soldValue || 0) + s.value,
        };
      })
    );
  };
  return { uploads: items, hydrated, addUpload, markReceived, markSettled, recordSale };
}

/** Realized average FOB per case for a lot (0 if nothing sold yet). */
export const lotSoldAvg = (l: Inbound): number =>
  l.soldCases && l.soldCases > 0 ? (l.soldValue || 0) / l.soldCases : 0;

/* ---------------- QR payload contract ----------------
   Ship Sheet encodes this into the QR on the shipping letter;
   Receiving decodes it from a scanned/picked document to match
   the exact load. Kept small and versioned. */

export function loadToQR(load: Inbound): string {
  return JSON.stringify({
    v: 1,
    t: "cj-load",
    id: load.id,
    lot: load.lines[0]?.lot ?? "",
    g: load.grower,
    cs: load.lines.reduce((a, l) => a + l.dec, 0),
  });
}

/** Parse a scanned QR / barcode text back to a load id (or null). */
export function parseQR(text: string): { id: string; lot?: string; grower?: string } | null {
  const raw = (text || "").trim();
  if (!raw) return null;
  // JSON payload (our format)
  try {
    const o = JSON.parse(raw);
    if (o && o.t === "cj-load" && typeof o.id === "string") {
      return { id: o.id, lot: o.lot, grower: o.g };
    }
  } catch {
    /* not JSON */
  }
  // Bare load id, e.g. "IN-abc123"
  if (/^IN-[a-z0-9]+$/i.test(raw)) return { id: raw };
  return null;
}
