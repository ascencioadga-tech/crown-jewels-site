"use client";

import { useEffect, useState } from "react";

export type OrderLine = {
  id: string;
  commodityId: string;
  productName: string;
  size: string;
  unit: string;
  pallet: string;
  quantity: number;
  unitPrice: number;
};

export type OrderStatus =
  | "open"
  | "confirmed"
  | "shipped"
  | "invoiced"
  | "paid"
  | "cancelled";

export type StatusEvent = {
  status: OrderStatus;
  at: string; // ISO
  by: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  channel: string;
  destination: string;
  customerPO: string;
  orderDate: string; // YYYY-MM-DD
  shipDate: string; // YYYY-MM-DD
  salesperson: string;
  terms: string;
  status: OrderStatus;
  lines: OrderLine[];
  notes?: string;
  createdAt: string; // ISO
  history: StatusEvent[];
};

const ORDERS_KEY = "cj_orders_v1";
const SEQ_KEY = "cj_order_seq_v1";
const SEQ_START = 1001;

function read(): Order[] {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (raw) return JSON.parse(raw) as Order[];
  } catch {}
  return [];
}

function write(orders: Order[]) {
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch {}
}

/** Sequential, collision-proof order number — replaces the blue sheet. */
export function nextOrderNumber(): string {
  let seq = SEQ_START;
  try {
    const raw = localStorage.getItem(SEQ_KEY);
    seq = raw ? parseInt(raw, 10) + 1 : SEQ_START;
    localStorage.setItem(SEQ_KEY, String(seq));
  } catch {}
  const year = new Date().getFullYear();
  return `CJ-${year}-${seq}`;
}

export function orderTotal(o: Order): number {
  return o.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
}

// ---- Demo seed so the screens are meaningful on first load ----
function seed(): Order[] {
  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const minus = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - days);
    return iso(d);
  };
  const plus = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return iso(d);
  };
  const mk = (
    seq: number,
    customerId: string,
    customerName: string,
    channel: string,
    destination: string,
    po: string,
    sales: string,
    terms: string,
    orderDate: string,
    shipDate: string,
    status: OrderStatus,
    lines: Omit<OrderLine, "id">[]
  ): Order => ({
    id: `seed-${seq}`,
    orderNumber: `CJ-${today.getFullYear()}-${seq}`,
    customerId,
    customerName,
    channel,
    destination,
    customerPO: po,
    orderDate,
    shipDate,
    salesperson: sales,
    terms,
    status,
    lines: lines.map((l, i) => ({ ...l, id: `seed-${seq}-${i}` })),
    createdAt: new Date().toISOString(),
    history: [{ status, at: new Date().toISOString(), by: sales }],
  });

  return [
    mk(1001, "kr-cal", "Kroger — California Division", "Retail", "Compton, CA", "PO-558213", "Alejandro", "Net 21", minus(2), plus(1), "confirmed", [
      { commodityId: "table-grapes", productName: "Table Grapes", size: "XLG", unit: "18 LBS", pallet: "90", quantity: 880, unitPrice: 24.5 },
      { commodityId: "citrus", productName: "Citrus", size: "88's", unit: "CARTON", pallet: "56", quantity: 504, unitPrice: 18.0 },
    ]),
    mk(1002, "sysco-la", "Sysco Los Angeles", "Foodservice", "City of Industry, CA", "4471902", "Marisol", "Net 14", minus(1), plus(2), "open", [
      { commodityId: "bell-peppers", productName: "Bell Peppers", size: "LGE", unit: "11/9 BU", pallet: "56", quantity: 336, unitPrice: 16.5 },
      { commodityId: "tomatoes", productName: "Tomatoes", size: "XLG", unit: "11 LB", pallet: "100", quantity: 600, unitPrice: 14.25 },
      { commodityId: "cucumbers", productName: "Cucumbers", size: "SEL", unit: "11/9 BU", pallet: "49", quantity: 245, unitPrice: 12.0 },
    ]),
    mk(1003, "frieda", "Frieda's Specialty Produce", "Wholesale", "Los Alamitos, CA", "FR-22087", "Diego", "Net 10 (PACA)", minus(5), minus(3), "shipped", [
      { commodityId: "pomegranates", productName: "Pomegranates", size: "LGE", unit: "25 LB", pallet: "60", quantity: 120, unitPrice: 32.0 },
    ]),
  ];
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let existing = read();
    if (existing.length === 0) {
      existing = seed();
      write(existing);
      // advance the sequence past the seed range
      try {
        localStorage.setItem(SEQ_KEY, "1003");
      } catch {}
    }
    setOrders(existing);
    setHydrated(true);
  }, []);

  const persist = (next: Order[]) => {
    setOrders(next);
    write(next);
  };

  const addOrder = (o: Order) => persist([o, ...orders]);

  const updateOrder = (id: string, patch: Partial<Order>) =>
    persist(orders.map((o) => (o.id === id ? { ...o, ...patch } : o)));

  const setStatus = (id: string, status: OrderStatus, by = "Alejandro") =>
    persist(
      orders.map((o) =>
        o.id === id
          ? {
              ...o,
              status,
              history: [
                ...o.history,
                { status, at: new Date().toISOString(), by },
              ],
            }
          : o
      )
    );

  const removeOrder = (id: string) =>
    persist(orders.filter((o) => o.id !== id));

  return { orders, hydrated, addOrder, updateOrder, setStatus, removeOrder };
}
