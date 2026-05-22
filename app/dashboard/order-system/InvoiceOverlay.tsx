"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { money } from "./data";
import { orderTotal, type Order } from "./useOrders";

const PACA_STATEMENT =
  "The perishable agricultural commodities listed on this invoice are sold subject to the statutory trust authorized by section 5(c) of the Perishable Agricultural Commodities Act, 1930 (7 U.S.C. 499e(c)). The seller of these commodities retains a trust claim over these commodities, all inventories of food or other products derived from these commodities, and any receivables or proceeds from the sale of these commodities until full payment is received.";

export default function InvoiceOverlay({
  order,
  onClose,
  onSend,
  onMarkPaid,
}: {
  order: Order;
  onClose: () => void;
  onSend: (to: string) => void;
  onMarkPaid: () => void;
}) {
  const inv = order.invoice!;
  const total = orderTotal(order);
  const [recipient, setRecipient] = useState(inv.sentTo ?? "");
  const [composing, setComposing] = useState(false);
  const [justSent, setJustSent] = useState(false);

  const send = () => {
    if (!recipient.trim()) return;
    onSend(recipient.trim());
    setComposing(false);
    setJustSent(true);
    setTimeout(() => setJustSent(false), 3000);
  };

  const fmt = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="os-inv-backdrop os-noprint"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="os-inv-modal"
        role="dialog"
        aria-label={`Invoice ${inv.number}`}
      >
        {/* Toolbar (not printed) */}
        <div className="os-inv-toolbar os-noprint">
          <div className="os-inv-toolbar-left">
            <span className={`os-status ${inv.status === "paid" ? "paid" : inv.status === "sent" ? "shipped" : "open"}`}>
              {inv.status === "paid" ? "Paid" : inv.status === "sent" ? "Sent" : "Draft"}
            </span>
            {inv.sentAt && (
              <span className="os-inv-sent-note">
                Sent {new Date(inv.sentAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                {inv.sentTo ? ` → ${inv.sentTo}` : ""}
              </span>
            )}
          </div>
          <div className="os-inv-toolbar-actions">
            {inv.status !== "paid" && (
              <button className="os-btn ghost sm" onClick={onMarkPaid}>
                Mark paid
              </button>
            )}
            <button className="os-btn ghost sm" onClick={() => window.print()}>
              Print / Save PDF
            </button>
            <button className="os-btn primary sm" onClick={() => setComposing(true)}>
              {inv.status === "sent" ? "Resend to client" : "Send to client"}
            </button>
            <button className="os-icon-btn" onClick={onClose} aria-label="Close">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Send composer */}
        {composing && (
          <div className="os-inv-composer os-noprint">
            <input
              type="email"
              placeholder="client-ar@email.com"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
            <button className="os-btn primary sm" onClick={send} disabled={!recipient.trim()}>
              Send invoice {inv.number}
            </button>
            <button className="os-btn ghost sm" onClick={() => setComposing(false)}>
              Cancel
            </button>
          </div>
        )}
        {justSent && (
          <div className="os-inv-toast os-noprint">
            ✓ Invoice {inv.number} sent to {inv.sentTo}
          </div>
        )}

        {/* The invoice document (printed) */}
        <div className="os-invoice-doc os-invoice-print">
          <span className="os-inv-gold-rule" aria-hidden />
          <div className="os-inv-head">
            <div className="os-inv-brand">
              <span className="os-inv-logo" aria-hidden>
                <img src="/crown-jewels-logo.png" alt="" />
              </span>
              <div>
                <div className="os-inv-mark">
                  Crown <em>Jewels</em> Produce
                </div>
                <div className="os-inv-brand-meta">
                  Year-round produce programs · Grower-direct
                  <br />
                  Fresno, California · sales@crownjewelsproduce.com
                </div>
              </div>
            </div>
            <div className="os-inv-meta">
              <div className="os-inv-title">Invoice</div>
              <div className="os-inv-num">{inv.number}</div>
              <table className="os-inv-meta-table">
                <tbody>
                  <tr><td>Invoice date</td><td>{fmt(inv.date)}</td></tr>
                  <tr><td>Due date</td><td>{fmt(inv.dueDate)}</td></tr>
                  <tr><td>Terms</td><td>{order.terms}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="os-inv-parties">
            <div>
              <div className="os-inv-label">Bill To</div>
              <div className="os-inv-party-name">{order.customerName}</div>
              {order.destination && <div className="os-inv-party-line">{order.destination}</div>}
            </div>
            <div className="os-inv-refs">
              <div><span>Order #</span><strong>{order.orderNumber}</strong></div>
              <div><span>Customer P.O.</span><strong>{order.customerPO}</strong></div>
              <div><span>Ship date</span><strong>{fmt(order.shipDate)}</strong></div>
              <div><span>Salesperson</span><strong>{order.salesperson}</strong></div>
            </div>
          </div>

          <table className="os-inv-lines">
            <thead>
              <tr>
                <th>Product</th>
                <th>Size{order.lines.some((l) => l.unit) ? " · Pack" : ""}</th>
                <th className="num">Qty</th>
                <th className="num">Unit Price</th>
                <th className="num">Amount</th>
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
                  <td className="num">{money(l.quantity * l.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="os-inv-totals">
            <div className="os-inv-total-row grand">
              <span>Total Due</span>
              <span>{money(total)}</span>
            </div>
          </div>

          {order.notes && (
            <div className="os-inv-notes">
              <span>Notes:</span> {order.notes}
            </div>
          )}

          <div className="os-inv-paca">{PACA_STATEMENT}</div>

          <div className="os-inv-foot">
            <div>
              <strong>Remit to:</strong> Crown Jewels Produce · Fresno, CA ·
              sales@crownjewelsproduce.com
            </div>
            <div className="os-inv-thanks">
              Thank you for your business — Crown Jewels Sales
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
