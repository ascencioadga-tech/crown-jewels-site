"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { SALESPEOPLE, TERMS_OPTIONS, commodities, money } from "../data";
import {
  nextOrderNumber,
  useOrders,
  type OrderLine,
  type Order,
} from "../useOrders";
import "../order-system.css";

type DraftLine = {
  id: string;
  commodityId: string;
  sizeIndex: number;
  quantity: string;
  unitPrice: string;
};

let lineSeq = 0;
const newLine = (): DraftLine => ({
  id: `l${Date.now()}-${lineSeq++}`,
  commodityId: "",
  sizeIndex: 0,
  quantity: "",
  unitPrice: "",
});

const today = () => new Date().toISOString().slice(0, 10);

export default function NewOrderPage() {
  const router = useRouter();
  const { addOrder } = useOrders();

  const [customerName, setCustomerName] = useState("");
  const [destination, setDestination] = useState("");
  const [customerPO, setCustomerPO] = useState("");
  const [orderDate, setOrderDate] = useState(today());
  const [shipDate, setShipDate] = useState(today());
  const [salesperson, setSalesperson] = useState<string>(SALESPEOPLE[0]);
  const [terms, setTerms] = useState<string>(TERMS_OPTIONS[2]);
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([newLine()]);
  const [error, setError] = useState("");

  const setLine = (id: string, patch: Partial<DraftLine>) =>
    setLines((cur) => cur.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const addLine = () => setLines((cur) => [...cur, newLine()]);
  const removeLine = (id: string) =>
    setLines((cur) => (cur.length > 1 ? cur.filter((l) => l.id !== id) : cur));

  const lineTotal = (l: DraftLine) =>
    (parseFloat(l.quantity) || 0) * (parseFloat(l.unitPrice) || 0);

  const orderTotal = useMemo(
    () => lines.reduce((s, l) => s + lineTotal(l), 0),
    [lines]
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!customerName.trim()) return setError("Enter the customer.");
    if (!customerPO.trim()) return setError("Enter the customer P.O.");
    const validLines = lines.filter(
      (l) => l.commodityId && parseFloat(l.quantity) > 0
    );
    if (validLines.length === 0)
      return setError("Add at least one product line with a quantity.");

    const orderLines: OrderLine[] = validLines.map((l) => {
      const com = commodities.find((x) => x.id === l.commodityId)!;
      const size = com.sizes[l.sizeIndex] ?? com.sizes[0];
      return {
        id: l.id,
        commodityId: com.id,
        productName: com.name,
        size: size.size,
        unit: size.unit,
        pallet: size.pallet,
        quantity: parseFloat(l.quantity) || 0,
        unitPrice: parseFloat(l.unitPrice) || 0,
      };
    });

    const order: Order = {
      id: `o${Date.now()}`,
      orderNumber: nextOrderNumber(),
      customerId:
        customerName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") ||
        `cust-${Date.now()}`,
      customerName: customerName.trim(),
      channel: "",
      destination: destination.trim(),
      customerPO: customerPO.trim(),
      orderDate,
      shipDate,
      salesperson,
      terms,
      status: "open",
      lines: orderLines,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
      history: [
        { status: "open", at: new Date().toISOString(), by: salesperson },
      ],
    };

    addOrder(order);
    router.push("/dashboard/order-system");
  };

  return (
    <div className="cj-os">
      <Topbar />

      <main className="os-main os-narrow">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="os-page-head"
        >
          <div>
            <Link href="/dashboard/order-system" className="os-back">
              ← All orders
            </Link>
            <h1>
              New order<span className="accent">.</span>
            </h1>
            <p className="os-sub">
              Enter it once. We mint the order number, feed Rob&apos;s report,
              and stage the invoice — no blue sheet, no re-keying.
            </p>
          </div>
        </motion.div>

        <form className="os-form" onSubmit={submit}>
          {/* Header */}
          <section className="os-card">
            <div className="os-card-head">
              <h2>Order details</h2>
            </div>
            <div className="os-field-grid">
              <Field label="Customer" required>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer name"
                  required
                />
              </Field>
              <Field label="Destination">
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Ship-to city"
                />
              </Field>
              <Field label="Customer P.O." required>
                <input
                  type="text"
                  value={customerPO}
                  onChange={(e) => setCustomerPO(e.target.value)}
                  placeholder="e.g. PO-558213"
                />
              </Field>
              <Field label="Salesperson">
                <select
                  value={salesperson}
                  onChange={(e) => setSalesperson(e.target.value)}
                >
                  {SALESPEOPLE.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="Order date">
                <input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                />
              </Field>
              <Field label="Ship date">
                <input
                  type="date"
                  value={shipDate}
                  onChange={(e) => setShipDate(e.target.value)}
                />
              </Field>
              <Field label="Terms">
                <select value={terms} onChange={(e) => setTerms(e.target.value)}>
                  {TERMS_OPTIONS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
            </div>
          </section>

          {/* Line items */}
          <section className="os-card">
            <div className="os-card-head">
              <h2>Products</h2>
              <span className="os-line-count">
                {lines.length} line{lines.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="os-lines">
              <div className="os-line-header">
                <span>Product</span>
                <span>Size · Pack</span>
                <span>Qty</span>
                <span>Unit $</span>
                <span>Line total</span>
                <span />
              </div>

              {lines.map((l) => {
                const com = commodities.find((x) => x.id === l.commodityId);
                return (
                  <div key={l.id} className="os-line-row">
                    <select
                      value={l.commodityId}
                      onChange={(e) =>
                        setLine(l.id, {
                          commodityId: e.target.value,
                          sizeIndex: 0,
                        })
                      }
                    >
                      <option value="">Select…</option>
                      {commodities.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={l.sizeIndex}
                      onChange={(e) =>
                        setLine(l.id, { sizeIndex: parseInt(e.target.value, 10) })
                      }
                      disabled={!com}
                    >
                      {com ? (
                        com.sizes.map((s, i) => (
                          <option key={i} value={i}>
                            {s.size} · {s.unit}
                          </option>
                        ))
                      ) : (
                        <option>—</option>
                      )}
                    </select>

                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      placeholder="0"
                      value={l.quantity}
                      onChange={(e) =>
                        setLine(l.id, { quantity: e.target.value })
                      }
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={l.unitPrice}
                      onChange={(e) =>
                        setLine(l.id, { unitPrice: e.target.value })
                      }
                    />
                    <span className="os-line-total">
                      {money(lineTotal(l))}
                    </span>
                    <button
                      type="button"
                      className="os-line-del"
                      onClick={() => removeLine(l.id)}
                      aria-label="Remove line"
                      disabled={lines.length === 1}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>

            <button type="button" className="os-add-line" onClick={addLine}>
              + Add product
            </button>
          </section>

          {/* Notes + total */}
          <section className="os-card">
            <div className="os-field-grid">
              <Field label="Notes (optional)">
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Cold-chain notes, special instructions…"
                />
              </Field>
            </div>
            <div className="os-total-row">
              <span>Order total</span>
              <span className="os-total-amount">{money(orderTotal)}</span>
            </div>
          </section>

          {error && <div className="os-error">{error}</div>}

          <div className="os-form-foot">
            <Link href="/dashboard/order-system" className="os-btn ghost">
              Cancel
            </Link>
            <button type="submit" className="os-btn primary">
              Save order
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

function Topbar() {
  return (
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
        <div className="os-user">
          <div className="os-avatar">CJ</div>
          <Link href="/" className="os-logout">
            Sign out
          </Link>
        </div>
      </div>
    </header>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="os-field">
      <span className="os-field-label">
        {label}
        {required && <em>*</em>}
      </span>
      {children}
    </label>
  );
}
