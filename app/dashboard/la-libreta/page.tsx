"use client";

/* ============================================================
   Crown Jewels — Settlement Sheet  (Finance · Grower liquidation)
   --------------------------------------------------------------
   Lots flow in from Receiving the moment a load is posted to the
   dock. This is where each RECEIVED lot is liquidated to its
   grower: enter the FOB price, commission, and pass-through
   charges, and the net return computes live. Hitting "Settle &
   liquidate" writes the LotSettlement back onto the lot (status →
   settled), closing the thread the Ship Sheet opened.

   Reads the real shared lot store (useInboundUploads) — no
   hardcoded grower, no publish/grower-report dependencies.
   ============================================================ */

import { useMemo, useState } from "react";
import {
  useInboundUploads,
  lotStatus,
  lotCases,
  lotCode,
  lotSoldAvg,
  type Inbound,
} from "../inboundUploads";
import "./la-libreta.css";

/* ---- formatting ---- */
const usd = (n: number) =>
  (n < 0 ? "-$" : "$") +
  Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const usd0 = (n: number) =>
  (n < 0 ? "-$" : "$") + Math.abs(Math.round(n)).toLocaleString("en-US");
const cases = (n: number) => Math.round(n).toLocaleString("en-US");
const r2 = (n: number) => Math.round(n * 100) / 100;
const dateFmt = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

/* ---- the commodity headline for a lot, e.g. "Cucumbers · Roma Tomatoes" ---- */
const commodityLine = (l: Inbound) => {
  const seen: string[] = [];
  l.lines.forEach((ln) => {
    if (ln.n && !seen.includes(ln.n)) seen.push(ln.n);
  });
  return seen.join(" · ");
};

const receivedOf = (l: Inbound) => l.receivedCases ?? lotCases(l);

/* ---- default charge line items on a fresh worksheet ---- */
type Charge = { key: string; label: string; amount: number };
const DEFAULT_CHARGES: Charge[] = [
  { key: "cold", label: "Cold storage", amount: 600 },
  { key: "freight", label: "Freight", amount: 1800 },
  { key: "inspection", label: "Inspection", amount: 350 },
];

/* ---- per-lot worksheet state, computed live ---- */
type Draft = { fobPrice: number; pct: number; charges: Charge[] };
/* Pre-fill the FOB price from the lot's REALIZED sale (Σ value ÷ Σ cases sold
   by Shipping) so the liquidation reflects what the product actually sold for;
   fall back to the standard estimate when nothing has shipped yet. */
const freshDraft = (lot?: Inbound): Draft => {
  const avg = lot ? lotSoldAvg(lot) : 0;
  return {
    fobPrice: avg > 0 ? Math.round(avg * 100) / 100 : 12.5,
    pct: 10,
    charges: DEFAULT_CHARGES.map((c) => ({ ...c })),
  };
};

function computeDraft(received: number, d: Draft) {
  const charges = r2(d.charges.reduce((a, c) => a + (Number(c.amount) || 0), 0));
  const gross = r2(received * (Number(d.fobPrice) || 0));
  const commission = r2(gross * ((Number(d.pct) || 0) / 100));
  const net = r2(gross - commission - charges);
  return { gross, commission, charges, net };
}

/* ===================== Worksheet card ===================== */
function Worksheet({
  lot,
  onSettle,
}: {
  lot: Inbound;
  onSettle: (settlement: {
    soldCases: number;
    fobPrice: number;
    gross: number;
    commissionPct: number;
    commission: number;
    charges: number;
    net: number;
    settledAt: string;
  }) => void;
}) {
  const received = receivedOf(lot);
  const [draft, setDraft] = useState<Draft>(() => freshDraft(lot));
  const { gross, commission, charges, net } = computeDraft(received, draft);
  const soldAvg = lotSoldAvg(lot);

  const setFob = (v: number) => setDraft((d) => ({ ...d, fobPrice: v }));
  const setPct = (v: number) => setDraft((d) => ({ ...d, pct: v }));
  const setCharge = (key: string, v: number) =>
    setDraft((d) => ({
      ...d,
      charges: d.charges.map((c) => (c.key === key ? { ...c, amount: v } : c)),
    }));

  const settle = () =>
    onSettle({
      soldCases: received,
      fobPrice: r2(Number(draft.fobPrice) || 0),
      gross,
      commissionPct: (Number(draft.pct) || 0) / 100,
      commission,
      charges,
      net,
      settledAt: new Date().toISOString(),
    });

  return (
    <article className="st-sheet">
      {/* header */}
      <header className="st-sheet-head">
        <div className="st-sheet-id">
          <div className="st-grower">{lot.grower}</div>
          <div className="st-sheet-meta">
            <span className="st-lotcode">{lotCode(lot)}</span>
            <span className="st-dot" />
            <span>{lot.region}</span>
          </div>
          {commodityLine(lot) && <div className="st-commodity">{commodityLine(lot)}</div>}
        </div>
        <div className="st-recv">
          <span className="lbl">Received</span>
          <span className="val">{cases(received)}</span>
          <span className="unit">cases</span>
        </div>
      </header>

      <div className="st-sheet-body">
        {/* inputs */}
        <div className="st-inputs">
          <label className="st-input">
            <span className="st-input-lbl">FOB price</span>
            <div className="st-input-box">
              <em className="pre">$</em>
              <input
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                value={draft.fobPrice}
                onChange={(e) => setFob(Number(e.target.value) || 0)}
              />
              <em className="suf">/ case</em>
            </div>
            {soldAvg > 0 && (
              <span className="st-sold-hint">
                From realized sales · {usd(soldAvg)}/cs
                {lot.soldCases ? ` on ${cases(lot.soldCases)} cs` : ""}
              </span>
            )}
          </label>

          <label className="st-input">
            <span className="st-input-lbl">Commission</span>
            <div className="st-input-box">
              <input
                type="number"
                step="0.5"
                min="0"
                inputMode="decimal"
                value={draft.pct}
                onChange={(e) => setPct(Number(e.target.value) || 0)}
              />
              <em className="suf">% of gross</em>
            </div>
          </label>

          <div className="st-charges">
            <span className="st-input-lbl">Charges</span>
            <div className="st-charge-rows">
              {draft.charges.map((c) => (
                <label className="st-charge-row" key={c.key}>
                  <span className="st-charge-lbl">{c.label}</span>
                  <div className="st-charge-box">
                    <em className="pre">$</em>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      inputMode="decimal"
                      value={c.amount}
                      onChange={(e) => setCharge(c.key, Number(e.target.value) || 0)}
                    />
                  </div>
                </label>
              ))}
              <div className="st-charge-row total">
                <span className="st-charge-lbl">Total charges</span>
                <span className="st-charge-total">{usd(charges)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* live math */}
        <div className="st-math">
          <div className="st-math-rows">
            <div className="st-math-row">
              <span>Gross</span>
              <span className="amt">
                {cases(received)} × {usd(draft.fobPrice || 0)} = <b>{usd(gross)}</b>
              </span>
            </div>
            <div className="st-math-row">
              <span>Commission ({r2(draft.pct || 0)}%)</span>
              <span className="amt neg">− {usd(commission)}</span>
            </div>
            <div className="st-math-row">
              <span>Charges</span>
              <span className="amt neg">− {usd(charges)}</span>
            </div>
          </div>
          <div className="st-net">
            <span className="st-net-lbl">Net to grower</span>
            <strong className={net < 0 ? "neg" : ""}>{usd(net)}</strong>
          </div>
          <button className="st-settle-btn" onClick={settle}>
            Settle &amp; liquidate
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
}

/* ===================== Page ===================== */
export default function SettlementSheetPage() {
  const { uploads, hydrated, markSettled } = useInboundUploads();

  const { ready, settled } = useMemo(() => {
    const ready: Inbound[] = [];
    const settled: Inbound[] = [];
    uploads.forEach((l) => {
      const s = lotStatus(l);
      if (s === "received") ready.push(l);
      else if (s === "settled") settled.push(l);
    });
    return { ready, settled };
  }, [uploads]);

  // KPIs
  const readyCount = ready.length;
  const casesToSettle = ready.reduce((a, l) => a + receivedOf(l), 0);
  const settledNet = settled.reduce((a, l) => a + (l.settlement?.net ?? 0), 0);
  const settledGross = settled.reduce((a, l) => a + (l.settlement?.gross ?? 0), 0);
  const settledCases = settled.reduce((a, l) => a + (l.settlement?.soldCases ?? 0), 0);
  const avgPerCase = settledCases > 0 ? settledGross / settledCases : 0;

  // settled table sums
  const sum = settled.reduce(
    (a, l) => {
      const s = l.settlement;
      if (s) {
        a.cases += s.soldCases;
        a.gross += s.gross;
        a.commission += s.commission;
        a.charges += s.charges;
        a.net += s.net;
      }
      return a;
    },
    { cases: 0, gross: 0, commission: 0, charges: 0, net: 0 }
  );

  return (
    <div className="cj-settle">
      <main className="st-main">
        {/* head */}
        <div className="st-head">
          <div className="st-eyebrow">
            <span className="st-eyebrow-rule" /> Finance · Grower liquidation
          </div>
          <h1>
            Settlement Sheet<span className="accent">.</span>
          </h1>
          <p className="st-sub">
            Lots flow in from Receiving the moment a load is posted to the dock. Liquidate each
            received lot to its grower here — set the FOB price, commission, and charges, and the
            net return writes itself.
          </p>
        </div>

        {/* KPI strip */}
        <div className="st-kpis">
          <div className="st-kpi accent">
            <div className="lbl">Ready to settle</div>
            <div className="val">{cases(readyCount)}</div>
            <div className="cap">lots received, not yet liquidated</div>
          </div>
          <div className="st-kpi accent">
            <div className="lbl">Cases to settle</div>
            <div className="val">{cases(casesToSettle)}</div>
            <div className="cap">received cases awaiting liquidation</div>
          </div>
          <div className="st-kpi good">
            <div className="lbl">Settled net</div>
            <div className="val">{usd0(settledNet)}</div>
            <div className="cap">net returned to growers</div>
          </div>
          <div className="st-kpi good">
            <div className="lbl">Avg $/case</div>
            <div className="val">{settledCases > 0 ? usd(avgPerCase) : "—"}</div>
            <div className="cap">gross ÷ cases, settled lots</div>
          </div>
        </div>

        {/* READY TO SETTLE */}
        <section className="st-section">
          <div className="st-section-head">
            <h2>Ready to settle</h2>
            <span className="st-section-count">{cases(readyCount)}</span>
          </div>

          {!hydrated ? (
            <div className="st-empty">Loading lots…</div>
          ) : ready.length === 0 ? (
            <div className="st-empty">
              No lots ready to settle yet — they appear here the moment Receiving posts a load.
            </div>
          ) : (
            <div className="st-sheets">
              {ready.map((lot) => (
                <Worksheet
                  key={lot.id}
                  lot={lot}
                  onSettle={(settlement) => markSettled(lot.id, settlement)}
                />
              ))}
            </div>
          )}
        </section>

        {/* SETTLED */}
        <section className="st-section">
          <div className="st-section-head">
            <h2>Settled</h2>
            <span className="st-section-count">{cases(settled.length)}</span>
          </div>

          {settled.length === 0 ? (
            <div className="st-empty">Nothing settled yet.</div>
          ) : (
            <div className="st-card">
              <div className="st-table-scroll">
                <table className="st-table">
                  <thead>
                    <tr>
                      <th>Lot</th>
                      <th>Grower</th>
                      <th className="r">Cases</th>
                      <th className="r">Gross</th>
                      <th className="r">Commission</th>
                      <th className="r">Charges</th>
                      <th className="r">Net</th>
                      <th className="r">Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settled.map((l) => {
                      const s = l.settlement!;
                      return (
                        <tr key={l.id}>
                          <td className="mono">{lotCode(l)}</td>
                          <td className="grower">{l.grower}</td>
                          <td className="r">{cases(s.soldCases)}</td>
                          <td className="r">{usd(s.gross)}</td>
                          <td className="r dim">{usd(s.commission)}</td>
                          <td className="r dim">{usd(s.charges)}</td>
                          <td className="r net">{usd(s.net)}</td>
                          <td className="r dim">{dateFmt(s.settledAt)}</td>
                          <td>
                            <span className="st-pill ok">
                              <span className="pd" /> Settled
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={2}>{cases(settled.length)} lots</td>
                      <td className="r">{cases(sum.cases)}</td>
                      <td className="r">{usd(sum.gross)}</td>
                      <td className="r">{usd(sum.commission)}</td>
                      <td className="r">{usd(sum.charges)}</td>
                      <td className="r net">{usd(sum.net)}</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
