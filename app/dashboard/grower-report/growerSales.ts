// Grower-sales bridge — when a Joya order is attributed to a grower's lot, its
// lines post here; La Libreta reads them so the sale flows into that grower's
// settlement automatically. localStorage stands in for the shared backend.

export type GrowerSale = {
  id: string;
  growerId: string;
  growerName: string;
  lotCode: string;
  commodity: string;
  accent: string;
  description: string;
  qty: number;
  unitPrice: number;
  orderNumber: string;
  at: string;
};

const KEY = "cj_grower_sales_v2";

export function postSales(sales: GrowerSale[]) {
  try {
    const cur: GrowerSale[] = JSON.parse(localStorage.getItem(KEY) || "[]");
    localStorage.setItem(KEY, JSON.stringify([...cur, ...sales]));
  } catch {}
}

export function readSales(): GrowerSale[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function salesForGrower(id: string): GrowerSale[] {
  return readSales().filter((s) => s.growerId === id);
}
