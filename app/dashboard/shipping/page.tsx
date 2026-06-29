"use client";

/* ============================================================
   Crown Jewels Produce — Shipping  (Operations · Outbound)
   --------------------------------------------------------------
   The OUTBOUND counterpart to Receiving. The sales team books
   orders on the Sales Desk; here the dock crew stages and ships
   them. Each order line is filled FIFO from received inventory
   lots (which trace straight back to a grower's load), so the
   shipment is visibly "connected to lots": we show the grower /
   lot the cases are drawn from, and decrement that inventory so
   Availability reflects the sale. Confirming a shipment marks the
   order "shipped" — which flows it into Accounting's "To invoice"
   queue. Mirrors Receiving's KPIs, list→detail flow, confirm
   action, toasts and design.
   ============================================================ */

import { useMemo, useState } from "react";
import ProduceGlyph from "../ProduceGlyph";
import { commodities } from "../order-system/data";
import {
  useOrders,
  orderTotal,
  type Order,
  type OrderLine,
} from "../order-system/useOrders";
import {
  useInventory,
  normSize,
  type InventoryLot,
} from "../order-system/useInventory";
import { useInboundUploads } from "../inboundUploads";
import { firstName } from "../user";
import {
  buildShipmentDoc,
  realizedSalesByLot,
  type ShipmentDoc,
} from "./shipmentDoc";
import ShippingSalesSheet from "./ShippingSalesSheet";
import BillOfLading from "./BillOfLading";
import "./shipping.css";

const num = (n: number) => Math.round(n || 0).toLocaleString("en-US");
const money = (n: number) =>
  (n || 0).toLocaleString("en-US", { style: "currency", currency: "USD" });

const COMMODITY_NAME: Record<string, string> = Object.fromEntries(
  commodities.map((c) => [c.id, c.name])
);
const commodityName = (id: string, fallback?: string) =>
  COMMODITY_NAME[id] || fallback || id;

/* ---- icons ---- */
const CK = (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);
const ARROW = (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);
const WARN = (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
    />
  </svg>
);
const DOC = (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.9">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
    />
  </svg>
);
const TRUCK = (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
    />
  </svg>
);

/* ---- allocation: fill an order line FIFO from received inventory lots ---- */

/** The dock fields captured on the ship form, carried into the shipment doc. */
type ShipForm = {
  carrier: string;
  trailer: string;
  seal: string;
  shipDate: string;
  reeferTemp: string;
};

type LotDraw = { lotId: string; grower: string; label: string; cases: number };
type LineAlloc = {
  /** cases we can cover from on-hand inventory */
  filled: number;
  /** cases requested that we can't cover (oversold / short) */
  short: number;
  /** which lots (oldest received first) the cases come from */
  draws: LotDraw[];
};

/** Lots that hold this commodity at this size, oldest received first (FIFO). */
function lotsForLine(line: OrderLine, lots: InventoryLot[]): InventoryLot[] {
  const key = normSize(line.size);
  return lots
    .filter(
      (l) =>
        l.commodityId === line.commodityId &&
        Object.entries(l.quantities).some(
          ([sz, q]) => normSize(sz) === key && (q || 0) > 0
        )
    )
    .slice()
    .sort((a, b) => {
      const d = (a.arrivalDate || "").localeCompare(b.arrivalDate || "");
      return d !== 0 ? d : (a.createdAt || "").localeCompare(b.createdAt || "");
    });
}

/** Plan how a line is drawn FIFO across lots — for display, no mutation. */
function allocateLine(line: OrderLine, lots: InventoryLot[]): LineAlloc {
  let need = Math.max(0, line.quantity || 0);
  const draws: LotDraw[] = [];
  for (const lot of lotsForLine(line, lots)) {
    if (need <= 0) break;
    const key = normSize(line.size);
    // available at this size in this lot (sizes may collapse to one column)
    const avail = Object.entries(lot.quantities).reduce(
      (a, [sz, q]) => (normSize(sz) === key ? a + (q || 0) : a),
      0
    );
    if (avail <= 0) continue;
    const take = Math.min(avail, need);
    draws.push({ lotId: lot.id, grower: lot.grower, label: lot.label, cases: take });
    need -= take;
  }
  const requested = Math.max(0, line.quantity || 0);
  const filled = requested - need;
  return { filled, short: need, draws };
}

/** Unique grower names across a set of draws, in order. */
function growersFromDraws(draws: LotDraw[]): string[] {
  const seen: string[] = [];
  for (const d of draws) if (d.grower && !seen.includes(d.grower)) seen.push(d.grower);
  return seen;
}

export default function ShippingPage() {
  const { orders, hydrated, setStatus } = useOrders();
  const { lots, hydrated: invHydrated, updateLot, removeLot } = useInventory();
  const { uploads, recordSale } = useInboundUploads();

  const [view, setView] = useState<{ mode: "queue" | "ship"; id: string | null }>({
    mode: "queue",
    id: null,
  });
  const [toast, setToast] = useState<string | null>(null);
  // The order whose documents panel is open, plus which doc is showing.
  const [docOrderId, setDocOrderId] = useState<string | null>(null);
  const [openDoc, setOpenDoc] = useState<"sales" | "bol" | null>(null);

  // Orders the sales team has booked but not yet shipped = the dock queue.
  const ready = useMemo(
    () =>
      orders
        .filter((o) => o.status === "open" || o.status === "confirmed")
        .slice()
        .sort((a, b) => {
          // soonest ship date first; fall back to order date
          const d = (a.shipDate || "").localeCompare(b.shipDate || "");
          if (d !== 0) return d;
          return (b.createdAt || "").localeCompare(a.createdAt || "");
        }),
    [orders]
  );

  // Shipped TODAY — for the KPI strip + the recently-shipped trail.
  const today = new Date().toISOString().slice(0, 10);
  const shippedToday = useMemo(
    () =>
      orders.filter((o) => {
        if (o.status !== "shipped") return false;
        const ev = [...o.history].reverse().find((h) => h.status === "shipped");
        return ev ? ev.at.slice(0, 10) === today : false;
      }),
    [orders, today]
  );

  const orderCases = (o: Order) => o.lines.reduce((a, l) => a + (l.quantity || 0), 0);

  // ---- KPIs (guarded; blank-slate friendly) ----
  const toShip = ready.length;
  const casesToShip = ready.reduce((a, o) => a + orderCases(o), 0);
  const shippedTodayCount = shippedToday.length;
  const valueShipped = shippedToday.reduce((a, o) => a + orderTotal(o), 0);

  const fireToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 4600);
  };

  /* ---- confirm: build the shipment doc, mark shipped, decrement inventory
     FIFO, record the realized sale back onto each grower lot ---- */
  const confirmShip = (o: Order, form: ShipForm) => {
    // Build the document FIRST — while inventory is still on hand — so the lot
    // allocation is captured before we decrement (the FIFO plan must match the
    // draw-down below). This doc is persisted on the order for reproducibility.
    const shipmentDoc = buildShipmentDoc(o, {
      lots,
      loads: uploads,
      commodityName,
      carrier: form.carrier,
      trailer: form.trailer,
      seal: form.seal,
      shipDate: form.shipDate,
      reeferTemp: form.reeferTemp,
    });

    // Work against a mutable copy of each lot's quantities so multiple lines
    // drawing the same commodity/size don't double-spend.
    const working: Record<string, Record<string, number>> = {};
    const ensure = (lot: InventoryLot) => {
      if (!working[lot.id]) working[lot.id] = { ...lot.quantities };
      return working[lot.id];
    };
    const touched = new Set<string>();
    const growers = new Set<string>();

    for (const line of o.lines) {
      let need = Math.max(0, line.quantity || 0);
      if (need <= 0) continue;
      const key = normSize(line.size);
      for (const lot of lotsForLine(line, lots)) {
        if (need <= 0) break;
        const q = ensure(lot);
        // draw down each raw size column under this normalized size
        for (const sz of Object.keys(q)) {
          if (need <= 0) break;
          if (normSize(sz) !== key) continue;
          const have = q[sz] || 0;
          if (have <= 0) continue;
          const take = Math.min(have, need);
          q[sz] = have - take;
          need -= take;
          touched.add(lot.id);
          if (lot.grower) growers.add(lot.grower);
        }
      }
    }

    // Persist inventory: update touched lots; remove any that hit zero.
    for (const lotId of touched) {
      const q = working[lotId];
      const total = Object.values(q).reduce((a, n) => a + (n || 0), 0);
      if (total <= 0) removeLot(lotId);
      else updateLot(lotId, { quantities: q });
    }

    // Mark the order shipped → flows to Accounting's "To invoice" — and record
    // the shipment doc in the SAME write so the lot allocation (and the sales
    // sheet / BOL) stay reproducible after inventory is drawn down. (One persist:
    // a separate updateOrder would race this and get overwritten.)
    setStatus(o.id, "shipped", "Alejandro", { shipmentDoc });

    // Accumulate the realized sale value (cases × price) onto each grower lot
    // it sold from — so Accounting / Settlement know what each lot earned.
    recordSale(realizedSalesByLot(shipmentDoc));

    const drawn =
      growers.size > 0 ? [...growers].join(", ") : "inventory";
    fireToast(
      `Shipped ${o.orderNumber} to ${o.customerName} · drawn from ${drawn} · sales sheet ready`
    );
    setView({ mode: "queue", id: null });
  };

  const shipOrder =
    view.mode === "ship" && view.id ? orders.find((x) => x.id === view.id) ?? null : null;

  // The shipped order whose Documents panel / modal is open, plus the
  // ShipmentDoc to render — the one recorded at confirm time (reproducible),
  // rebuilt on the fly only if an older order has none stored.
  const docOrder = docOrderId ? orders.find((x) => x.id === docOrderId) ?? null : null;
  const docForOrder: ShipmentDoc | null = useMemo(() => {
    if (!docOrder) return null;
    if (docOrder.shipmentDoc) return docOrder.shipmentDoc;
    return buildShipmentDoc(docOrder, { lots, loads: uploads, commodityName });
  }, [docOrder, lots, uploads]);

  const loading = !hydrated || !invHydrated;

  return (
    <div className="cj-shipout">
      <main>
        {shipOrder ? (
          <ShipScreen
            key={shipOrder.id}
            o={shipOrder}
            lots={lots}
            onBack={() => setView({ mode: "queue", id: null })}
            onConfirm={(form) => confirmShip(shipOrder, form)}
          />
        ) : (
          <>
            <div className="so-head">
              <div>
                <div className="so-eyebrow">
                  <span className="rule" />
                  <span className="txt">Operations · Outbound</span>
                </div>
                <h1>
                  Shipping<span className="accent">.</span>
                </h1>
                <p className="so-sub">
                  The orders the sales team booked, staged and shipped from the dock.
                  Each line is filled from received inventory — traced straight back to
                  the grower lot — then billed by Accounting once it ships.
                </p>
              </div>
            </div>

            <div className="so-kpis">
              <Kpi cls="accent" label="To ship" value={num(toShip)} />
              <Kpi label="Cases to ship" value={num(casesToShip)} />
              <Kpi cls="green" label="Shipped today" value={num(shippedTodayCount)} />
              <Kpi cls="green" label="Value shipped" value={money(valueShipped)} />
            </div>

            <div className="so-list">
              <div className="so-grp">
                Ready to ship
                <span className="gc">{ready.length} staged</span>
              </div>

              {loading ? (
                <div className="so-empty">Loading the dock queue…</div>
              ) : ready.length === 0 ? (
                <div className="so-empty">
                  No orders staged to ship — they appear here as the sales team books them.
                </div>
              ) : (
                ready.map((o) => {
                  const cases = orderCases(o);
                  const csLine =
                    o.lines
                      .map((l) => commodityName(l.commodityId, l.productName))
                      .slice(0, 3)
                      .join(", ") + (o.lines.length > 3 ? ` +${o.lines.length - 3}` : "");
                  return (
                    <div key={o.id} className="so-row">
                      <div className="so-when">
                        <div className="t">{o.shipDate || "—"}</div>
                        <div className="r">Ship date</div>
                      </div>
                      <div className="so-main">
                        <div className="so-cust">
                          {o.customerName}
                          <span className={`so-status ${o.status}`}>
                            <span className="sd" />
                            {o.status === "confirmed" ? "Confirmed" : "Open"}
                          </span>
                        </div>
                        <div className="so-sum">
                          <span>
                            Order <b>{o.orderNumber}</b>
                          </span>
                          {o.destination && <span>{o.destination}</span>}
                          <span>
                            Rep <b>{firstName(o.salesperson)}</b>
                          </span>
                          <span>{csLine}</span>
                        </div>
                        {o.customerPO && (
                          <div className="so-meta">
                            PO {o.customerPO} · {o.lines.length}{" "}
                            {o.lines.length === 1 ? "line" : "lines"} · {o.terms}
                          </div>
                        )}
                      </div>
                      <div className="so-val">
                        <div className="n">{num(cases)}</div>
                        <div className="l">cases · {money(orderTotal(o))}</div>
                      </div>
                      <div className="so-act">
                        <button
                          className="so-btn primary"
                          onClick={() => setView({ mode: "ship", id: o.id })}
                        >
                          {TRUCK}
                          Stage shipment
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {!loading && shippedToday.length > 0 && (
              <div className="so-list so-shipped">
                <div className="so-grp green">
                  Shipped today
                  <span className="gc">{shippedToday.length}</span>
                </div>
                {shippedToday.map((o) => {
                  const docsOpen = docOrderId === o.id;
                  return (
                    <div key={o.id} className="so-shipwrap">
                      <div className="so-row shipped">
                        <div className="so-when">
                          <div className="t">{o.shipDate || today}</div>
                          <div className="r">Shipped</div>
                        </div>
                        <div className="so-main">
                          <div className="so-cust">
                            {o.customerName}
                            <span className="so-status shipped">
                              <span className="sd" />
                              Shipped
                            </span>
                          </div>
                          <div className="so-sum">
                            <span>
                              Order <b>{o.orderNumber}</b>
                            </span>
                            {o.destination && <span>{o.destination}</span>}
                            <span>
                              Rep <b>{firstName(o.salesperson)}</b>
                            </span>
                          </div>
                          <div className="so-meta done">
                            Billed by Accounting · awaiting invoice
                          </div>
                        </div>
                        <div className="so-val">
                          <div className="n">{num(orderCases(o))}</div>
                          <div className="l">cases · {money(orderTotal(o))}</div>
                        </div>
                        <div className="so-act">
                          <button
                            className={`so-btn ghost so-docbtn${docsOpen ? " open" : ""}`}
                            onClick={() =>
                              setDocOrderId(docsOpen ? null : o.id)
                            }
                          >
                            {DOC}
                            Documents
                          </button>
                        </div>
                      </div>

                      {docsOpen && (
                        <div className="so-docs">
                          <div className="so-docs-head">
                            <span className="so-docs-title">
                              Transaction documents
                            </span>
                            <span className="so-docs-sub">
                              Order {o.orderNumber} · {o.customerName}
                            </span>
                          </div>
                          <div className="so-docs-btns">
                            <button
                              className="so-docs-btn"
                              onClick={() => {
                                setDocOrderId(o.id);
                                setOpenDoc("sales");
                              }}
                            >
                              {DOC}
                              <span>
                                <b>Sales sheet</b>
                                <small>PASSING — records the lot &amp; sale price</small>
                              </span>
                            </button>
                            <button
                              className="so-docs-btn"
                              onClick={() => {
                                setDocOrderId(o.id);
                                setOpenDoc("bol");
                              }}
                            >
                              {TRUCK}
                              <span>
                                <b>Bill of Lading</b>
                                <small>Straight BOL — the freight document</small>
                              </span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* ---- Document modals (print-ready) ---- */}
      {docOrder && openDoc === "sales" && docForOrder && (
        <ShippingSalesSheet doc={docForOrder} onClose={() => setOpenDoc(null)} />
      )}
      {docOrder && openDoc === "bol" && docForOrder && (
        <BillOfLading doc={docForOrder} onClose={() => setOpenDoc(null)} />
      )}

      {/* ---- Toast ---- */}
      {toast && (
        <div className="so-toast">
          {CK}
          {toast}
        </div>
      )}
    </div>
  );
}

/* ================= Components ================= */

function Kpi({ label, value, cls }: { label: string; value: string; cls?: string }) {
  return (
    <div className={`so-kpi${cls ? ` ${cls}` : ""}`}>
      <div className="lbl">{label}</div>
      <div className="val">{value}</div>
    </div>
  );
}

function ShipScreen({
  o,
  lots,
  onBack,
  onConfirm,
}: {
  o: Order;
  lots: InventoryLot[];
  onBack: () => void;
  onConfirm: (form: ShipForm) => void;
}) {
  const [carrier, setCarrier] = useState("");
  const [trailer, setTrailer] = useState("");
  const [seal, setSeal] = useState("");
  const [reeferTemp, setReeferTemp] = useState("");
  const [shipDate, setShipDate] = useState(
    o.shipDate || new Date().toISOString().slice(0, 10)
  );

  // Plan each line's allocation once (for display + the short flag).
  const allocs = useMemo(() => o.lines.map((l) => allocateLine(l, lots)), [o, lots]);

  const cases = o.lines.reduce((a, l) => a + (l.quantity || 0), 0);
  const shortLines = allocs.filter((a) => a.short > 0).length;
  const totalShort = allocs.reduce((a, x) => a + x.short, 0);

  // All growers feeding this shipment (for the confirm summary).
  const allGrowers = useMemo(() => {
    const seen: string[] = [];
    for (const a of allocs)
      for (const g of growersFromDraws(a.draws))
        if (!seen.includes(g)) seen.push(g);
    return seen;
  }, [allocs]);

  return (
    <div className="so-screen">
      <button className="so-back" onClick={onBack}>
        ← Ready to ship
      </button>
      <div className="so-head">
        <div>
          <div className="so-eyebrow">
            <span className="rule" />
            <span className="txt">Shipping · {o.orderNumber}</span>
          </div>
          <h1>
            {o.customerName}
            <span className="accent">.</span>
          </h1>
          <div className="so-shipmeta">
            {o.destination && (
              <span>
                Destination <b>{o.destination}</b>
              </span>
            )}
            <span>
              Rep <b>{firstName(o.salesperson)}</b>
            </span>
            {o.customerPO && (
              <span>
                PO <b>{o.customerPO}</b>
              </span>
            )}
            <span>
              Terms <b>{o.terms}</b>
            </span>
            <span>
              Channel <b>{o.channel || "—"}</b>
            </span>
          </div>
          <div className="so-up">
            Booked on the Sales Desk · order date {o.orderDate} · {o.lines.length}{" "}
            {o.lines.length === 1 ? "line" : "lines"} · {num(cases)} cs
          </div>
        </div>
      </div>

      {/* Carrier / trailer / seal / date */}
      <div className="so-carrier">
        <Field label="Truck / carrier">
          <input
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            placeholder="e.g. CR England / owner-op"
          />
        </Field>
        <Field label="Trailer #">
          <input
            value={trailer}
            onChange={(e) => setTrailer(e.target.value)}
            placeholder="Reefer #"
          />
        </Field>
        <Field label="Seal #">
          <input
            value={seal}
            onChange={(e) => setSeal(e.target.value)}
            placeholder="Seal applied at the dock"
          />
        </Field>
        <Field label="Reefer temp">
          <input
            value={reeferTemp}
            onChange={(e) => setReeferTemp(e.target.value)}
            placeholder="e.g. 38°F"
          />
        </Field>
        <Field label="Ship date">
          <input type="date" value={shipDate} onChange={(e) => setShipDate(e.target.value)} />
        </Field>
      </div>

      <div className="so-linesbar">
        <div className="t">
          <b>{o.lines.length} lines</b> on this order · <b>{num(cases)} cs</b>. Each line is
          filled from received inventory — drawn FIFO from the grower lots below.
        </div>
        {shortLines > 0 ? (
          <span className="so-shortbadge">
            {WARN}
            {totalShort} cs short across {shortLines}{" "}
            {shortLines === 1 ? "line" : "lines"}
          </span>
        ) : (
          <span className="so-okbadge">
            {CK}
            Fully covered from inventory
          </span>
        )}
      </div>

      <div>
        {o.lines.map((l, i) => {
          const a = allocs[i];
          const short = a.short > 0;
          const growers = growersFromDraws(a.draws);
          const lineVal = (l.quantity || 0) * (l.unitPrice || 0);
          return (
            <div key={l.id || i} className={`so-line${short ? " short" : ""}`}>
              <div className="so-line-head">
                <ProduceGlyph
                  id={l.commodityId}
                  size={46}
                  className="so-glyph"
                  title={commodityName(l.commodityId, l.productName)}
                />
                <div className="so-line-info">
                  <div className="so-line-top">
                    <span className="so-line-name">
                      {commodityName(l.commodityId, l.productName)}
                    </span>
                    {l.size && <span className="so-line-sz">{l.size}</span>}
                    {l.pallet && <span className="so-line-pallet">{l.pallet}</span>}
                  </div>
                  <div className="so-line-ord">
                    Ordered <b>{num(l.quantity)} cs</b> @ {money(l.unitPrice)}
                  </div>
                </div>
                <div className={`so-line-qty${short ? " short" : ""}`}>
                  <div className="so-line-num">
                    {num(l.quantity)} <small>cs</small>
                  </div>
                  <div className="so-line-money">{money(lineVal)}</div>
                </div>
              </div>

              {/* inventory draw — the visible "connected to lots" link */}
              <div className="so-draw">
                {a.draws.length === 0 ? (
                  <div className="so-draw-none">
                    No received inventory on hand for this size — oversold. Ships short
                    against the grower lots once they arrive.
                  </div>
                ) : (
                  <>
                    <div className="so-draw-head">
                      Drawn from{" "}
                      <b>
                        {growers.length === 1
                          ? growers[0]
                          : `${growers.length} grower lots`}
                      </b>
                    </div>
                    <div className="so-draw-lots">
                      {a.draws.map((d) => (
                        <div key={d.lotId} className="so-draw-lot">
                          <span className="so-draw-g">{d.grower}</span>
                          <span className="so-draw-l">{d.label}</span>
                          <span className="so-draw-c">{num(d.cases)} cs</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {short && (
                  <div className="so-draw-short">
                    {WARN}
                    {num(a.short)} cs short — will ship oversold
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="so-confirmbar">
        <div className="so-cb-left">
          <span className={`so-cb-badge ${shortLines ? "warn" : "ok"}`}>
            {shortLines ? WARN : CK}
          </span>
          <div>
            <div className="so-cb-n">
              {num(cases)} <span className="of">cs · {money(orderTotal(o))}</span>
            </div>
            <div className={`so-cb-sub${shortLines ? " warn" : ""}`}>
              {shortLines
                ? `${shortLines} line${shortLines === 1 ? "" : "s"} short · shipping oversold`
                : allGrowers.length > 0
                  ? `From ${allGrowers.join(", ")}`
                  : "Fully covered from inventory"}
            </div>
          </div>
        </div>
        <button
          className="so-confirm"
          onClick={() =>
            onConfirm({ carrier, trailer, seal, reeferTemp, shipDate })
          }
        >
          Confirm shipment {ARROW}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="so-field">
      <span className="so-field-label">{label}</span>
      {children}
    </label>
  );
}
