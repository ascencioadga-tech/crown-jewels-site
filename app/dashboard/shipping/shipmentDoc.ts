/* ============================================================
   Shared shipment-document contract.

   When an order ships, the Shipping app assembles one of these
   and both printable documents render from it:
     • the PASSING sales sheet (records the lot + the price each
       product sold for — what Accounting reconciles against)
     • the Straight Bill of Lading (the freight document)

   The LOT is the key field: it's recorded on every line so the
   sale price ties back to the exact grower lot.
   ============================================================ */

import type { Order, OrderLine } from "../order-system/useOrders";
import { normSize, type InventoryLot } from "../order-system/useInventory";
import type { Inbound } from "../inboundUploads";

export type ShipmentDocLine = {
  commodityId: string;
  /** Full carton description, e.g. "Cucumbers Slicers Carton — Select · Mexico". */
  description: string;
  size: string;
  /** Grower lot code recorded on the sale (links the price back to the lot). */
  lot: string;
  cases: number;
  /** Unit of measure, e.g. "cs". */
  uom: string;
  unitPrice: number;
  /** cases × unitPrice. */
  amount: number;
  /** cases × per-case weight (lb). */
  weightLb: number;
  /** Per-lot breakdown when the line was filled FIFO across several lots —
      used to record the realized sale value back onto each grower lot. */
  lotDraws?: LotSale[];
};

/** One grower lot's slice of a shipped line: which inbound load, how many
    cases came from it, and the realized sale value for those cases. */
export type LotSale = {
  /** The inbound-load id (the grower lot-bundle) the cases trace to. */
  inboundId: string;
  grower: string;
  /** Grower lot code. */
  lot: string;
  cases: number;
  /** cases × unitPrice — what this lot's product sold for on this line. */
  value: number;
};

export type ShipmentDoc = {
  orderNumber: string;
  orderDate: string;
  shipDate: string;
  salesperson: string;
  customer: string;
  /** Multi-line ship-to / bill-to address block. */
  shipTo: string[];
  customerPO: string;
  /** Carrier / truck code. */
  carrier: string;
  /** Trailer plate / seal. */
  trailer: string;
  destination: string;
  reeferTemp: string;
  lines: ShipmentDocLine[];
  totalCases: number;
  totalAmount: number;
  totalWeightLb: number;
  pallets: number;
  /** Seal #, when applied at the dock (optional). */
  seal?: string;
  /** Multi-line bill-to address block (defaults to the ship-to). */
  billTo?: string[];
  /** Payment terms, e.g. "Net 21". */
  terms?: string;
  /** Sales channel, e.g. "Retail". */
  channel?: string;
};

/* ============================================================
   buildShipmentDoc — assemble the shared document from an order.

   For each order line we trace the inventory lots that fill it
   (FIFO, the same plan the Shipping screen shows) back to the
   grower load they came from. Inventory lots posted by Receiving
   carry the label "Received · <inboundId>"; we read that id, find
   the inbound load, and match the line's commodityId + normSize
   to the inbound line's `lot` code. If a line is filled FIFO from
   several loads we list every lot; if a draw can't be matched we
   fall back to the inventory lot's own label / manifest so the
   document is never blank.
   ============================================================ */

const LB_PER_CASE = 52;
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Pull the inbound-load id out of an inventory lot's "Received · <id>" label. */
function inboundIdFromLabel(label: string): string | null {
  const m = (label || "").match(/Received\s*·\s*(\S+)/);
  return m ? m[1] : null;
}

/** A single lot draw planned for a line — mirrors the Shipping screen's FIFO. */
type Draw = { lot: InventoryLot; cases: number };

/** Plan how one line is filled FIFO across on-hand inventory lots. */
function planDraws(line: OrderLine, lots: InventoryLot[]): Draw[] {
  const key = normSize(line.size);
  const candidates = lots
    .filter(
      (l) =>
        l.commodityId === line.commodityId &&
        Object.entries(l.quantities).some(
          ([sz, q]) => normSize(sz) === key && (q || 0) > 0
        )
    )
    .slice()
    .sort((a, b) => {
      const d = (a.arrivalDate || "").localeCompare(b.arrivalDate || "");
      return d !== 0 ? d : (a.createdAt || "").localeCompare(b.createdAt || "");
    });

  let need = Math.max(0, line.quantity || 0);
  const draws: Draw[] = [];
  for (const lot of candidates) {
    if (need <= 0) break;
    const avail = Object.entries(lot.quantities).reduce(
      (a, [sz, q]) => (normSize(sz) === key ? a + (q || 0) : a),
      0
    );
    if (avail <= 0) continue;
    const take = Math.min(avail, need);
    draws.push({ lot, cases: take });
    need -= take;
  }
  return draws;
}

/** Resolve the grower lot code an inventory lot's cases trace back to. */
function lotCodeFor(
  invLot: InventoryLot,
  line: OrderLine,
  loadsById: Map<string, Inbound>
): { code: string; inboundId: string | null; grower: string } {
  const inboundId = inboundIdFromLabel(invLot.label);
  const load = inboundId ? loadsById.get(inboundId) : undefined;
  if (load) {
    const key = normSize(line.size);
    // Match the inbound line by commodity + size; fall back to commodity only.
    const exact = load.lines.find(
      (ln) => ln.cid === line.commodityId && normSize(ln.sz) === key && !!ln.lot
    );
    const byCid = load.lines.find((ln) => ln.cid === line.commodityId && !!ln.lot);
    const ln = exact || byCid;
    if (ln && ln.lot) return { code: ln.lot, inboundId, grower: load.grower };
    // Load found but no matching lot code — fall back to the load id.
    return { code: load.id, inboundId, grower: load.grower };
  }
  // No inbound trace — fall back to the inventory lot's own label / manifest.
  const fallback = invLot.manifest || invLot.label || invLot.id;
  return { code: fallback, inboundId, grower: invLot.grower };
}

/** Build a ShipmentDoc for an order, given current inventory + inbound loads
    and the ship-form fields captured at the dock. */
export function buildShipmentDoc(
  order: Order,
  opts: {
    lots: InventoryLot[];
    loads: Inbound[];
    commodityName: (id: string, fallback?: string) => string;
    carrier?: string;
    trailer?: string;
    seal?: string;
    shipDate?: string;
    reeferTemp?: string;
  }
): ShipmentDoc {
  const { lots, loads, commodityName } = opts;
  const loadsById = new Map(loads.map((l) => [l.id, l]));

  const lines: ShipmentDocLine[] = order.lines.map((l) => {
    const cases = Math.max(0, l.quantity || 0);
    const unitPrice = l.unitPrice || 0;
    const amount = round2(cases * unitPrice);

    // Trace FIFO draws → grower lots. Each draw carries its realized value.
    const draws = planDraws(l, lots);
    const lotDraws: LotSale[] = [];
    const seenCodes: string[] = [];
    for (const d of draws) {
      const { code, inboundId, grower } = lotCodeFor(d.lot, l, loadsById);
      if (!seenCodes.includes(code)) seenCodes.push(code);
      lotDraws.push({
        inboundId: inboundId || d.lot.id,
        grower,
        lot: code,
        cases: d.cases,
        value: round2(d.cases * unitPrice),
      });
    }
    const description = commodityName(l.commodityId, l.productName);
    // Oversold lines (no on-hand inventory) ship with no lot trace.
    const lotLabel = seenCodes.length > 0 ? seenCodes.join(", ") : "—";

    return {
      commodityId: l.commodityId,
      description,
      size: l.size || "",
      lot: lotLabel,
      cases,
      uom: l.unit || "cs",
      unitPrice,
      amount,
      weightLb: Math.round(cases * LB_PER_CASE),
      lotDraws,
    };
  });

  const totalCases = lines.reduce((a, l) => a + l.cases, 0);
  const totalAmount = round2(lines.reduce((a, l) => a + l.amount, 0));
  const totalWeightLb = lines.reduce((a, l) => a + l.weightLb, 0);

  const shipTo = [
    order.customerName,
    order.destination || "",
  ].filter(Boolean);

  return {
    orderNumber: order.orderNumber,
    orderDate: order.orderDate,
    shipDate: opts.shipDate || order.shipDate,
    salesperson: order.salesperson,
    customer: order.customerName,
    shipTo,
    billTo: [order.customerName],
    customerPO: order.customerPO,
    carrier: opts.carrier || "",
    trailer: opts.trailer || "",
    seal: opts.seal || "",
    destination: order.destination || "",
    reeferTemp: opts.reeferTemp || "",
    terms: order.terms,
    channel: order.channel,
    lines,
    totalCases,
    totalAmount,
    totalWeightLb,
    // Estimate pallets at ~52 cases/pallet (display only).
    pallets: Math.max(1, Math.ceil(totalCases / 52)) || 0,
  };
}

/** Roll a ShipmentDoc's lot draws up to the realized sale per inbound load —
    the map Shipping passes to inboundUploads.recordSale on confirm. */
export function realizedSalesByLot(
  doc: ShipmentDoc
): Record<string, { cases: number; value: number }> {
  const out: Record<string, { cases: number; value: number }> = {};
  for (const line of doc.lines) {
    for (const d of line.lotDraws || []) {
      if (!d.inboundId) continue;
      const cur = out[d.inboundId] || { cases: 0, value: 0 };
      cur.cases += d.cases;
      cur.value = round2(cur.value + d.value);
      out[d.inboundId] = cur;
    }
  }
  return out;
}
