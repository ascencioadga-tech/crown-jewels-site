"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SALESPEOPLE, TERMS_OPTIONS, commodities, money } from "../data";
import ProduceGlyph from "../../ProduceGlyph";
import {
  nextOrderNumber,
  useOrders,
  type OrderLine,
  type Order,
} from "../useOrders";
import {
  buildBoard,
  normSize,
  useInventory,
  type CommodityBoard,
} from "../useInventory";
import { GROWERS } from "../../grower-report/data";
import { GENERATED_GROWERS } from "../../grower-report/settlement";
import { postSales, type GrowerSale } from "../../grower-report/growerSales";
import OrderScanner, { type ScanResult } from "./OrderScanner";
import "../order-system.css";

const GROWER_LIST = [...GROWERS, ...GENERATED_GROWERS];

type DraftLine = {
  id: string;
  commodityId: string;
  sizeKey: string; // normalized board-column key
  quantity: string;
  unitPrice: string;
};

let lineSeq = 0;
const newLine = (): DraftLine => ({
  id: `l${Date.now()}-${lineSeq++}`,
  commodityId: "",
  sizeKey: "",
  quantity: "",
  unitPrice: "",
});

const today = () => new Date().toISOString().slice(0, 10);
const num = (n: number) => n.toLocaleString("en-US");
/** Render a stock figure, oversold shown red and parenthesized. */
const fig = (n: number) => (n < 0 ? `(${num(Math.abs(n))})` : num(n));

export default function NewOrderPage() {
  const router = useRouter();
  const { orders, hydrated: ordersReady, addOrder } = useOrders();
  const { lots, hydrated: invReady } = useInventory();
  const ready = ordersReady && invReady;

  const [customerName, setCustomerName] = useState("");
  const [destination, setDestination] = useState("");
  const [customerPO, setCustomerPO] = useState("");
  const [orderDate, setOrderDate] = useState(today());
  const [shipDate, setShipDate] = useState(today());
  const [salesperson, setSalesperson] = useState<string>(SALESPEOPLE[0]);
  const [terms, setTerms] = useState<string>(TERMS_OPTIONS[2]);
  const [notes, setNotes] = useState("");
  const [growerId, setGrowerId] = useState("");
  const [lotCode, setLotCode] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([newLine()]);
  const [activeLineId, setActiveLineId] = useState<string>("");
  const [error, setError] = useState("");
  const [flash, setFlash] = useState(false);

  // Board per commodity = inventory netted against existing saved orders.
  const boards = useMemo(() => {
    const map: Record<string, CommodityBoard> = {};
    commodities.forEach((c) => (map[c.id] = buildBoard(c, lots, orders)));
    return map;
  }, [lots, orders]);

  const setLine = (id: string, patch: Partial<DraftLine>) =>
    setLines((cur) => cur.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const addLine = () => setLines((cur) => [...cur, newLine()]);
  const removeLine = (id: string) =>
    setLines((cur) => (cur.length > 1 ? cur.filter((l) => l.id !== id) : cur));

  // AI scan → fill the order. Map each read line's size to a live board column.
  const applyExtraction = (r: ScanResult) => {
    setCustomerName(r.customer);
    setDestination(r.destination);
    setCustomerPO(r.po);
    const drafted: DraftLine[] = r.lines.map((sl) => {
      const cols = boards[sl.commodityId]?.columns ?? [];
      const col = cols.find((c) => c.key === normSize(sl.size)) ?? cols[0];
      return {
        ...newLine(),
        commodityId: sl.commodityId,
        sizeKey: col?.key ?? "",
        quantity: String(sl.qty),
        unitPrice: String(sl.unitPrice),
      };
    });
    setLines(drafted.length ? drafted : [newLine()]);
    setActiveLineId(drafted[0]?.id ?? "");
    setError("");
    setFlash(false);
    requestAnimationFrame(() => {
      setFlash(true);
      setTimeout(() => setFlash(false), 1300);
    });
  };

  const pickCommodity = (id: string, commodityId: string) => {
    const firstKey = boards[commodityId]?.columns[0]?.key ?? "";
    setLine(id, { commodityId, sizeKey: firstKey });
    setActiveLineId(id);
  };

  const lineTotal = (l: DraftLine) =>
    (parseFloat(l.quantity) || 0) * (parseFloat(l.unitPrice) || 0);

  const orderTotal = useMemo(
    () => lines.reduce((s, l) => s + lineTotal(l), 0),
    [lines]
  );

  // Sum of draft quantities for a commodity + size across all lines.
  const draftQty = (commodityId: string, sizeKey: string) =>
    lines.reduce(
      (s, l) =>
        l.commodityId === commodityId && l.sizeKey === sizeKey
          ? s + (parseFloat(l.quantity) || 0)
          : s,
      0
    );

  /** Live availability for a line: now / your draft / remaining after. */
  const availFor = (commodityId: string, sizeKey: string) => {
    const board = boards[commodityId];
    if (!board || !sizeKey || board.availableByCol[sizeKey] === undefined)
      return null;
    const now = board.availableByCol[sizeKey];
    const draft = draftQty(commodityId, sizeKey);
    return { now, draft, after: now - draft };
  };

  // Which commodity the panel focuses on (active line, else last with a product).
  const activeLine = lines.find((l) => l.id === activeLineId);
  const activeCommodityId =
    activeLine?.commodityId ||
    [...lines].reverse().find((l) => l.commodityId)?.commodityId ||
    "";

  const anyOversold = lines.some((l) => {
    const a = availFor(l.commodityId, l.sizeKey);
    return a !== null && a.after < 0;
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!customerName.trim()) return setError("Enter the customer.");
    if (!customerPO.trim()) return setError("Enter the customer P.O.");
    const validLines = lines.filter(
      (l) => l.commodityId && l.sizeKey && parseFloat(l.quantity) > 0
    );
    if (validLines.length === 0)
      return setError("Add at least one product line with a size and quantity.");

    const orderLines: OrderLine[] = validLines.map((l) => {
      const com = commodities.find((x) => x.id === l.commodityId)!;
      const col = boards[l.commodityId]?.columns.find(
        (c) => c.key === l.sizeKey
      );
      const cat = com.sizes.find((s) => normSize(s.size) === l.sizeKey);
      return {
        id: l.id,
        commodityId: com.id,
        productName: com.name,
        size: col?.label ?? l.sizeKey,
        unit: cat?.unit ?? "",
        pallet: cat?.pallet ?? "",
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

    // Consignment: if attributed to a grower lot, post the lines to that
    // grower's settlement (La Libreta reads them; they flow on to El Rancho).
    if (growerId) {
      const g = GROWER_LIST.find((x) => x.id === growerId);
      const sales: GrowerSale[] = orderLines.map((ol) => {
        const com = commodities.find((x) => x.id === ol.commodityId);
        return {
          id: `${order.id}-${ol.id}`,
          growerId,
          growerName: g?.name ?? "",
          lotCode: lotCode.trim() || order.orderNumber,
          commodity: com?.name ?? ol.productName,
          accent: com?.accent ?? "#6b6a64",
          description: `${ol.productName}${ol.size ? " " + ol.size : ""}`,
          qty: ol.quantity,
          unitPrice: ol.unitPrice,
          orderNumber: order.orderNumber,
          at: new Date().toISOString(),
        };
      });
      postSales(sales);
    }

    addOrder(order);
    router.push("/dashboard/order-system");
  };

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
            <Link href="/dashboard/order-system" className="os-back">
              ← All orders
            </Link>
            <h1>
              New order<span className="accent">.</span>
            </h1>
            <p className="os-sub">
              Enter it once — availability on the right updates live as you type,
              so you&apos;ll never oversell a size by accident.
            </p>
          </div>
        </motion.div>

        <div className="os-new-layout">
          {/* LEFT: the order builder */}
          <form className="os-form" onSubmit={submit}>
            <OrderScanner onExtract={applyExtraction} />

            {/* Header */}
            <section className={`os-card${flash ? " cj-flash-fill" : ""}`}>
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
                  <select
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                  >
                    {TERMS_OPTIONS.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Grower — consignment">
                  <select value={growerId} onChange={(e) => setGrowerId(e.target.value)}>
                    <option value="">— Not consignment —</option>
                    {GROWER_LIST.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} — #{g.id}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Grower lot">
                  <input
                    type="text"
                    value={lotCode}
                    onChange={(e) => setLotCode(e.target.value)}
                    placeholder={growerId ? "e.g. RV-C03" : "select a grower first"}
                    disabled={!growerId}
                  />
                </Field>
              </div>
            </section>

            {/* Line items */}
            <section className={`os-card${flash ? " cj-flash-fill" : ""}`}>
              <div className="os-card-head">
                <h2>Products</h2>
                <span className="os-line-count">
                  {lines.length} line{lines.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="os-lines">
                <div className="os-line-header os-line-header-av">
                  <span>Product</span>
                  <span>Size</span>
                  <span>Qty</span>
                  <span>Avail</span>
                  <span>Unit $</span>
                  <span>Line total</span>
                  <span />
                </div>

                {lines.map((l) => {
                  const board = boards[l.commodityId];
                  const sizeOpts = board ? board.columns : [];
                  const av = availFor(l.commodityId, l.sizeKey);
                  return (
                    <div
                      key={l.id}
                      className="os-line-row os-line-row-av"
                      onFocusCapture={() => setActiveLineId(l.id)}
                    >
                      <select
                        value={l.commodityId}
                        onChange={(e) => pickCommodity(l.id, e.target.value)}
                      >
                        <option value="">Select…</option>
                        {commodities.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>

                      <select
                        value={l.sizeKey}
                        onChange={(e) =>
                          setLine(l.id, { sizeKey: e.target.value })
                        }
                        disabled={!l.commodityId}
                      >
                        {l.commodityId ? (
                          sizeOpts.map((s) => (
                            <option key={s.key} value={s.key}>
                              {s.label}
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

                      <span className="os-line-avail">
                        {!ready || !av ? (
                          <span className="dim">—</span>
                        ) : (
                          <span
                            className={`os-avail-chip ${
                              av.after < 0 ? "over" : "ok"
                            }`}
                            title={`${num(av.now)} available · you've ordered ${num(
                              av.draft
                            )}`}
                          >
                            {fig(av.after)}
                          </span>
                        )}
                      </span>

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
            {!error && anyOversold && (
              <div className="os-warn">
                Heads up — one or more lines exceed what&apos;s available. You can
                still save, but plan to pull more product.
              </div>
            )}

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

          {/* RIGHT: live availability for ALL products */}
          <aside className="os-new-avail">
            <div className="os-avail-panel-head">
              <span className="os-avail-panel-eyebrow">
                <span className="dot" /> Live availability
              </span>
            </div>

            {!ready ? (
              <div className="os-avail-panel-empty">Loading inventory…</div>
            ) : (
              <AllAvailabilityPanel
                boards={boards}
                draftQty={draftQty}
                activeCommodityId={activeCommodityId}
                activeSizeKey={activeLine?.sizeKey}
              />
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}

type LiveSize = {
  key: string;
  label: string;
  now: number;
  draft: number;
  after: number;
};
type LiveSummary = {
  sizes: LiveSize[];
  totalAfter: number;
  totalDraft: number;
  oversold: boolean;
};

function summarize(
  commodityId: string,
  board: CommodityBoard,
  draftQty: (commodityId: string, sizeKey: string) => number
): LiveSummary {
  const sizes = board.columns.map((col) => {
    const now = board.availableByCol[col.key] ?? 0;
    const draft = draftQty(commodityId, col.key);
    return { key: col.key, label: col.label, now, draft, after: now - draft };
  });
  return {
    sizes,
    totalAfter: sizes.reduce((s, x) => s + x.after, 0),
    totalDraft: sizes.reduce((s, x) => s + x.draft, 0),
    oversold: sizes.some((x) => x.after < 0),
  };
}

/** Live availability for EVERY product — scannable, expandable, updates as you type. */
function AllAvailabilityPanel({
  boards,
  draftQty,
  activeCommodityId,
  activeSizeKey,
}: {
  boards: Record<string, CommodityBoard>;
  draftQty: (commodityId: string, sizeKey: string) => number;
  activeCommodityId: string;
  activeSizeKey?: string;
}) {
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string>(activeCommodityId);

  // Follow the line you're editing: auto-expand its commodity.
  useEffect(() => {
    if (activeCommodityId) setExpandedId(activeCommodityId);
  }, [activeCommodityId]);

  // Rank: products in this order first, then anything with stock tracked, then the rest.
  const ordered = useMemo(() => {
    const rank = (id: string) => {
      const b = boards[id];
      if (summarize(id, b, draftQty).totalDraft > 0) return 0;
      if (b.lotRows.length > 0 || b.orderRows.length > 0) return 1;
      return 2;
    };
    return [...commodities].sort((a, b) => rank(a.id) - rank(b.id));
  }, [boards, draftQty]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ordered;
    return ordered.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.group.toLowerCase().includes(q)
    );
  }, [ordered, query]);

  return (
    <div className="os-allav">
      <div className="os-allav-search">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="search"
          placeholder="Find a product…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="os-allav-list">
        {filtered.length === 0 && (
          <div className="os-allav-empty">No products match.</div>
        )}
        {filtered.map((c) => {
          const board = boards[c.id];
          const sum = summarize(c.id, board, draftQty);
          const tracked =
            board.lotRows.length > 0 || board.orderRows.length > 0;
          const untracked = !tracked && sum.totalDraft === 0;
          const open = expandedId === c.id;
          return (
            <div
              key={c.id}
              className={`os-allav-item ${open ? "open" : ""} ${
                c.id === activeCommodityId ? "active" : ""
              }`}
            >
              <button
                type="button"
                className="os-allav-row"
                onClick={() => setExpandedId(open ? "" : c.id)}
              >
                <ProduceGlyph id={c.id} size={30} className="os-rail-glyph" />
                <span className="os-allav-name">
                  {c.name}
                  {sum.totalDraft > 0 && (
                    <span className="os-allav-inorder">
                      {num(sum.totalDraft)} in order
                    </span>
                  )}
                </span>
                <span
                  className={`os-allav-total ${
                    untracked ? "dash" : sum.oversold ? "over" : "ok"
                  }`}
                >
                  {untracked ? "—" : fig(sum.totalAfter)}
                </span>
                <svg
                  className="os-allav-chev"
                  width="14"
                  height="14"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="os-allav-detail"
                  >
                    <table className="os-avail-panel-table">
                      <thead>
                        <tr>
                          <th>Size</th>
                          <th className="num">Avail</th>
                          <th className="num">Order</th>
                          <th className="num">Left</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sum.sizes.map((s) => (
                          <tr
                            key={s.key}
                            className={`${s.after < 0 ? "over" : ""} ${
                              c.id === activeCommodityId &&
                              s.key === activeSizeKey
                                ? "active"
                                : ""
                            }`}
                          >
                            <td className="sz">{s.label}</td>
                            <td className="num">{fig(s.now)}</td>
                            <td className="num order">
                              {s.draft ? num(s.draft) : "—"}
                            </td>
                            <td className={`num left ${s.after < 0 ? "over" : ""}`}>
                              {fig(s.after)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <div className="os-allav-foot">
        Totals already account for every other open order on the board.
      </div>
    </div>
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
