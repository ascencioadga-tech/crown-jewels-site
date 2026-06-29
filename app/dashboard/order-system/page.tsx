"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { money, commodities } from "./data";
import {
  useOrders,
  orderTotal,
  invoicePaid,
  type Order,
  type OrderStatus,
} from "./useOrders";
import { CURRENT_USER, SELLERS, canonicalSeller } from "../user";
import "./order-system.css";

const ACCENT_BY_ID: Record<string, string> = Object.fromEntries(
  commodities.map((c) => [c.id, c.accent])
);
const COMMODITY_BY_ID: Record<string, (typeof commodities)[number]> =
  Object.fromEntries(commodities.map((c) => [c.id, c]));

// Distinct commodity accent colors in an order (for the row "what's in it" dots)
function orderDots(o: Order): string[] {
  const seen: string[] = [];
  for (const l of o.lines) {
    const a = ACCENT_BY_ID[l.commodityId] || "#7a1f2b";
    if (!seen.includes(a)) seen.push(a);
  }
  return seen;
}

/** Whole-dollar money for KPIs / bars (no cents). */
function money0(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
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

// Salesmen advance an order up to "shipped". Invoicing & payment live in Accounting.
const SALES_FLOW: OrderStatus[] = ["open", "confirmed", "shipped"];

const FOOT_NOTE: Partial<Record<OrderStatus, string>> = {
  shipped: "Shipped — ready for Accounting to invoice.",
  invoiced: "Invoiced — tracked in Accounting.",
  paid: "Paid in full.",
  cancelled: "Cancelled.",
};

const firstName = (full: string) => full.split(" ")[0];

const MONTH_LABEL = new Date().toLocaleString("en-US", {
  month: "long",
  year: "numeric",
});

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function OrderSystemPage() {
  const { orders, hydrated, setStatus } = useOrders();
  const [query, setQuery] = useState("");
  const [repFilter, setRepFilter] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  // ---- KPIs (computed live from orders) ----
  const kpis = useMemo(() => {
    const live = orders.filter((o) => o.status !== "cancelled");
    const booked = live.reduce((s, o) => s + orderTotal(o), 0);
    const pipeline = orders
      .filter((o) => o.status === "open" || o.status === "confirmed")
      .reduce((s, o) => s + orderTotal(o), 0);
    const pipelineCount = orders.filter(
      (o) => o.status === "open" || o.status === "confirmed"
    ).length;
    const collected = orders.reduce((s, o) => s + invoicePaid(o), 0);
    const avg = live.length ? booked / live.length : 0;
    const cases = orders.reduce(
      (s, o) => s + o.lines.reduce((u, l) => u + l.quantity, 0),
      0
    );
    return {
      booked,
      pipeline,
      pipelineCount,
      collected,
      avg,
      cases,
      count: live.length,
    };
  }, [orders]);

  // ---- Sales by rep (leaderboard) ----
  const reps = useMemo(() => {
    const by: Record<string, { total: number; count: number }> = {};
    // Seed every seller so the full team always shows, even before any orders.
    SELLERS.forEach((s) => (by[s.name] = { total: 0, count: 0 }));
    for (const o of orders) {
      if (o.status === "cancelled") continue;
      const r = canonicalSeller(o.salesperson);
      by[r] = by[r] || { total: 0, count: 0 };
      by[r].total += orderTotal(o);
      by[r].count += 1;
    }
    return Object.entries(by)
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.total - a.total);
  }, [orders]);
  const maxRep = reps.length ? reps[0].total : 0;

  // ---- By commodity ----
  const byCommodity = useMemo(() => {
    const by: Record<string, number> = {};
    for (const o of orders) {
      if (o.status === "cancelled") continue;
      for (const l of o.lines) {
        by[l.commodityId] = (by[l.commodityId] || 0) + l.quantity * l.unitPrice;
      }
    }
    const rows = Object.entries(by)
      .map(([id, total]) => {
        const c = COMMODITY_BY_ID[id];
        return {
          id,
          label: c?.group || c?.name || id,
          accent: c?.accent || "#7a1f2b",
          total,
        };
      })
      .sort((a, b) => b.total - a.total);
    return { rows, max: rows.length ? rows[0].total : 0 };
  }, [orders]);

  // ---- By channel ----
  const byChannel = useMemo(() => {
    const by: Record<string, number> = {};
    for (const o of orders) {
      if (o.status === "cancelled") continue;
      const ch = o.channel || "—";
      by[ch] = (by[ch] || 0) + orderTotal(o);
    }
    const rows = Object.entries(by)
      .map(([label, total]) => ({ label, total }))
      .sort((a, b) => b.total - a.total);
    return { rows, max: rows.length ? rows[0].total : 0 };
  }, [orders]);

  // ---- Orders table (rep filter + search) ----
  const tableOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (
        repFilter &&
        canonicalSeller(o.salesperson) !== repFilter
      )
        return false;
      if (!q) return true;
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPO.toLowerCase().includes(q) ||
        o.destination.toLowerCase().includes(q) ||
        o.salesperson.toLowerCase().includes(q)
      );
    });
  }, [orders, repFilter, query]);

  const tableTotal = tableOrders.reduce((s, o) => s + orderTotal(o), 0);
  const tableTitle = repFilter ? `${firstName(repFilter)}'s orders` : "All orders";

  const selected = orders.find((o) => o.id === openId) || null;

  return (
    <div className="cj-os">
      <main className="os-main">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="os-page-head"
        >
          <div>
            <div className="os-eyebrow">
              <span className="os-eyebrow-rule" />
              Sales desk · {MONTH_LABEL}
            </div>
            <h1>
              {greeting()}, {firstName(CURRENT_USER.name)}
              <span className="accent">.</span>
            </h1>
            <p className="os-sub">
              Your book at a glance — pipeline, who&apos;s carrying it, and
              what&apos;s moving. Open any order for full detail.
            </p>
          </div>
          <div className="os-head-actions">
            <Link href="/dashboard/order-system/new" className="os-btn primary">
              + New order
            </Link>
          </div>
        </motion.div>

        {!hydrated ? (
          <div className="os-empty">Loading…</div>
        ) : (
          <>
            {/* KPI strip */}
            <div className="os-kpi-strip">
              <div className="os-metric accent os-kpi">
                <div className="os-metric-label">Booked sales</div>
                <div className="os-metric-value">{money0(kpis.booked)}</div>
                <div className="os-kpi-cap">{kpis.count} orders this period</div>
              </div>
              <div className="os-metric os-kpi">
                <div className="os-metric-label">Open pipeline</div>
                <div className="os-metric-value">{money0(kpis.pipeline)}</div>
                <div className="os-kpi-cap">
                  {kpis.pipelineCount} not yet shipped
                </div>
              </div>
              <div className="os-metric good os-kpi">
                <div className="os-metric-label">Collected</div>
                <div className="os-metric-value">{money0(kpis.collected)}</div>
                <div className="os-kpi-cap">paid to date</div>
              </div>
              <div className="os-metric os-kpi">
                <div className="os-metric-label">Avg order</div>
                <div className="os-metric-value">{money0(kpis.avg)}</div>
                <div className="os-kpi-cap">per order</div>
              </div>
              <div className="os-metric os-kpi">
                <div className="os-metric-label">Cases sold</div>
                <div className="os-metric-value">
                  {kpis.cases.toLocaleString()}
                </div>
                <div className="os-kpi-cap">across all reps</div>
              </div>
            </div>

            {/* Two-column: leaderboard + breakdowns */}
            <div className="os-two-col">
              <div className="os-card">
                <div className="os-card-head">
                  <h2>Sales by rep</h2>
                  <span className="os-line-count">
                    click a rep to filter orders
                  </span>
                </div>
                <div className="os-lb">
                  {reps.map((r, i) => {
                    const me = firstName(r.name) === firstName(CURRENT_USER.name);
                    const active = repFilter === r.name;
                    return (
                      <button
                        key={r.name}
                        className={`os-lb-row${i === 0 ? " top" : ""}${
                          active ? " active" : ""
                        }`}
                        onClick={() =>
                          setRepFilter(active ? null : r.name)
                        }
                      >
                        <span className="os-lb-rank">{i + 1}</span>
                        <span className="os-lb-av">
                          {r.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                        </span>
                        <span className="os-lb-name">
                          {r.name}
                          {me && <span className="os-lb-you"> · you</span>}
                        </span>
                        <span className="os-lb-bar">
                          <span
                            style={{
                              width: `${
                                maxRep > 0
                                  ? Math.max(6, (r.total / maxRep) * 100)
                                  : 0
                              }%`,
                            }}
                          />
                        </span>
                        <span className="os-lb-meta">
                          {r.count} order{r.count === 1 ? "" : "s"}
                        </span>
                        <span className="os-lb-total">{money0(r.total)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="os-card os-breakdown">
                <div className="os-card-head">
                  <h2>By commodity</h2>
                </div>
                <div className="os-bars">
                  {byCommodity.rows.map((r) => (
                    <BarRow
                      key={r.id}
                      label={r.label}
                      value={r.total}
                      max={byCommodity.max}
                      color="#7a1f2b"
                    />
                  ))}
                </div>
                <div className="os-card-head os-card-head-mid">
                  <h2>By channel</h2>
                </div>
                <div className="os-bars">
                  {byChannel.rows.map((r) => (
                    <BarRow
                      key={r.label}
                      label={r.label}
                      value={r.total}
                      max={byChannel.max}
                      color="#7a1f2b"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Orders table */}
            <div className="os-card">
              <div className="os-card-head">
                <div className="os-card-head-titles">
                  <h2>{tableTitle}</h2>
                  <span className="os-line-count">
                    {tableOrders.length} order
                    {tableOrders.length === 1 ? "" : "s"} ·{" "}
                    {money0(tableTotal)}
                  </span>
                </div>
                <div className="tool-search">
                  <svg
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    />
                  </svg>
                  <input
                    type="search"
                    placeholder="Search orders, PO, customer…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </div>

              {repFilter && (
                <div className="os-filter-note">
                  Filtered to <b>{firstName(repFilter)}</b> ·{" "}
                  <button className="os-filter-clear" onClick={() => setRepFilter(null)}>
                    clear ✕
                  </button>
                </div>
              )}

              {tableOrders.length === 0 ? (
                <div className="os-empty os-empty-inline">
                  {orders.length === 0
                    ? "No orders yet. Create your first one."
                    : "No orders match."}
                </div>
              ) : (
                <div className="os-table-scroll">
                  <table className="os-orders-table enriched">
                    <thead>
                      <tr>
                        <th>Order #</th>
                        <th>Customer</th>
                        <th>Rep</th>
                        <th>Ship date</th>
                        <th>Products</th>
                        <th className="num">Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableOrders.map((o, i) => (
                        <motion.tr
                          key={o.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            delay: Math.min(i * 0.03, 0.3),
                            duration: 0.4,
                            ease: EASE,
                          }}
                          onClick={() => setOpenId(o.id)}
                          className={`clickable status-row-${o.status}`}
                        >
                          <td className="mono">{o.orderNumber}</td>
                          <td>
                            <div className="os-cust">{o.customerName}</div>
                            {o.channel && (
                              <div className="os-cust-ch">{o.channel}</div>
                            )}
                          </td>
                          <td>{firstName(o.salesperson)}</td>
                          <td>{o.shipDate}</td>
                          <td>
                            <Dots
                              accents={orderDots(o)}
                              count={o.lines.length}
                            />
                          </td>
                          <td className="num strong">
                            {money(orderTotal(o))}
                          </td>
                          <td>
                            <StatusPill status={o.status} />
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
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
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function BarRow({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const w = max > 0 ? Math.max(3, (value / max) * 100) : 0;
  return (
    <div className="os-bar-row">
      <span className="os-bar-label">{label}</span>
      <span className="os-bar-track">
        <motion.span
          className="os-bar-fill"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${w}%` }}
          transition={{ duration: 0.6, ease: EASE }}
        />
      </span>
      <span className="os-bar-value">{money0(value)}</span>
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
}: {
  order: Order;
  onClose: () => void;
  onAdvance: (s: OrderStatus) => void;
}) {
  const total = orderTotal(order);
  const idx = SALES_FLOW.indexOf(order.status);
  const next = idx >= 0 && idx < SALES_FLOW.length - 1 ? SALES_FLOW[idx + 1] : null;

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
          {next ? (
            <button className="os-btn primary" onClick={() => onAdvance(next)}>
              Mark {STATUS_LABEL[next]}
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          ) : (
            <span className="os-drawer-foot-note">
              {FOOT_NOTE[order.status] ?? ""}
            </span>
          )}
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
