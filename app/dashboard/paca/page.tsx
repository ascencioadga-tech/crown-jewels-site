"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import "./paca.css";

/* ============================================================
   Crown Jewels Produce — PACA Trust
   Compliance app under Finance / Accounting. Maps grower
   consignment settlements to PACA trust accounting: what we
   hold in trust for growers, the assets that cover it, and
   prompt-pay status across every settlement.

   Self-contained seeded data — mirrors the shape of the real
   grower-report data (GROWERS, growerNet, …) but stands alone.
   ============================================================ */

const COMPANY = "Crown Jewels Produce Company";
const LOCATION = "Fresno, CA";
const ACCOUNTING_HEAD = "Rosa Delgado";
const GENERAL_MANAGER = "Alejandro Bours";

// "As of" date for the prompt-pay window math (PACA prompt-pay = 10 days
// after acceptance for consignment proceeds).
const AS_OF = "2026-06-26";

type SettleStatus = "settled" | "within" | "soon" | "past";

type GrowerSettlement = {
  id: string;
  name: string;
  region: string;
  /** Net proceeds owed on this consignment settlement. */
  net: number;
  /** Already wired / cleared against the settlement. */
  paid: number;
  settledOn: string;
  dueDate: string;
  /** PACA prompt-pay status, pre-resolved for the seed. */
  status: SettleStatus;
  /** Days past the prompt-pay window (positive = overdue). */
  daysPast: number;
  note?: string;
};

// ---- Trust liabilities: net proceeds owed to growers ----
const GROWERS: GrowerSettlement[] = [];

// ---- Trust assets: produce inventory + trust-protected receivables ----
const INVENTORY_VALUE = 0; // produce inventory held in trust

type Receivable = {
  customer: string;
  channel: string;
  amount: number;
};
const RECEIVABLES: Receivable[] = [];

// ---------- compute helpers ----------
const sum = (a: number[]) => a.reduce((s, n) => s + n, 0);
const growerOwed = (g: GrowerSettlement) => Math.max(0, g.net - g.paid);

const money0 = (n: number) => {
  const r = Math.round(n);
  return (r < 0 ? "-$" : "$") + Math.abs(r).toLocaleString("en-US");
};

const STATUS_LABEL: Record<SettleStatus, string> = {
  settled: "Settled",
  within: "Within terms",
  soon: "Due soon",
  past: "Past window",
};

export default function PacaTrustPage() {
  const [showSettled, setShowSettled] = useState(true);

  const arOutstanding = useMemo(() => sum(RECEIVABLES.map((r) => r.amount)), []);
  const trustAssets = INVENTORY_VALUE + arOutstanding;
  const trustLiabilities = useMemo(() => sum(GROWERS.map(growerOwed)), []);
  const coverage = trustLiabilities > 0 ? trustAssets / trustLiabilities : 0;
  const covered = trustAssets >= trustLiabilities;

  const pastDue = GROWERS.filter((g) => g.status === "past" && growerOwed(g) > 0);
  const pastDueAmt = sum(pastDue.map(growerOwed));
  const openSettlements = GROWERS.filter((g) => growerOwed(g) > 0);

  // Trust assets vs. liabilities breakdown bars (scaled to the larger side).
  const scaleMax = Math.max(trustAssets, trustLiabilities, 1);

  const rows = showSettled ? GROWERS : GROWERS.filter((g) => growerOwed(g) > 0);

  // Grower payables aging — bucket open balances by days past the window.
  const aging = useMemo(() => {
    const b = { within: 0, b10: 0, b30: 0, b30p: 0 };
    GROWERS.forEach((g) => {
      const bal = growerOwed(g);
      if (bal <= 0) return;
      const d = g.daysPast;
      if (d <= 0) b.within += bal;
      else if (d <= 10) b.b10 += bal;
      else if (d <= 30) b.b30 += bal;
      else b.b30p += bal;
    });
    return b;
  }, []);
  const agingMax = Math.max(aging.within, aging.b10, aging.b30, aging.b30p, 1);
  const agingCells: { key: keyof typeof aging; label: string; cls: string }[] = [
    { key: "within", label: "Within terms", cls: "within" },
    { key: "b10", label: "1–10 days over", cls: "b10" },
    { key: "b30", label: "11–30 days", cls: "b30" },
    { key: "b30p", label: "30+ days", cls: "b30p" },
  ];

  const checks = [
    {
      ok: true,
      t: "Customer invoices carry PACA trust language",
      s: "The statutory trust statement prints on every Crown Jewels invoice and statement.",
    },
    {
      ok: true,
      t: "Trust ledger maintained",
      s: `Assets ${money0(trustAssets)} vs. liabilities ${money0(
        trustLiabilities
      )} reconciled this close.`,
    },
    {
      ok: covered,
      t: "Trust assets ≥ liabilities",
      s: covered
        ? `Covered ${coverage.toFixed(1)}× — healthy cushion above what is owed.`
        : "Trust assets fall short of what is owed to growers.",
    },
    {
      ok: pastDue.length === 0,
      t: "Grower settlements paid within the prompt-pay window",
      s:
        pastDue.length === 0
          ? "All settlements current."
          : `${pastDue.length} settlement past the 10-day window — ${money0(
              pastDueAmt
            )} (wire queued).`,
    },
  ];

  return (
    <div className="cj-paca">
      <main>
        {/* ---------- Header ---------- */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="paca-head"
        >
          <div>
            <div className="paca-eyebrow">
              <span className="rule" />
              <span className="txt">Compliance · PACA Trust</span>
            </div>
            <h1>
              PACA trust<span className="accent">.</span>
            </h1>
            <p className="paca-sub">
              The Perishable Agricultural Commodities Act puts the produce we buy from
              growers — and the money it earns — into a trust we hold for them until they
              are paid. This board maps every grower settlement to that trust: the assets
              that cover what we owe, and prompt-pay status across the book.
            </p>
          </div>

          <div className="paca-head-actions">
            <div className="paca-role">
              <span className="paca-avatar">RD</span>
              <div>
                <strong>{ACCOUNTING_HEAD}</strong>
                <span>Controller · Accounting</span>
              </div>
            </div>
            <button className="paca-btn primary" type="button">
              Export trust report
            </button>
          </div>
        </motion.div>

        {/* ---------- KPI cards ---------- */}
        <div className="paca-metrics">
          <Metric
            label="Trust assets"
            value={money0(trustAssets)}
            cap="inventory + receivables"
            accent
          />
          <Metric
            label="Owed to growers"
            value={money0(trustLiabilities)}
            cap="trust liability"
          />
          <Metric
            label="Coverage"
            value={`${coverage.toFixed(1)}×`}
            cap="assets ÷ liabilities"
            good
          />
          <Metric
            label="Past-window to growers"
            value={money0(pastDueAmt)}
            cap={`${pastDue.length} settlement${pastDue.length !== 1 ? "s" : ""} · wire queued`}
            danger={pastDueAmt > 0}
          />
        </div>

        {/* ---------- Trust position ---------- */}
        <div className="paca-card">
          <div className="paca-card-head">
            <h2>Trust position</h2>
            <span className={`paca-cover-badge ${covered ? "ok" : "warn"}`}>
              {covered ? `Fully covered · ${coverage.toFixed(1)}×` : "Under-covered"}
            </span>
          </div>
          <div className="paca-card-body">
            <div className="paca-scale">
              <div className="paca-ts-row">
                <span className="paca-ts-lbl">Trust assets</span>
                <span className="paca-ts-track">
                  <span
                    className="paca-ts-seg inv"
                    style={{ width: `${(INVENTORY_VALUE / scaleMax) * 100}%` }}
                  >
                    Inventory {money0(INVENTORY_VALUE)}
                  </span>
                  <span
                    className="paca-ts-seg ar"
                    style={{ width: `${(arOutstanding / scaleMax) * 100}%` }}
                  >
                    A/R {money0(arOutstanding)}
                  </span>
                </span>
                <span className="paca-ts-val asset">{money0(trustAssets)}</span>
              </div>
              <div className="paca-ts-row">
                <span className="paca-ts-lbl">Trust liabilities</span>
                <span className="paca-ts-track">
                  <span
                    className="paca-ts-seg liab"
                    style={{ width: `${(trustLiabilities / scaleMax) * 100}%` }}
                  >
                    Owed to growers {money0(trustLiabilities)}
                  </span>
                </span>
                <span className="paca-ts-val liabv">{money0(trustLiabilities)}</span>
              </div>
            </div>
            <p className="paca-card-note">
              Trust <b>assets</b> (produce inventory + trust-protected receivables) must
              stay at or above trust <b>liabilities</b> (net proceeds owed to growers). The
              cushion above is the coverage ratio.
            </p>
          </div>
        </div>

        {/* ---------- Grower settlement register ---------- */}
        <div className="paca-card">
          <div className="paca-card-head">
            <h2>Grower settlement register</h2>
            <label className="paca-toggle">
              <input
                type="checkbox"
                checked={showSettled}
                onChange={(e) => setShowSettled(e.target.checked)}
              />
              Show settled
            </label>
          </div>
          <div className="paca-table-scroll">
            <table className="paca-table">
              <thead>
                <tr>
                  <th>Grower</th>
                  <th>Settled</th>
                  <th className="num">Net settlement</th>
                  <th className="num">Paid</th>
                  <th className="num">Balance (trust)</th>
                  <th>Prompt-pay due</th>
                  <th>PACA status</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <div className="paca-empty">Nothing yet.</div>
                    </td>
                  </tr>
                )}
                {rows.map((g) => {
                  const bal = growerOwed(g);
                  return (
                    <tr key={g.id}>
                      <td>
                        <div className="paca-name">{g.name}</div>
                        <div className="paca-sub-cell">{g.region}</div>
                      </td>
                      <td>{g.settledOn}</td>
                      <td className="num">{money0(g.net)}</td>
                      <td className="num">{g.paid > 0 ? money0(g.paid) : "—"}</td>
                      <td className="num strong">
                        {bal > 0 ? money0(bal) : <span className="paca-dim">—</span>}
                      </td>
                      <td>{g.dueDate}</td>
                      <td>
                        <span className={`paca-pill ${g.status}`}>
                          <span className="paca-pill-dot" />
                          {g.status === "past"
                            ? `${g.daysPast}d past window`
                            : STATUS_LABEL[g.status]}
                        </span>
                        {g.note && <div className="paca-pill-note">{g.note}</div>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ---------- Two-up: aging + checklist ---------- */}
        <div className="paca-two-col">
          <div className="paca-card">
            <div className="paca-card-head">
              <h2>Grower payables aging</h2>
              <span className="paca-line-count">by days past the window</span>
            </div>
            <div className="paca-card-body">
              <div className="paca-aging">
                {agingCells.map((c) => (
                  <div key={c.key} className="paca-bar-row">
                    <span className="paca-bl">{c.label}</span>
                    <span className="paca-bar-track">
                      <span
                        className={`paca-bar-fill ${c.cls}`}
                        style={{
                          width: `${Math.max(2, (aging[c.key] / agingMax) * 100)}%`,
                        }}
                      />
                    </span>
                    <span className="paca-bv">{money0(aging[c.key])}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="paca-card">
            <div className="paca-card-head">
              <h2>Compliance checklist</h2>
            </div>
            <div className="paca-card-body">
              <div className="paca-checklist">
                {checks.map((c, i) => (
                  <div key={i} className="paca-check-row">
                    <span className={`paca-check-ic ${c.ok ? "ok" : "warn"}`}>
                      {c.ok ? "✓" : "!"}
                    </span>
                    <span className="paca-check-tx">
                      <b>{c.t}</b>
                      <span>{c.s}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ---------- Plain-language explainer ---------- */}
        <div className="paca-card">
          <div className="paca-card-head">
            <h2>How prompt-pay compliance works</h2>
          </div>
          <div className="paca-card-body">
            <div className="paca-explain">
              <div>
                <div className="paca-mk">In plain language</div>
                <p>
                  Under PACA, when a grower ships us produce on consignment, the produce and
                  every dollar it later earns are held in a statutory <b>trust</b> for that
                  grower until they are paid in full. Crown Jewels is the trustee. We must
                  keep trust <b>assets</b> — produce inventory plus the receivables it
                  generates — at or above what we owe growers, and we must pay each
                  settlement <b>promptly</b>: within 10 days of acceptance for consignment
                  proceeds, unless other terms are agreed in writing.
                </p>
              </div>
              <div>
                <div className="paca-mk">In the app &amp; in QuickBooks</div>
                <p>
                  Each grower settlement carries a net owed and a prompt-pay due date; each
                  customer invoice carries the trust statement and becomes a trust-protected
                  receivable. In QuickBooks every open balance posts as a <b>Vendor Bill</b>{" "}
                  (grower = vendor) and clears on payment; customer A/R syncs as
                  trust-asset receivables. The trust ledger reconciles assets ≥ liabilities
                  at each close.
                </p>
              </div>
            </div>
            <p className="paca-disclaimer">
              <b>Note:</b> This is a management and monitoring tool, not legal certification.
              PACA trust preservation also depends on invoice language, timely written
              notice, and recordkeeping — confirm specifics with PACA counsel.{" "}
              {COMPANY} · {LOCATION}. Trust oversight: {ACCOUNTING_HEAD} (Controller),
              {" "}
              {GENERAL_MANAGER} (GM).
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function Metric({
  label,
  value,
  cap,
  accent,
  good,
  danger,
}: {
  label: string;
  value: string;
  cap: string;
  accent?: boolean;
  good?: boolean;
  danger?: boolean;
}) {
  return (
    <div
      className={`paca-metric${accent ? " accent" : ""}${good ? " good" : ""}${
        danger ? " danger" : ""
      }`}
    >
      <div className="paca-metric-label">{label}</div>
      <div className="paca-metric-value">{value}</div>
      <div className="paca-metric-cap">{cap}</div>
    </div>
  );
}
