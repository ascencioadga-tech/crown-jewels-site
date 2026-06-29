"use client";

/* ============================================================
   Crown Jewels — Availability

   Modeled on Chucho's Availability board: a 4-card KPI strip, an
   icon-based commodity selector (everything one click away), and
   a board for the selected commodity — big icon header + season
   badge + sub-KPIs + a sizes table with In-stock / Low / Oversold
   pills. Live inventory (useInventory) netted against open orders
   (useOrders) per size. Rethemed to Crown Jewels (maroon · Fraunces
   + Geist · CJ produce). The "+ Add inventory" modal feeds the board.
   ============================================================ */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { commodities } from "../data";
import { useOrders } from "../useOrders";
import {
  buildBoard,
  newLotId,
  normSize,
  useInventory,
  type CommodityBoard,
  type LotKind,
} from "../useInventory";
import ProduceGlyph from "../../ProduceGlyph";
import "../order-system.css";
import "./availability.css";

const num = (n: number) => n.toLocaleString("en-US");
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Season label derived from the commodity's 12-month availability calendar. */
function seasonLabel(c: (typeof commodities)[number]): string {
  const a = c.availability;
  const off = a.filter((x) => x === "unavailable").length;
  if (off === 0) return "Year-round";
  if (off >= 11) return "Limited window";
  let start = -1;
  let end = -1;
  for (let i = 0; i < 12; i++) {
    const cur = a[i] !== "unavailable";
    const prev = a[(i + 11) % 12] !== "unavailable";
    const next = a[(i + 1) % 12] !== "unavailable";
    if (cur && !prev) start = i;
    if (cur && !next) end = i;
  }
  if (start >= 0 && end >= 0) return `${MONTHS[start]} – ${MONTHS[end]} program`;
  return "Seasonal";
}

/** Status of a single size, from on-hand & available. */
function sizeStatus(onHand: number, committed: number, avail: number) {
  if (onHand === 0 && committed === 0) return { cls: "none", label: "—" };
  if (avail < 0) return { cls: "over", label: "Oversold" };
  if (avail < 120) return { cls: "low", label: "Low" };
  return { cls: "ok", label: "In stock" };
}

export default function AvailabilityPage() {
  const { orders, hydrated: ordersReady } = useOrders();
  const { lots, hydrated: invReady, addLot } = useInventory();
  const hydrated = ordersReady && invReady;

  const boards = useMemo(() => {
    const map: Record<string, CommodityBoard> = {};
    commodities.forEach((c) => (map[c.id] = buildBoard(c, lots, orders)));
    return map;
  }, [lots, orders]);

  // Commodities with inventory/orders float to the front of the selector.
  const ranked = useMemo(() => {
    const hasData = (id: string) =>
      boards[id].lotRows.length > 0 || boards[id].orderRows.length > 0;
    return [...commodities].sort((a, b) => Number(hasData(b.id)) - Number(hasData(a.id)));
  }, [boards]);

  const [selectedId, setSelectedId] = useState<string>(commodities[0].id);
  const [adding, setAdding] = useState(false);

  const effectiveId = boards[selectedId] ? selectedId : ranked[0]?.id;
  const commodity = commodities.find((c) => c.id === effectiveId)!;
  const board = boards[effectiveId];

  // ---- top KPI totals (across every commodity & size) ----
  const totals = useMemo(() => {
    let onHand = 0;
    let committed = 0;
    let available = 0;
    let sizes = 0;
    let oversold = 0;
    commodities.forEach((c) => {
      const b = boards[c.id];
      onHand += b.startingTotal;
      committed += b.orderedTotal;
      available += b.availableTotal;
      b.columns.forEach((col) => {
        sizes++;
        if ((b.availableByCol[col.key] || 0) < 0) oversold++;
      });
    });
    return { onHand, committed, available, sizes, oversold };
  }, [boards]);

  const incoming = useMemo(
    () =>
      board.lotRows
        .filter((l) => l.kind === "incoming")
        .reduce((s, l) => s + l.total, 0),
    [board]
  );

  const availPct =
    totals.onHand > 0 ? Math.round((totals.available / totals.onHand) * 100) : 0;

  // ---- commodity carousel controls (synchronous scroll) ----
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const updateCtrl = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth - 2;
    setCanPrev(el.scrollLeft > 2);
    setCanNext(el.scrollLeft < max);
  }, []);
  useEffect(() => {
    updateCtrl();
    window.addEventListener("resize", updateCtrl);
    return () => window.removeEventListener("resize", updateCtrl);
  }, [updateCtrl, hydrated, ranked.length]);
  const scrollChips = (dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    const first = el.querySelector<HTMLElement>(".av-chip");
    const step = first ? (first.getBoundingClientRect().width + 10) * 3 : 480;
    el.scrollLeft += dir * step;
    updateCtrl();
  };

  return (
    <div className="cj-os cj-avail">
      <main className="os-main">
        <div className="os-page-head">
          <div>
            <div className="av-eyebrow">
              <span className="av-eyebrow-rule" />
              Sales desk
            </div>
            <h1>
              Availability<span className="accent">.</span>
            </h1>
            <p className="os-sub">
              Live inventory by size, netted against every open order. Pick a commodity
              below — all of them are one click away.
            </p>
          </div>
          <button className="os-btn primary" onClick={() => setAdding(true)}>
            + Add inventory
          </button>
        </div>

        {!hydrated ? (
          <div className="os-empty">Loading…</div>
        ) : (
          <>
            {/* ---- KPI strip ---- */}
            <div className="av-kpis">
              <div className="av-kpi accent">
                <div className="lbl">Cases on hand</div>
                <div className="val">{num(totals.onHand)}</div>
                <div className="cap">{totals.sizes} active sizes</div>
              </div>
              <div className="av-kpi">
                <div className="lbl">Committed</div>
                <div className="val">{num(totals.committed)}</div>
                <div className="cap">on open &amp; confirmed orders</div>
              </div>
              <div className="av-kpi good">
                <div className="lbl">Available to sell</div>
                <div className="val">{num(totals.available)}</div>
                <div className="cap">{availPct}% of inventory</div>
              </div>
              <div className={`av-kpi${totals.oversold ? " danger" : ""}`}>
                <div className="lbl">Oversold sizes</div>
                <div className="val">{totals.oversold}</div>
                <div className="cap">{totals.oversold ? "needs attention" : "board is clean"}</div>
              </div>
            </div>

            {/* ---- icon commodity selector (carousel) ---- */}
            <div className="av-commod-bar">
              <div className="av-commod-head">
                <span className="av-commod-label">Commodities</span>
                <div className="av-commod-ctrl">
                  <button
                    type="button"
                    className="av-car-btn"
                    aria-label="Previous"
                    disabled={!canPrev}
                    onClick={() => scrollChips(-1)}
                  >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="av-car-btn"
                    aria-label="Next"
                    disabled={!canNext}
                    onClick={() => scrollChips(1)}
                  >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="av-commod-track" ref={trackRef} onScroll={updateCtrl}>
                {ranked.map((c) => {
                  const b = boards[c.id];
                  return (
                    <button
                      key={c.id}
                      className={`av-chip${c.id === effectiveId ? " active" : ""}${
                        b.oversold ? " over" : ""
                      }`}
                      onClick={() => setSelectedId(c.id)}
                    >
                      <span className="av-chip-ic">
                        <ProduceGlyph id={c.id} size={26} />
                      </span>
                      <span className="av-chip-name">{c.name}</span>
                      <span className="av-chip-avail">
                        {b.oversold ? (
                          <b className="over">Oversold</b>
                        ) : (
                          <>
                            <b>{num(b.availableTotal)}</b> cs avail
                          </>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ---- board ---- */}
            <section className="av-board">
              <div className="av-board-head">
                <span className="av-board-ic">
                  <ProduceGlyph id={commodity.id} size={34} title={commodity.name} />
                </span>
                <div className="av-board-title">
                  <div className="av-board-meta">
                    {commodity.group} · {commodity.sizes.length} sizes
                  </div>
                  <h2>{commodity.name}</h2>
                </div>
                <span className="av-season">
                  <span className="sd" /> {seasonLabel(commodity)}
                </span>
              </div>

              {/* sub-KPIs */}
              <div className="av-subkpis">
                <div className="av-sub">
                  <div className="lbl">On hand</div>
                  <div className="val">{num(board.startingTotal)}</div>
                </div>
                <div className="av-sub">
                  <div className="lbl">Committed</div>
                  <div className="val">{num(board.orderedTotal)}</div>
                </div>
                <div className="av-sub good">
                  <div className="lbl">Available</div>
                  <div className="val">
                    {board.availableTotal < 0
                      ? `(${num(Math.abs(board.availableTotal))})`
                      : num(board.availableTotal)}
                  </div>
                </div>
                <div className="av-sub">
                  <div className="lbl">Incoming</div>
                  <div className="val">+{num(incoming)}</div>
                </div>
              </div>

              {/* sizes card */}
              <div className="av-card">
                <div className="av-card-head">
                  <span className="av-card-ic">
                    <ProduceGlyph id={commodity.id} size={26} />
                  </span>
                  <h3>{commodity.name}</h3>
                  <span className="av-card-note">FOB Nogales, AZ</span>
                </div>
                <table className="av-table">
                  <thead>
                    <tr>
                      <th>Size</th>
                      <th>Pack</th>
                      <th className="r">On hand</th>
                      <th className="r">Comm.</th>
                      <th className="r">Avail</th>
                      <th className="r">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {board.columns.map((col) => {
                      const oh = board.startingByCol[col.key] || 0;
                      const cm = board.orderedByCol[col.key] || 0;
                      const av = board.availableByCol[col.key] || 0;
                      const st = sizeStatus(oh, cm, av);
                      const catSize = commodity.sizes.find(
                        (sz) => normSize(sz.size) === col.key
                      );
                      const pack = catSize?.unit || "—";
                      return (
                        <tr key={col.key}>
                          <td>
                            <span className="av-sz">{col.label}</span>
                          </td>
                          <td className="dim">{pack}</td>
                          <td className="r">{oh ? num(oh) : "—"}</td>
                          <td className="r dim">{cm ? num(cm) : "—"}</td>
                          <td className="r">
                            <span className={`av-amt${av < 0 ? " over" : ""}`}>
                              {av < 0 ? `(${num(Math.abs(av))})` : num(av)}
                            </span>
                          </td>
                          <td className="r">
                            <span className={`av-pill ${st.cls}`}>
                              <span className="pd" />
                              {st.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>

      {adding && (
        <AddInventoryModal
          commodityName={commodity.name}
          sizes={board.columns.map((c) => c.label)}
          onClose={() => setAdding(false)}
          onSave={(payload) => {
            addLot({
              id: newLotId(),
              commodityId: commodity.id,
              kind: payload.kind,
              grower: payload.grower,
              label: payload.label,
              arrivalDate: payload.arrivalDate,
              manifest: payload.manifest,
              quantities: payload.quantities,
              createdAt: new Date().toISOString(),
            });
            setAdding(false);
          }}
        />
      )}
    </div>
  );
}

/* ============================ ADD INVENTORY MODAL ============================ */
type AddPayload = {
  kind: LotKind;
  grower: string;
  label: string;
  arrivalDate: string;
  manifest: string;
  quantities: Record<string, number>;
};

function AddInventoryModal({
  commodityName,
  sizes,
  onClose,
  onSave,
}: {
  commodityName: string;
  sizes: string[];
  onClose: () => void;
  onSave: (p: AddPayload) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [kind, setKind] = useState<LotKind>("incoming");
  const [grower, setGrower] = useState("");
  const [label, setLabel] = useState("");
  const [arrivalDate, setArrivalDate] = useState(today);
  const [manifest, setManifest] = useState("");
  const [qty, setQty] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const setSize = (s: string, v: string) => setQty((cur) => ({ ...cur, [s]: v }));

  const save = () => {
    if (!grower.trim()) return setError("Enter the grower / supplier.");
    const quantities: Record<string, number> = {};
    let any = false;
    sizes.forEach((s) => {
      const n = parseInt(qty[s] || "0", 10);
      quantities[s] = n > 0 ? n : 0;
      if (n > 0) any = true;
    });
    if (!any) return setError("Enter a quantity on at least one size.");
    onSave({ kind, grower: grower.trim(), label: label.trim(), arrivalDate, manifest: manifest.trim(), quantities });
  };

  return (
    <div className="os-inv-backdrop av-modal-back" onClick={onClose}>
      <div
        className="os-pay-modal av-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Add inventory"
      >
        <div className="os-pay-head">
          <div>
            <div className="os-pay-num">Add inventory</div>
            <div className="os-pay-cust">{commodityName}</div>
          </div>
          <button className="os-icon-btn" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="os-pay-form">
          <div className="os-seg">
            {(["holdover", "incoming"] as LotKind[]).map((k) => (
              <button key={k} className={kind === k ? "active" : ""} onClick={() => setKind(k)} type="button">
                {k === "holdover" ? "Holdover" : "Incoming"}
              </button>
            ))}
          </div>

          <div className="os-field-grid os-pay-grid">
            <label className="os-field">
              <span className="os-field-label">
                Grower / supplier<em>*</em>
              </span>
              <input type="text" value={grower} onChange={(e) => setGrower(e.target.value)} placeholder="e.g. Del Campo Produce" />
            </label>
            <label className="os-field">
              <span className="os-field-label">Label</span>
              <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Brand / label" />
            </label>
            <label className="os-field">
              <span className="os-field-label">Arrival date</span>
              <input type="date" value={arrivalDate} onChange={(e) => setArrivalDate(e.target.value)} />
            </label>
            <label className="os-field">
              <span className="os-field-label">Manifest #</span>
              <input type="text" value={manifest} onChange={(e) => setManifest(e.target.value)} placeholder="e.g. M-7820" />
            </label>
          </div>

          <div className="os-field-label" style={{ margin: "4px 0 8px" }}>
            Quantity by size
          </div>
          <div className="os-qty-grid">
            {sizes.map((s) => (
              <label key={s} className="os-qty-cell">
                <span>{s}</span>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  placeholder="0"
                  value={qty[s] || ""}
                  onChange={(e) => setSize(s, e.target.value)}
                />
              </label>
            ))}
          </div>

          {error && (
            <div className="os-error" style={{ marginTop: 14 }}>
              {error}
            </div>
          )}
        </div>

        <div className="os-pay-foot">
          <button className="os-btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="os-btn primary" onClick={save}>
            Add to board
          </button>
        </div>
      </div>
    </div>
  );
}
