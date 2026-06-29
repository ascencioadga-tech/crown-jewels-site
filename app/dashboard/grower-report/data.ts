// Grower Report — data model for the Grower Activity Summary settlement.
// A grower's statement is grouped into commodity BLOCKS, each with product
// lines (received / invoiced qty, avg price, gross amount) and CHARGES
// (cold storage, inspection, pick & pack, commission, liquidation, …).
// Block roll-ups: Gross (product), Charges, Net Return. Grand total nets them.

export type GrowerProduct = {
  description: string;
  rcvd: number;
  shipped: number;
  invoiced: number;
  avgPrice: number;
  amount: number;
};
export type GrowerCharge = { label: string; amount: number; pct?: number };
export type GrowerBlock = {
  code: string;
  title: string;
  commodity: string; // short label for charts/cards
  accent: string;
  products: GrowerProduct[];
  charges: GrowerCharge[];
};
export type Grower = {
  id: string;
  name: string;
  region: string;
  period: string;
  statementDate: string;
  blocks: GrowerBlock[];
};

// ---------- compute helpers ----------
export const sum = (a: number[]) => a.reduce((s, n) => s + n, 0);
export const blockGross = (b: GrowerBlock) => sum(b.products.map((p) => p.amount));
export const blockUnits = (b: GrowerBlock) => sum(b.products.map((p) => p.invoiced || 0));
export const blockChargesTotal = (b: GrowerBlock) => sum(b.charges.map((c) => c.amount));
export const blockNet = (b: GrowerBlock) => blockGross(b) - blockChargesTotal(b);

export const growerGross = (g: Grower) => sum(g.blocks.map(blockGross));
export const growerChargesTotal = (g: Grower) => sum(g.blocks.map(blockChargesTotal));
export const growerUnits = (g: Grower) => sum(g.blocks.map(blockUnits));
export const growerNet = (g: Grower) => growerGross(g) - growerChargesTotal(g);
export const productBlocks = (g: Grower) => g.blocks.filter((b) => b.products.length > 0);

/** Aggregate every charge across all blocks by label, biggest first. */
export function chargeBreakdown(g: Grower): { label: string; amount: number }[] {
  const map: Record<string, number> = {};
  g.blocks.forEach((b) =>
    b.charges.forEach((c) => {
      const key = c.label.replace(/\s*-\s*Percent$/i, "").trim();
      map[key] = (map[key] || 0) + c.amount;
    })
  );
  return Object.entries(map)
    .map(([label, amount]) => ({ label, amount }))
    .sort((a, b) => b.amount - a.amount);
}

// ---------- formatters ----------
export const usd = (n: number) => {
  const r = Math.round(n);
  return (r < 0 ? "-$" : "$") + Math.abs(r).toLocaleString("en-US");
};
export const usd2 = (n: number) =>
  (n < -0.005 ? "-$" : "$") +
  Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const qty = (n: number) => n.toLocaleString("en-US");

// ---------- seed ----------
const prod = (
  description: string,
  invoiced: number,
  avgPrice: number,
  amount: number
): GrowerProduct => ({ description, rcvd: invoiced, shipped: 0, invoiced, avgPrice, amount });

export const GROWERS: Grower[] = [
  // ===== REAL report — Rancho Thomas (ID 9136) =====
  {
    id: "9136",
    name: "Rancho Thomas",
    region: "Sonora, MX",
    period: "Season 2026",
    statementDate: "2026-05-14",
    blocks: [],
  },

  // ===== Demo grower — Agrícola del Valle (positive net) =====
  {
    id: "8042",
    name: "Agrícola del Valle",
    region: "Sinaloa, MX",
    period: "Season 2026",
    statementDate: "2026-05-14",
    blocks: [],
  },

  // ===== Demo grower — Hortícola San Luis (positive net) =====
  {
    id: "7715",
    name: "Hortícola San Luis",
    region: "Sonora, MX",
    period: "Season 2026",
    statementDate: "2026-05-14",
    blocks: [],
  },
];

export const growerById = (id: string) => GROWERS.find((g) => g.id === id);
