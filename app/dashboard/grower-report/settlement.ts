// Settlement engine — GENERATES a grower settlement from raw inputs registered
// in La Libreta. Now lot-aware: you register LOTS (each a code + commodity +
// product lines); the engine computes each lot's net, then rolls lots up to
// commodity blocks and a grand total — feeding both El Rancho's summary and
// its lot-by-lot drill-down.
//   lot gross = Σ(qty × price);  charges = commission% + per-unit rates × units;
//   lot net = gross − charges.   commodity = Σ lots;   grand = Σ commodities − advances.

import type { Grower, GrowerBlock, GrowerProduct, GrowerCharge } from "./data";
import type { Lot } from "./growerLots";

export type ChargeRates = {
  commissionPct: number; // share of gross
  coldStoragePerUnit: number;
  inspectionPerUnit: number;
  pickPackPerUnit: number;
  packingPerUnit: number;
  interest?: number; // flat, grower-level
  advance?: number; // partial liquidation (flat, grower-level)
};
export type LotProductInput = { description: string; qty: number; unitPrice: number };
export type LotInput = { code: string; commodity: string; accent: string; products: LotProductInput[]; source?: "joya"; orderNumber?: string };
export type LotSettlementInput = {
  id: string;
  name: string;
  region: string;
  period: string;
  statementDate: string;
  lots: LotInput[];
  rates: ChargeRates;
};

const r2 = (n: number) => Math.round(n * 100) / 100;
const blockCode = (com: string) => "GEN " + com.replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase();

/** Compute the full settlement (summary grower + lot detail) from registered lots. */
export function generateFromLots(inp: LotSettlementInput): { grower: Grower; lots: Lot[] } {
  const R = inp.rates;
  const lotChargeLines = (gross: number, units: number) => [
    { l: "Sales Commission", a: r2(gross * R.commissionPct) },
    { l: "Cold Storage Charge", a: r2(units * R.coldStoragePerUnit) },
    { l: "Inspection Charges", a: r2(units * R.inspectionPerUnit) },
    { l: "Pick and Pack", a: r2(units * R.pickPackPerUnit) },
    { l: "Packing Supplies", a: r2(units * R.packingPerUnit) },
  ];

  // ---- per-lot detail (drill-down) ----
  const lots: Lot[] = inp.lots.map((L) => {
    const products = L.products.map((p) => ({ d: p.description, q: p.qty, p: p.unitPrice, a: r2(p.qty * p.unitPrice) }));
    const sale = r2(products.reduce((s, x) => s + x.a, 0));
    const units = L.products.reduce((s, p) => s + p.qty, 0);
    const charges = lotChargeLines(sale, units);
    const charge = r2(charges.reduce((s, c) => s + c.a, 0));
    return { code: L.code, commodity: L.commodity, sale, charge, net: r2(sale - charge), products, charges };
  });

  // ---- roll up to commodity blocks (summary) ----
  const order: string[] = [];
  const byCom: Record<string, LotInput[]> = {};
  inp.lots.forEach((L) => {
    if (!byCom[L.commodity]) {
      byCom[L.commodity] = [];
      order.push(L.commodity);
    }
    byCom[L.commodity].push(L);
  });

  const blocks: GrowerBlock[] = order.map((com) => {
    const comLots = byCom[com];
    const aggOrder: string[] = [];
    const agg: Record<string, { qty: number; amount: number }> = {};
    comLots.forEach((L) =>
      L.products.forEach((p) => {
        if (!agg[p.description]) {
          agg[p.description] = { qty: 0, amount: 0 };
          aggOrder.push(p.description);
        }
        agg[p.description].qty += p.qty;
        agg[p.description].amount += p.qty * p.unitPrice;
      })
    );
    const products: GrowerProduct[] = aggOrder.map((d) => {
      const a = agg[d];
      const amount = r2(a.amount);
      return { description: d, rcvd: a.qty, shipped: 0, invoiced: a.qty, avgPrice: a.qty ? r2(amount / a.qty) : 0, amount };
    });
    const gross = r2(products.reduce((s, p) => s + p.amount, 0));
    const units = products.reduce((s, p) => s + p.invoiced, 0);
    const charges: GrowerCharge[] = [
      { label: "Sales Commission - Percent", amount: r2(gross * R.commissionPct), pct: R.commissionPct },
      { label: "Cold Storage Charge", amount: r2(units * R.coldStoragePerUnit) },
      { label: "Inspection Charges", amount: r2(units * R.inspectionPerUnit) },
      { label: "Pick and Pack", amount: r2(units * R.pickPackPerUnit) },
      { label: "Packing Supplies", amount: r2(units * R.packingPerUnit) },
    ];
    return { code: blockCode(com), title: `${inp.name} ${com}`, commodity: com, accent: comLots[0].accent, products, charges };
  });

  const adv: GrowerCharge[] = [];
  if (R.interest) adv.push({ label: "Interest Charge", amount: r2(R.interest) });
  if (R.advance) adv.push({ label: "Partial Liquidation", amount: r2(R.advance) });
  if (adv.length)
    blocks.push({ code: "GEN CHGS", title: `${inp.name} Charges & Advances`, commodity: "Charges & Advances", accent: "#6b6a64", products: [], charges: adv });

  const grower: Grower = {
    id: inp.id,
    name: inp.name,
    region: inp.region,
    period: inp.period,
    statementDate: inp.statementDate,
    blocks,
  };
  return { grower, lots };
}

// ---------- seed: Rancho Verde, registered as lots ----------
const cuc = (q: number, p: number, fancy: boolean): LotProductInput => ({
  description: `Cucumbers, 1-1/9 bu ${fancy ? "Fancy" : "Select"} — Crown Jewels Mexico`,
  qty: q,
  unitPrice: p,
});
const roma = (q: number, p: number, twoLayer: boolean): LotProductInput => ({
  description: `Tomatoes, Roma 25# ${twoLayer ? "2-Layer" : "Loose"} — Crown Jewels Mexico`,
  qty: q,
  unitPrice: p,
});

export const RANCHO_VERDE_INPUT: LotSettlementInput = {
  id: "9201",
  name: "Rancho Verde",
  region: "Sinaloa, MX",
  period: "Season 2026",
  statementDate: "2026-05-14",
  lots: [],
  rates: { commissionPct: 0.1, coldStoragePerUnit: 0.28, inspectionPerUnit: 0.36, pickPackPerUnit: 1.55, packingPerUnit: 0.55, interest: 0, advance: 0 },
};

const _gen = generateFromLots(RANCHO_VERDE_INPUT);
export const RANCHO_VERDE = _gen.grower;
export const RANCHO_VERDE_LOTS = _gen.lots;

export const GENERATED_INPUTS: Record<string, LotSettlementInput> = { "9201": RANCHO_VERDE_INPUT };
export const GENERATED_GROWERS: Grower[] = [RANCHO_VERDE];
export const GENERATED_LOTS: Record<string, Lot[]> = { "9201": RANCHO_VERDE_LOTS };
export const GENERATED_IDS = new Set(Object.keys(GENERATED_INPUTS));
