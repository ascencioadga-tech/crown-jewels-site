"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { money } from "../data";
import {
  useOrders,
  orderTotal,
  invoicePaid,
  invoiceBalance,
  daysPastDue,
  agingBucket,
  isReceivable,
  type Order,
  type Payment,
  type PaymentMethod,
  type AgingBucket,
} from "../useOrders";
import "../order-system.css";

const BUCKETS: { key: AgingBucket; label: string }[] = [
  { key: "current", label: "Current" },
  { key: "1-30", label: "1–30 days" },
  { key: "31-60", label: "31–60 days" },
  { key: "61-90", label: "61–90 days" },
  { key: "90+", label: "90+ days" },
];

export default function ReceivablesPage() {
  const { orders, hydrated, recordPayment } = useOrders();
  const [showPaid, setShowPaid] = useState(false);
  const [payId, setPayId] = useState<string | null>(null);

  const dateText = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Receivables = invoiced orders. Open ones by default.
  const invoiced = useMemo(
    () => orders.filter((o) => o.invoice),
    [orders]
  );
  const open = useMemo(() => invoiced.filter(isReceivable), [invoiced]);
  const rows = useMemo(() => {
    const list = showPaid ? invoiced : open;
    // Most overdue first
    return [...list].sort((a, b) => daysPastDue(b) - daysPastDue(a));
  }, [invoiced, open, showPaid]);

  const totals = useMemo(() => {
    const outstanding = open.reduce((s, o) => s + invoiceBalance(o), 0);
    const pastDue = open
      .filter((o) => daysPastDue(o) > 0)
      .reduce((s, o) => s + invoiceBalance(o), 0);
    const current = outstanding - pastDue;
    const byBucket: Record<AgingBucket, number> = {
      current: 0,
      "1-30": 0,
      "31-60": 0,
      "61-90": 0,
      "90+": 0,
    };
    open.forEach((o) => (byBucket[agingBucket(o)] += invoiceBalance(o)));
    return { outstanding, pastDue, current, count: open.length, byBucket };
  }, [open]);

  const payOrder = orders.find((o) => o.id === payId) || null;

  return (
    <div className="cj-os">
      <header className="os-topbar">
        <div className="os-topbar-inner">
          <Link href="/dashboard" className="os-brand">
            <span className="os-brand-logo">
              <img src="/crown-jewels-logo.png" alt="Crown Jewels Produce" />
            </span>
            <span className="os-brand-mark">
              Crown <em>Jewels</em>
            </span>
            <span className="os-brand-tag">Order System</span>
          </Link>
          <nav className="os-nav">
            <Link href="/dashboard/order-system">Orders</Link>
            <Link href="/dashboard/order-system/receivables" className="active">
              Receivables
            </Link>
          </nav>
          <div className="os-topbar-date">
            <span className="dot" />
            <span>{dateText}</span>
          </div>
          <div className="os-user">
            <div className="os-avatar">CJ</div>
            <Link href="/" className="os-logout">
              Sign out
            </Link>
          </div>
        </div>
      </header>

      <main className="os-main">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="os-page-head"
        >
          <div>
            <h1>
              Receivables<span className="accent">.</span>
            </h1>
            <p className="os-sub">
              Every sent invoice becomes an open receivable here — who owes
              what, how overdue, and apply payments as they come in.
            </p>
          </div>
        </motion.div>

        {/* Summary metrics */}
        <div className="os-ar-metrics">
          <Metric label="Total outstanding" value={money(totals.outstanding)} accent />
          <Metric label="Past due" value={money(totals.pastDue)} danger />
          <Metric label="Current (not due)" value={money(totals.current)} />
          <Metric label="Open invoices" value={String(totals.count)} />
        </div>

        {/* Aging bar */}
        <div className="os-card os-aging">
          <div className="os-card-head">
            <h2>Aging</h2>
            <span className="os-line-count">By days past due</span>
          </div>
          <div className="os-aging-grid">
            {BUCKETS.map((b) => {
              const amt = totals.byBucket[b.key];
              const pct =
                totals.outstanding > 0 ? (amt / totals.outstanding) * 100 : 0;
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

        {/* Receivables table */}
        <div className="os-card" style={{ marginTop: 18 }}>
          <div className="os-card-head">
            <h2>Open receivables</h2>
            <label className="os-toggle-label">
              <input
                type="checkbox"
                checked={showPaid}
                onChange={(e) => setShowPaid(e.target.checked)}
              />
              Show paid
            </label>
          </div>

          {!hydrated ? (
            <div className="os-empty">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="os-empty">
              No open receivables. Generate and send invoices from the Orders
              tab and they&apos;ll appear here.
            </div>
          ) : (
            <div className="os-table-scroll">
              <table className="os-orders-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Customer</th>
                    <th>Invoiced</th>
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
                        className="clickable"
                        onClick={() => bal > 0 && setPayId(o.id)}
                      >
                        <td className="mono">{o.invoice!.number}</td>
                        <td>
                          <div className="os-cust">{o.customerName}</div>
                          <div className="os-cust-ch">
                            Order {o.orderNumber} · PO {o.customerPO}
                          </div>
                        </td>
                        <td>{o.invoice!.date}</td>
                        <td>{o.invoice!.dueDate}</td>
                        <td className="num">{money(orderTotal(o))}</td>
                        <td className="num">{paid > 0 ? money(paid) : "—"}</td>
                        <td className="num strong">
                          {bal > 0 ? money(bal) : "—"}
                        </td>
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
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
            <label className="os-field">
              <span className="os-field-label">Payment date</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <label className="os-field">
              <span className="os-field-label">Method</span>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              >
                <option value="check">Check</option>
                <option value="ach">ACH</option>
                <option value="wire">Wire</option>
                <option value="card">Card</option>
                <option value="cash">Cash</option>
              </select>
            </label>
            <label className="os-field">
              <span className="os-field-label">Reference</span>
              <input
                type="text"
                placeholder="Check # / trace"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </label>
            <label className="os-field">
              <span className="os-field-label">Deduction / short-pay</span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={deduction}
                onChange={(e) => setDeduction(e.target.value)}
              />
            </label>
            <label className="os-field">
              <span className="os-field-label">Deduction reason</span>
              <input
                type="text"
                placeholder="Chargeback, shrink, quality…"
                value={deductionReason}
                onChange={(e) => setDeductionReason(e.target.value)}
              />
            </label>
          </div>

          <div className="os-pay-remaining">
            Remaining after this entry:{" "}
            <strong>{money(remaining)}</strong>
            {remaining <= 0 && <span className="os-pay-clear"> · invoice cleared</span>}
          </div>
        </div>

        <footer className="os-pay-foot">
          <button className="os-btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="os-btn primary" onClick={apply}>
            Apply payment
          </button>
        </footer>
      </motion.div>
    </motion.div>
  );
}
