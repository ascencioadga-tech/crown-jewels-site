"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { money, commodities } from "./data";
import {
  useOrders,
  orderTotal,
  type Order,
  type OrderStatus,
} from "./useOrders";
import InvoiceOverlay from "./InvoiceOverlay";
import Topbar from "../Topbar";
import "./order-system.css";

const ACCENT_BY_ID: Record<string, string> = Object.fromEntries(
  commodities.map((c) => [c.id, c.accent])
);

// Distinct commodity accent colors in an order (for the row "what's in it" dots)
function orderDots(o: Order): string[] {
  const seen: string[] = [];
  for (const l of o.lines) {
    const a = ACCENT_BY_ID[l.commodityId] || "#7a1f2b";
    if (!seen.includes(a)) seen.push(a);
  }
  return seen;
}

const EASE = [0.22, 1, 0.36, 1] as const;

const STATUS_LABEL: Record<OrderStatus, string> = {
  open: "Open",
  confirmed: "Confirmed",
  shipped: "Shipped",
  invoiced: "Invoiced",
  paid: "Paid",
  cancelled: "Cancelled",
};

const STATUS_FLOW: OrderStatus[] = [
  "open",
  "confirmed",
  "shipped",
  "invoiced",
  "paid",
];

type Tab = "orders" | "report";

export default function OrderSystemPage() {
  const { orders, hydrated, setStatus, generateInvoice, markInvoiceSent, markPaid } =
    useOrders();
  const [tab, setTab] = useState<Tab>("orders");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const openInvoice = (id: string) => {
    const o = orders.find((x) => x.id === id);
    if (o && !o.invoice) generateInvoice(id);
    setInvoiceId(id);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPO.toLowerCase().includes(q) ||
        o.destination.toLowerCase().includes(q)
    );
  }, [orders, query]);

  const selected = orders.find((o) => o.id === openId) || null;
  const invoiceOrder = orders.find((o) => o.id === invoiceId) || null;

  // Rob's report = one row per product line, across ALL salesmen
  const reportRows = useMemo(() => {
    const rows: {
      salesman: string;
      client: string;
      destination: string;
      orderDate: string;
      shipDate: string;
      po: string;
      quantity: number;
      product: string;
      price: number;
    }[] = [];
    filtered.forEach((o) => {
      o.lines.forEach((l) => {
        rows.push({
          salesman: o.salesperson,
          client: o.customerName,
          destination: o.destination,
          orderDate: o.orderDate,
          shipDate: o.shipDate,
          po: o.customerPO,
          quantity: l.quantity,
          product: `${l.productName} ${l.size}`,
          price: l.unitPrice,
        });
      });
    });
    return rows;
  }, [filtered]);

  const reportTSV = useMemo(() => {
    const header = [
      "Salesman",
      "Client",
      "Destination",
      "Order Date",
      "Ship Date",
      "Customer P.O.",
      "Quantity",
      "Product",
      "Price",
    ].join("\t");
    const lines = reportRows.map((r) =>
      [
        r.salesman,
        r.client,
        r.destination,
        r.orderDate,
        r.shipDate,
        r.po,
        r.quantity,
        r.product,
        r.price.toFixed(2),
      ].join("\t")
    );
    return [header, ...lines].join("\n");
  }, [reportRows]);

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(reportTSV);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const downloadCSV = () => {
    const csv = reportTSV
      .split("\n")
      .map((row) =>
        row
          .split("\t")
          .map((cell) => `"${cell.replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `crown-jewels-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="cj-os">
      <Topbar
        tool="Order System"
        nav={[
          { label: "Orders", href: "/dashboard/order-system", active: true },
          { label: "Receivables", href: "/dashboard/order-system/receivables" },
        ]}
        search={{
          value: query,
          onChange: setQuery,
          placeholder: "Search orders, PO, customer…",
        }}
      />

      <main className="os-main">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="os-page-head"
        >
          <div>
            <h1>
              Orders<span className="accent">.</span>
            </h1>
          </div>
          <Link href="/dashboard/order-system/new" className="os-btn primary">
            + New order
          </Link>
        </motion.div>

        <div className="os-tabs">
          {(["orders", "report"] as Tab[]).map((t) => (
            <button
              key={t}
              className={tab === t ? "active" : ""}
              onClick={() => setTab(t)}
            >
              {t === "orders" ? "Orders" : "Rob's Report"}
              {tab === t && (
                <motion.span layoutId="os-tab-underline" className="os-tab-underline" />
              )}
            </button>
          ))}
        </div>

        {!hydrated ? (
          <div className="os-empty">Loading…</div>
        ) : tab === "orders" ? (
          <OrdersTable orders={filtered} onOpen={(id) => setOpenId(id)} />
        ) : (
          <div className="os-card os-report">
            <div className="os-card-head">
              <h2>Sales recap — for Rob</h2>
              <div className="os-report-actions">
                <button className="os-btn ghost sm" onClick={copyReport}>
                  {copied ? "Copied ✓" : "Copy for Google Sheet"}
                </button>
                <button className="os-btn ghost sm" onClick={downloadCSV}>
                  Export CSV
                </button>
              </div>
            </div>
            <div className="os-report-scroll">
              <table className="os-report-table">
                <thead>
                  <tr>
                    <th>Salesman</th>
                    <th>Client</th>
                    <th>Destination</th>
                    <th>Order Date</th>
                    <th>Ship Date</th>
                    <th>Customer P.O.</th>
                    <th className="num">Quantity</th>
                    <th>Product</th>
                    <th className="num">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {reportRows.map((r, i) => (
                    <tr key={i}>
                      <td>{r.salesman}</td>
                      <td>{r.client}</td>
                      <td>{r.destination}</td>
                      <td>{r.orderDate}</td>
                      <td>{r.shipDate}</td>
                      <td>{r.po}</td>
                      <td className="num">{r.quantity.toLocaleString()}</td>
                      <td>{r.product}</td>
                      <td className="num">{money(r.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="os-report-note">
              Rob&apos;s live sheet — aggregated across <strong>all
              salesmen</strong>, one row per product line. &quot;Copy for
              Google Sheet&quot; pastes straight into his existing tab.
              (Auto-sync to his Sheet wires up in the backend phase.)
            </p>
          </div>
        )}
      </main>

      {/* Detail drawer */}
      <AnimatePresence>
        {selected && (
          <OrderDrawer
            key={selected.id}
            order={selected}
            onClose={() => setOpenId(null)}
            onAdvance={(s) => setStatus(selected.id, s)}
            onInvoice={() => openInvoice(selected.id)}
          />
        )}
      </AnimatePresence>

      {/* Invoice overlay */}
      <AnimatePresence>
        {invoiceOrder && invoiceOrder.invoice && (
          <InvoiceOverlay
            key={invoiceOrder.id}
            order={invoiceOrder}
            onClose={() => setInvoiceId(null)}
            onSend={(to) => markInvoiceSent(invoiceOrder.id, to)}
            onMarkPaid={() => markPaid(invoiceOrder.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function OrdersTable({
  orders,
  onOpen,
}: {
  orders: Order[];
  onOpen: (id: string) => void;
}) {
  if (orders.length === 0)
    return <div className="os-empty">No orders yet. Create your first one.</div>;

  return (
    <div className="os-card">
      <div className="os-table-scroll">
        <table className="os-orders-table enriched">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Destination</th>
              <th>Ship Date</th>
              <th>P.O.</th>
              <th>Products</th>
              <th className="num">Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o, i) => (
              <motion.tr
                key={o.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.4, ease: EASE }}
                onClick={() => onOpen(o.id)}
                className={`clickable status-row-${o.status}`}
              >
                <td className="mono">{o.orderNumber}</td>
                <td>
                  <div className="os-cust">{o.customerName}</div>
                  {o.channel && <div className="os-cust-ch">{o.channel}</div>}
                </td>
                <td>{o.destination || <span className="os-dim">—</span>}</td>
                <td>{o.shipDate}</td>
                <td>{o.customerPO}</td>
                <td>
                  <Dots accents={orderDots(o)} count={o.lines.length} />
                </td>
                <td className="num strong">{money(orderTotal(o))}</td>
                <td>
                  <StatusPill status={o.status} />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Dots({ accents, count }: { accents: string[]; count: number }) {
  const show = accents.slice(0, 4);
  return (
    <span className="os-dots">
      <span className="os-dots-row">
        {show.map((a, i) => (
          <span key={i} className="os-dot" style={{ background: a }} />
        ))}
      </span>
      <span className="os-dots-count">
        {count} line{count === 1 ? "" : "s"}
      </span>
    </span>
  );
}

function StatusPill({ status }: { status: OrderStatus }) {
  return (
    <span className={`os-status ${status}`}>
      <span className="os-status-dot" />
      {STATUS_LABEL[status]}
    </span>
  );
}

function OrderDrawer({
  order,
  onClose,
  onAdvance,
  onInvoice,
}: {
  order: Order;
  onClose: () => void;
  onAdvance: (s: OrderStatus) => void;
  onInvoice: () => void;
}) {
  const total = orderTotal(order);
  const idx = STATUS_FLOW.indexOf(order.status);
  const next = idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="os-backdrop"
        onClick={onClose}
      />
      <motion.aside
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 40, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="os-drawer"
        role="dialog"
        aria-label={`Order ${order.orderNumber}`}
      >
        <header className="os-drawer-head">
          <div>
            <span className="os-drawer-num">{order.orderNumber}</span>
            <StatusPill status={order.status} />
          </div>
          <button className="os-icon-btn" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="os-drawer-body">
          <h3 className="os-drawer-cust">{order.customerName}</h3>
          <div className="os-drawer-meta">
            <Meta label="Destination" value={order.destination} />
            <Meta label="Customer P.O." value={order.customerPO} />
            <Meta label="Order date" value={order.orderDate} />
            <Meta label="Ship date" value={order.shipDate} />
            <Meta label="Salesperson" value={order.salesperson} />
            <Meta label="Terms" value={order.terms} />
          </div>

          <div className="os-drawer-section">
            <div className="os-drawer-section-head">Products</div>
            <table className="os-drawer-lines">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Size · Pack</th>
                  <th className="num">Qty</th>
                  <th className="num">Unit</th>
                  <th className="num">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.lines.map((l) => (
                  <tr key={l.id}>
                    <td>{l.productName}</td>
                    <td className="dim">
                      {l.size}
                      {l.unit ? ` · ${l.unit}` : ""}
                    </td>
                    <td className="num">{l.quantity.toLocaleString()}</td>
                    <td className="num">{money(l.unitPrice)}</td>
                    <td className="num strong">
                      {money(l.quantity * l.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4}>Order total</td>
                  <td className="num strong">{money(total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {order.notes && (
            <div className="os-drawer-section">
              <div className="os-drawer-section-head">Notes</div>
              <p className="os-drawer-notes">{order.notes}</p>
            </div>
          )}

          <div className="os-drawer-section">
            <div className="os-drawer-section-head">Status history</div>
            <ul className="os-timeline">
              {order.history.map((h, i) => (
                <li key={i}>
                  <span className="os-timeline-dot" />
                  <span className="os-timeline-status">
                    {STATUS_LABEL[h.status]}
                  </span>
                  <span className="os-timeline-meta">
                    {new Date(h.at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}{" "}
                    · {h.by}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <footer className="os-drawer-foot">
          {next && (
            <button className="os-btn ghost" onClick={() => onAdvance(next)}>
              Mark {STATUS_LABEL[next]}
            </button>
          )}
          <button className="os-btn primary" onClick={onInvoice}>
            {order.invoice ? "View invoice" : "Generate invoice"}
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </footer>
      </motion.aside>
    </>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="os-meta-item">
      <span className="os-meta-label">{label}</span>
      <span className="os-meta-value">{value}</span>
    </div>
  );
}
