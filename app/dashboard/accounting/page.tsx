"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { money } from "../order-system/data";
import {
  useOrders,
  orderTotal,
  invoicePaid,
  invoiceBalance,
  daysPastDue,
  agingBucket,
  isReceivable,
  type Order,
  type OrderStatus,
  type Payment,
  type PaymentMethod,
  type AgingBucket,
} from "../order-system/useOrders";
import { TEAM, SELLERS, canonicalSeller } from "../user";
import {
  useInboundUploads,
  lotStatus,
  lotCases,
  lotCode,
  type Inbound,
} from "../inboundUploads";
import InvoiceOverlay from "../order-system/InvoiceOverlay";
import "../order-system/order-system.css";
import "./accounting.css";

const HEAD = TEAM.find((m) => m.role === "accounting")!;

const STATUS_LABEL: Record<OrderStatus, string> = {
  open: "Open",
  confirmed: "Confirmed",
  shipped: "Shipped",
  invoiced: "Invoiced",
  paid: "Paid",
  cancelled: "Cancelled",
};

const BUCKETS: { key: AgingBucket; label: string }[] = [
  { key: "current", label: "Current" },
  { key: "1-30", label: "1–30 days" },
  { key: "31-60", label: "31–60 days" },
  { key: "61-90", label: "61–90 days" },
  { key: "90+", label: "90+ days" },
];

type Totals = {
  outstanding: number;
  pastDue: number;
  current: number;
  count: number;
  byBucket: Record<AgingBucket, number>;
};

function summarize(open: Order[]): Totals {
  const outstanding = open.reduce((s, o) => s + invoiceBalance(o), 0);
  const pastDue = open
    .filter((o) => daysPastDue(o) > 0)
    .reduce((s, o) => s + invoiceBalance(o), 0);
  const byBucket: Record<AgingBucket, number> = {
    current: 0,
    "1-30": 0,
    "31-60": 0,
    "61-90": 0,
    "90+": 0,
  };
  open.forEach((o) => (byBucket[agingBucket(o)] += invoiceBalance(o)));
  return { outstanding, pastDue, current: outstanding - pastDue, count: open.length, byBucket };
}

type Tab = "receivables" | "toinvoice" | "lots";

const LOT_STATUS_LABEL: Record<ReturnType<typeof lotStatus>, string> = {
  declared: "Declared",
  received: "Received",
  settled: "Settled",
};

/** Cases on the books for a lot — received (actuals) once known, else declared. */
function lotBookedCases(l: Inbound): number {
  return l.receivedCases ?? lotCases(l);
}

/** Deduped commodity names declared on a lot. */
function lotCommodities(l: Inbound): string {
  const seen = new Set<string>();
  for (const ln of l.lines) {
    const n = (ln.n || "").trim();
    if (n) seen.add(n);
  }
  return [...seen].join(", ");
}

export default function AccountingPage() {
  const { orders, hydrated, generateInvoice, markInvoiceSent, markPaid, recordPayment } =
    useOrders();
  const { uploads, hydrated: lotsHydrated } = useInboundUploads();

  const [tab, setTab] = useState<Tab>("receivables");
  const [query, setQuery] = useState("");
  const [showPaid, setShowPaid] = useState(false);
  const [sellerFilter, setSellerFilter] = useState<string>("all");
  const [payId, setPayId] = useState<string | null>(null);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);

  const invoiced = useMemo(() => orders.filter((o) => o.invoice), [orders]);
  const open = useMemo(() => invoiced.filter(isReceivable), [invoiced]);

  // Per-seller breakdown across the whole desk.
  const breakdown = useMemo(() => {
    return SELLERS.map((s) => {
      const mine = open.filter((o) => canonicalSeller(o.salesperson) === s.name);
      return { seller: s, ...summarize(mine) };
    }).sort((a, b) => b.outstanding - a.outstanding);
  }, [open]);

  // Receivables table — seller filter, paid toggle, search.
  const rows = useMemo(() => {
    let list = invoiced;
    if (sellerFilter !== "all")
      list = list.filter((o) => canonicalSeller(o.salesperson) === sellerFilter);
    if (!showPaid) list = list.filter(isReceivable);
    const q = query.trim().toLowerCase();
    if (q)
      list = list.filter(
        (o) =>
          o.customerName.toLowerCase().includes(q) ||
          o.invoice!.number.toLowerCase().includes(q) ||
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerPO.toLowerCase().includes(q) ||
          canonicalSeller(o.salesperson).toLowerCase().includes(q)
      );
    return [...list].sort((a, b) => daysPastDue(b) - daysPastDue(a));
  }, [invoiced, sellerFilter, showPaid, query]);

  // Totals reflect the active seller filter.
  const filteredOpen = useMemo(
    () =>
      sellerFilter !== "all"
        ? open.filter((o) => canonicalSeller(o.salesperson) === sellerFilter)
        : open,
    [open, sellerFilter]
  );
  const viewTotals = useMemo(() => summarize(filteredOpen), [filteredOpen]);

  // Orders awaiting an invoice — accounting's billing queue.
  const toInvoice = useMemo(() => {
    let list = orders.filter((o) => !o.invoice && o.status !== "cancelled");
    const q = query.trim().toLowerCase();
    if (q)
      list = list.filter(
        (o) =>
          o.customerName.toLowerCase().includes(q) ||
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerPO.toLowerCase().includes(q) ||
          canonicalSeller(o.salesperson).toLowerCase().includes(q)
      );
    return [...list].sort((a, b) => a.shipDate.localeCompare(b.shipDate));
  }, [orders, query]);

  // Grower-lot pipeline — every load is on the books the moment it's declared,
  // followed through receiving to grower liquidation. Newest first; search-filtered.
  const lots = useMemo(() => {
    let list = uploads;
    const q = query.trim().toLowerCase();
    if (q)
      list = list.filter(
        (l) =>
          l.grower.toLowerCase().includes(q) ||
          l.region.toLowerCase().includes(q) ||
          lotCode(l).toLowerCase().includes(q) ||
          lotCommodities(l).toLowerCase().includes(q)
      );
    // uploads is stored newest-first; preserve that order on a copy.
    return [...list];
  }, [uploads, query]);

  const lotStats = useMemo(() => {
    let declared = 0;
    let received = 0;
    let settled = 0;
    let netSettled = 0;
    let soldValue = 0;
    for (const l of uploads) {
      const s = lotStatus(l);
      if (s === "declared") declared++;
      else if (s === "received") received++;
      else if (s === "settled") {
        settled++;
        netSettled += l.settlement?.net ?? 0;
      }
      soldValue += l.soldValue ?? 0;
    }
    return { total: uploads.length, declared, received, settled, netSettled, soldValue };
  }, [uploads]);

  const payOrder = orders.find((o) => o.id === payId) || null;
  const invoiceOrder = orders.find((o) => o.id === invoiceId) || null;

  // Generate (if needed) then open the invoice to send it.
  const startInvoice = (id: string) => {
    const o = orders.find((x) => x.id === id);
    if (o && !o.invoice) generateInvoice(id);
    setInvoiceId(id);
  };

  return (
    <div className="cj-os cj-acct">

      <main className="os-main">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="os-page-head"
        >
          <div>
            <h1>
              Accounts receivable<span className="accent">.</span>
            </h1>
            <p className="os-sub">
              The AR desk — bill shipped orders, send invoices, and track every
              receivable to collection across the whole team.
            </p>
          </div>

          <div className="acct-role-badge">
            <span className="acct-avatar accounting">{HEAD.initials}</span>
            <div>
              <strong>{HEAD.name}</strong>
              <span>{HEAD.title}</span>
            </div>
          </div>
        </motion.div>

        <div className="os-tabs">
          {(["receivables", "toinvoice", "lots"] as Tab[]).map((t) => (
            <button
              key={t}
              className={tab === t ? "active" : ""}
              onClick={() => setTab(t)}
            >
              {t === "receivables"
                ? "Receivables"
                : t === "toinvoice"
                  ? "To invoice"
                  : "Grower lots"}
              {t === "toinvoice" && toInvoice.length > 0 && (
                <span className="acct-tab-count">{toInvoice.length}</span>
              )}
              {t === "lots" && lotStats.total > 0 && (
                <span className="acct-tab-count">{lotStats.total}</span>
              )}
              {tab === t && (
                <motion.span layoutId="acct-tab-underline" className="os-tab-underline" />
              )}
            </button>
          ))}
          <div className="tool-search" style={{ marginLeft: "auto", width: 260 }}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="search"
              placeholder={
                tab === "toinvoice"
                  ? "Search orders to invoice…"
                  : tab === "lots"
                    ? "Search lots, growers, commodities…"
                    : "Search invoices, customers, PO…"
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {(tab === "lots" ? !lotsHydrated : !hydrated) ? (
          <div className="os-empty">Loading…</div>
        ) : tab === "receivables" ? (
          <>
            {/* Summary metrics */}
            <div className="os-ar-metrics">
              <Metric label="Total outstanding" value={money(viewTotals.outstanding)} accent />
              <Metric label="Past due" value={money(viewTotals.pastDue)} danger />
              <Metric label="Current (not due)" value={money(viewTotals.current)} />
              <Metric label="Open invoices" value={String(viewTotals.count)} />
            </div>

            {/* Aging bar */}
            <div className="os-card os-aging">
              <div className="os-card-head">
                <h2>Aging</h2>
                <span className="os-line-count">
                  {sellerFilter !== "all"
                    ? `${sellerFilter} · by days past due`
                    : "By days past due"}
                </span>
              </div>
              <div className="os-aging-grid">
                {BUCKETS.map((b) => {
                  const amt = viewTotals.byBucket[b.key];
                  const pct =
                    viewTotals.outstanding > 0 ? (amt / viewTotals.outstanding) * 100 : 0;
                  return (
                    <div key={b.key} className="os-aging-cell">
                      <div className="os-aging-amt">{money(amt)}</div>
                      <div className="os-aging-bar-track">
                        <div
                          className={`os-aging-bar bucket-${b.key}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="os-aging-label">{b.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Per-seller breakdown */}
            <div className="os-card acct-breakdown">
              <div className="os-card-head">
                <h2>By salesperson</h2>
                {sellerFilter !== "all" && (
                  <button className="acct-clear" onClick={() => setSellerFilter("all")}>
                    Clear filter ✕
                  </button>
                )}
              </div>
              <div className="os-table-scroll">
                <table className="os-orders-table">
                  <thead>
                    <tr>
                      <th>Salesperson</th>
                      <th className="num">Open invoices</th>
                      <th className="num">Current</th>
                      <th className="num">Past due</th>
                      <th className="num">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdown.map((r) => (
                      <tr
                        key={r.seller.id}
                        className={`clickable ${
                          sellerFilter === r.seller.name ? "acct-row-active" : ""
                        }`}
                        onClick={() =>
                          setSellerFilter(
                            sellerFilter === r.seller.name ? "all" : r.seller.name
                          )
                        }
                      >
                        <td>
                          <div className="acct-seller-cell">
                            <span className="acct-avatar">{r.seller.initials}</span>
                            <span className="os-cust">{r.seller.name}</span>
                          </div>
                        </td>
                        <td className="num">{r.count}</td>
                        <td className="num">{r.current > 0 ? money(r.current) : "—"}</td>
                        <td className="num">
                          {r.pastDue > 0 ? (
                            <span className="acct-pastdue">{money(r.pastDue)}</span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="num strong">
                          {r.outstanding > 0 ? money(r.outstanding) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Receivables table */}
            <div className="os-card" style={{ marginTop: 18 }}>
              <div className="os-card-head">
                <h2>
                  {sellerFilter !== "all"
                    ? `${sellerFilter}'s receivables`
                    : "Open receivables"}
                </h2>
                <label className="os-toggle-label">
                  <input
                    type="checkbox"
                    checked={showPaid}
                    onChange={(e) => setShowPaid(e.target.checked)}
                  />
                  Show paid
                </label>
              </div>

              {rows.length === 0 ? (
                <div className="os-empty">
                  No receivables yet. Bill an order from the “To invoice” tab and
                  it shows up here.
                </div>
              ) : (
                <div className="os-table-scroll">
                  <table className="os-orders-table">
                    <thead>
                      <tr>
                        <th>Invoice #</th>
                        <th>Customer</th>
                        <th>Salesperson</th>
                        <th>Due</th>
                        <th className="num">Amount</th>
                        <th className="num">Paid</th>
                        <th className="num">Balance</th>
                        <th>Aging</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((o) => {
                        const bal = invoiceBalance(o);
                        const dpd = daysPastDue(o);
                        const bucket = agingBucket(o);
                        const paid = invoicePaid(o);
                        return (
                          <tr
                            key={o.id}
                            className={bal > 0 ? "clickable" : ""}
                            onClick={() => bal > 0 && setPayId(o.id)}
                          >
                            <td className="mono">{o.invoice!.number}</td>
                            <td>
                              <div className="os-cust">{o.customerName}</div>
                              <div className="os-cust-ch">
                                Order {o.orderNumber} · PO {o.customerPO}
                              </div>
                            </td>
                            <td>{canonicalSeller(o.salesperson)}</td>
                            <td>{o.invoice!.dueDate}</td>
                            <td className="num">{money(orderTotal(o))}</td>
                            <td className="num">{paid > 0 ? money(paid) : "—"}</td>
                            <td className="num strong">{bal > 0 ? money(bal) : "—"}</td>
                            <td>
                              {bal <= 0 ? (
                                <span className="os-status paid">Paid</span>
                              ) : (
                                <span className={`os-aging-pill bucket-${bucket}`}>
                                  {dpd > 0 ? `${dpd}d past due` : "Current"}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : tab === "toinvoice" ? (
          /* To-invoice queue */
          <div className="os-card">
            <div className="os-card-head">
              <h2>Orders ready to bill</h2>
              <span className="os-line-count">
                {toInvoice.length} awaiting invoice
              </span>
            </div>
            {toInvoice.length === 0 ? (
              <div className="os-empty">
                Nothing to invoice. Orders entered in the Sales Desk land here for billing.
              </div>
            ) : (
              <div className="os-table-scroll">
                <table className="os-orders-table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Customer</th>
                      <th>Salesperson</th>
                      <th>Ship Date</th>
                      <th>Status</th>
                      <th className="num">Total</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {toInvoice.map((o) => (
                      <tr key={o.id}>
                        <td className="mono">{o.orderNumber}</td>
                        <td>
                          <div className="os-cust">{o.customerName}</div>
                          <div className="os-cust-ch">PO {o.customerPO}</div>
                        </td>
                        <td>{canonicalSeller(o.salesperson)}</td>
                        <td>{o.shipDate}</td>
                        <td>
                          <span className={`os-status ${o.status}`}>
                            <span className="os-status-dot" />
                            {STATUS_LABEL[o.status]}
                          </span>
                        </td>
                        <td className="num strong">{money(orderTotal(o))}</td>
                        <td className="num">
                          <button
                            className="os-btn primary sm"
                            onClick={() => startInvoice(o.id)}
                          >
                            Generate &amp; send
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* Grower-lot pipeline — registered at declaration, followed to liquidation */
          <>
            <div className="acct-lot-stats">
              <LotStat label="Lots in pipeline" value={String(lotStats.total)} />
              <LotStat label="Declared" value={String(lotStats.declared)} stage="declared" />
              <LotStat label="Received" value={String(lotStats.received)} stage="received" />
              <LotStat label="Settled" value={String(lotStats.settled)} stage="settled" />
              <LotStat
                label="Realized sales"
                value={money(lotStats.soldValue)}
                stage="received"
              />
              <LotStat
                label="Grower net settled"
                value={money(lotStats.netSettled)}
                stage="settled"
              />
            </div>

            <div className="os-card">
              <div className="os-card-head">
                <h2>Lot pipeline</h2>
                <span className="os-line-count">
                  {lots.length} {lots.length === 1 ? "lot" : "lots"}
                  {query.trim() ? " matching" : " · declared → received → settled"}
                </span>
              </div>

              {lots.length === 0 ? (
                <div className="os-empty">
                  No lots yet — they register here the moment a grower sends a load.
                </div>
              ) : (
                <div className="os-table-scroll">
                  <table className="os-orders-table">
                    <thead>
                      <tr>
                        <th>Lot</th>
                        <th>Grower</th>
                        <th>Commodities</th>
                        <th className="num">Cases</th>
                        <th className="num">Sold</th>
                        <th>Status</th>
                        <th className="num">Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lots.map((l) => {
                        const status = lotStatus(l);
                        const net = l.settlement?.net;
                        const commodities = lotCommodities(l);
                        return (
                          <tr key={l.id}>
                            <td className="mono">{lotCode(l)}</td>
                            <td>
                              <div className="acct-lot-grower">{l.grower}</div>
                              {l.region && (
                                <div className="acct-lot-region">{l.region}</div>
                              )}
                            </td>
                            <td className="acct-lot-commodities">
                              {commodities || "—"}
                            </td>
                            <td className="num">{lotBookedCases(l).toLocaleString()}</td>
                            <td className="num">
                              {l.soldValue && l.soldValue > 0 ? (
                                <span className="acct-lot-sold">
                                  {money(l.soldValue)}
                                  {l.soldCases ? (
                                    <small>{l.soldCases.toLocaleString()} cs</small>
                                  ) : null}
                                </span>
                              ) : (
                                <span className="acct-lot-net pending">—</span>
                              )}
                            </td>
                            <td>
                              <span className={`acct-lot-pill ${status}`}>
                                <span className="acct-lot-dot" />
                                {LOT_STATUS_LABEL[status]}
                              </span>
                            </td>
                            <td className="num">
                              {status === "settled" && net != null ? (
                                <span className="acct-lot-net">{money(net)}</span>
                              ) : (
                                <span className="acct-lot-net pending">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Payment modal */}
      <AnimatePresence>
        {payOrder && payOrder.invoice && (
          <PaymentModal
            key={payOrder.id}
            order={payOrder}
            onClose={() => setPayId(null)}
            onApply={(p) => {
              recordPayment(payOrder.id, p);
              setPayId(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Invoice overlay — accounting generates & sends */}
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

function LotStat({
  label,
  value,
  stage,
}: {
  label: string;
  value: string;
  stage?: "declared" | "received" | "settled";
}) {
  return (
    <div className={`acct-stat ${stage ?? ""}`}>
      <div className="acct-stat-label">{label}</div>
      <div className="acct-stat-value">{value}</div>
    </div>
  );
}

function Metric({
  label,
  value,
  accent,
  danger,
}: {
  label: string;
  value: string;
  accent?: boolean;
  danger?: boolean;
}) {
  return (
    <div className={`os-metric ${accent ? "accent" : ""} ${danger ? "danger" : ""}`}>
      <div className="os-metric-label">{label}</div>
      <div className="os-metric-value">{value}</div>
    </div>
  );
}

function PaymentModal({
  order,
  onClose,
  onApply,
}: {
  order: Order;
  onClose: () => void;
  onApply: (p: Payment) => void;
}) {
  const balance = invoiceBalance(order);
  const [amount, setAmount] = useState(balance.toFixed(2));
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState<PaymentMethod>("check");
  const [reference, setReference] = useState("");
  const [deduction, setDeduction] = useState("");
  const [deductionReason, setDeductionReason] = useState("");

  const amt = parseFloat(amount) || 0;
  const ded = parseFloat(deduction) || 0;
  const remaining = Math.max(0, Math.round((balance - amt - ded) * 100) / 100);

  const apply = () => {
    if (amt <= 0 && ded <= 0) return;
    onApply({
      id: `pay-${Date.now()}`,
      date,
      amount: amt,
      method,
      reference: reference.trim() || undefined,
      deduction: ded > 0 ? ded : undefined,
      deductionReason: ded > 0 ? deductionReason.trim() || "Deduction" : undefined,
    });
  };

  return (
    <motion.div
      className="os-inv-backdrop"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="os-pay-modal"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        role="dialog"
        aria-label={`Apply payment to ${order.invoice!.number}`}
      >
        <header className="os-pay-head">
          <div>
            <span className="os-pay-num">{order.invoice!.number}</span>
            <div className="os-pay-cust">{order.customerName}</div>
          </div>
          <button className="os-icon-btn" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="os-pay-summary">
          <div><span>Invoice total</span><strong>{money(orderTotal(order))}</strong></div>
          <div><span>Already applied</span><strong>{money(invoicePaid(order))}</strong></div>
          <div className="bal"><span>Balance due</span><strong>{money(balance)}</strong></div>
        </div>

        <div className="os-pay-form">
          <div className="os-field-grid os-pay-grid">
            <label className="os-field">
              <span className="os-field-label">Amount received</span>
              <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </label>
            <label className="os-field">
              <span className="os-field-label">Payment date</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label className="os-field">
              <span className="os-field-label">Method</span>
              <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
                <option value="check">Check</option>
                <option value="ach">ACH</option>
                <option value="wire">Wire</option>
                <option value="card">Card</option>
                <option value="cash">Cash</option>
              </select>
            </label>
            <label className="os-field">
              <span className="os-field-label">Reference</span>
              <input type="text" placeholder="Check # / trace" value={reference} onChange={(e) => setReference(e.target.value)} />
            </label>
            <label className="os-field">
              <span className="os-field-label">Deduction / short-pay</span>
              <input type="number" step="0.01" placeholder="0.00" value={deduction} onChange={(e) => setDeduction(e.target.value)} />
            </label>
            <label className="os-field">
              <span className="os-field-label">Deduction reason</span>
              <input type="text" placeholder="Chargeback, shrink, quality…" value={deductionReason} onChange={(e) => setDeductionReason(e.target.value)} />
            </label>
          </div>

          <div className="os-pay-remaining">
            Remaining after this entry: <strong>{money(remaining)}</strong>
            {remaining <= 0 && <span className="os-pay-clear"> · invoice cleared</span>}
          </div>
        </div>

        <footer className="os-pay-foot">
          <button className="os-btn ghost" onClick={onClose}>Cancel</button>
          <button className="os-btn primary" onClick={apply}>Apply payment</button>
        </footer>
      </motion.div>
    </motion.div>
  );
}
