"use client";

import { useEffect, useState } from "react";
import { termsToDays } from "./data";

export type InvoiceStatus = "draft" | "sent" | "paid";

export type Invoice = {
  number: string; // INV-YYYY-####
  date: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  status: InvoiceStatus;
  sentAt?: string; // ISO
  sentTo?: string;
  paidAt?: string; // ISO
};

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
  invoice?: Invoice;
};

const ORDERS_KEY = "cj_orders_v1";
const SEQ_KEY = "cj_order_seq_v1";
const SEQ_START = 1001;
const INV_SEQ_KEY = "cj_invoice_seq_v1";
const INV_START = 5001;

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

/** Sequential invoice number, separate series from order numbers. */
export function nextInvoiceNumber(): string {
  let seq = INV_START;
  try {
    const raw = localStorage.getItem(INV_SEQ_KEY);
    seq = raw ? parseInt(raw, 10) + 1 : INV_START;
    localStorage.setItem(INV_SEQ_KEY, String(seq));
  } catch {}
  return `INV-${new Date().getFullYear()}-${seq}`;
}

export function orderTotal(o: Order): number {
  return o.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
}

// ---- Real orders recorded from the 05/21/2026 blue sheets (Carlos) ----
// Order number = blue-sheet FILE#. Imported once per browser; deletable.
const BLUESHEET_IMPORT_KEY = "cj_bluesheet_import_20260521";

function blueLine(
  id: string,
  commodityId: string,
  productName: string,
  size: string,
  quantity: number,
  unitPrice: number
): OrderLine {
  return { id, commodityId, productName, size, unit: "", pallet: "", quantity, unitPrice };
}

function blueOrder(
  file: string,
  customerId: string,
  customerName: string,
  channel: string,
  po: string,
  lines: OrderLine[],
  notes?: string
): Order {
  const at = "2026-05-21T09:00:00.000Z";
  return {
    id: `bs-${file}`,
    orderNumber: file,
    customerId,
    customerName,
    channel,
    destination: "",
    customerPO: po,
    orderDate: "2026-05-21",
    shipDate: "2026-05-21",
    salesperson: "Carlos",
    terms: "Net 21",
    status: "open",
    lines,
    notes,
    createdAt: at,
    history: [{ status: "open", at, by: "Carlos" }],
  };
}

const BLUESHEET_ORDERS: Order[] = [
  blueOrder("348300", "calixtro", "Calixtro Dist.", "Wholesale", "158751", [
    blueLine("bs-348300-0", "cucumbers", "Cucumbers", "SS", 420, 26.95),
    blueLine("bs-348300-1", "cucumbers", "Cucumbers", "36", 810, 12.95),
  ]),
  blueOrder("348301", "fresh-direct", "Fresh Direct", "Retail", "N44974", [
    blueLine("bs-348301-0", "cucumbers", "Cucumbers", "LG", 42, 22.95),
  ]),
  blueOrder("348304", "calixtro", "Calixtro Dist.", "Wholesale", "158752", [
    blueLine("bs-348304-0", "melons", "Honeydew", "6", 1540, 5.0),
  ], "Grower: Agt #2"),
  blueOrder("348315", "calixtro", "Calixtro Dist.", "Wholesale", "158762", [
    blueLine("bs-348315-0", "cucumbers", "Cucumbers", "36", 1620, 12.95),
  ], "Grower: Agt #2"),
];

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Purge legacy demo/seed orders left from before the seed was removed.
    let all = read().filter((o) => !o.id.startsWith("seed-"));

    // One-time import of the recorded blue-sheet orders.
    try {
      if (!localStorage.getItem(BLUESHEET_IMPORT_KEY)) {
        const have = new Set(all.map((o) => o.orderNumber));
        const toAdd = BLUESHEET_ORDERS.filter((o) => !have.has(o.orderNumber));
        all = [...toAdd, ...all];
        localStorage.setItem(BLUESHEET_IMPORT_KEY, "1");
      }
    } catch {}

    write(all);
    setOrders(all);
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

  // Create the invoice for an order (idempotent — returns existing if present).
  const generateInvoice = (id: string): Invoice | null => {
    const o = orders.find((x) => x.id === id);
    if (!o) return null;
    if (o.invoice) return o.invoice;
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const due = new Date(now);
    due.setDate(due.getDate() + termsToDays(o.terms));
    const invoice: Invoice = {
      number: nextInvoiceNumber(),
      date,
      dueDate: due.toISOString().slice(0, 10),
      status: "draft",
    };
    persist(
      orders.map((x) =>
        x.id === id
          ? {
              ...x,
              invoice,
              status: "invoiced",
              history: [
                ...x.history,
                { status: "invoiced", at: now.toISOString(), by: x.salesperson },
              ],
            }
          : x
      )
    );
    return invoice;
  };

  const markInvoiceSent = (id: string, to: string) =>
    persist(
      orders.map((o) =>
        o.id === id && o.invoice
          ? {
              ...o,
              invoice: {
                ...o.invoice,
                status: "sent",
                sentAt: new Date().toISOString(),
                sentTo: to,
              },
            }
          : o
      )
    );

  const markPaid = (id: string, by = "Alejandro") =>
    persist(
      orders.map((o) =>
        o.id === id && o.invoice
          ? {
              ...o,
              status: "paid",
              invoice: { ...o.invoice, status: "paid", paidAt: new Date().toISOString() },
              history: [
                ...o.history,
                { status: "paid", at: new Date().toISOString(), by },
              ],
            }
          : o
      )
    );

  return {
    orders,
    hydrated,
    addOrder,
    updateOrder,
    setStatus,
    removeOrder,
    generateInvoice,
    markInvoiceSent,
    markPaid,
  };
}
