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

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setOrders(read());
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
