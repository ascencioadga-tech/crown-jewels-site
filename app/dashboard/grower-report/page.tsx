"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  GROWERS,
  blockGross,
  blockUnits,
  blockChargesTotal,
  blockNet,
  growerGross,
  growerChargesTotal,
  growerUnits,
  growerNet,
  productBlocks,
  chargeBreakdown,
  sum,
  usd,
  usd2,
  qty,
  type Grower,
  type GrowerBlock,
} from "./data";
import { RANCHO_LOTS, type Lot } from "./growerLots";
import { GENERATED_GROWERS, GENERATED_LOTS } from "./settlement";
import { readAllPublished, type Published } from "./published";
import {
  useInboundUploads,
  lotStatus,
  lotCode,
  type Inbound,
} from "../inboundUploads";
import "./grower-report.css";

/** Settled liquidations for a grower come straight from the lot store —
    the moment the Settlement Sheet liquidates a lot, it lands here. */
const settledDate = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const EASE = [0.22, 1, 0.36, 1] as const;
const isAdvance = (label: string) => /liquidat|advance|draw|prepay/i.test(label);

type View = "dashboard" | "lots" | "statement";

export default function GrowerReportPage() {
  const [growerId, setGrowerId] = useState(GROWERS[0].id);
  const [view, setView] = useState<View>("dashboard");

  // Settlements published from La Libreta (override the seeded ones).
  const [published, setPublished] = useState<Record<string, Published>>({});
  useEffect(() => setPublished(readAllPublished()), []);

  const ALL_GROWERS = useMemo(() => {
    const map = new Map<string, Grower>([...GROWERS, ...GENERATED_GROWERS].map((g) => [g.id, g]));
    Object.values(published).forEach((p) => map.set(p.grower.id, p.grower));
    return [...map.values()];
  }, [published]);

  const grower = ALL_GROWERS.find((g) => g.id === growerId) || ALL_GROWERS[0];

  // Settled liquidations for this grower, straight from the lot store.
  const { uploads } = useInboundUploads();
  const growerSettled = useMemo(
    () =>
      uploads.filter(
        (l) => lotStatus(l) === "settled" && l.settlement && l.grower === grower.name
      ),
    [uploads, grower.name]
  );

  const lots =
    published[grower.id]?.lots ??
    (grower.id === "9136" ? RANCHO_LOTS : GENERATED_LOTS[grower.id] ?? []);
  const hasLots = lots.length > 0;
  const effView = view === "lots" && !hasLots ? "dashboard" : view;

  // Deep-link a grower via ?g=<id> (handy for demos).
  useEffect(() => {
    const g = new URLSearchParams(window.location.search).get("g");
    if (g && [...GROWERS, ...GENERATED_GROWERS].some((x) => x.id === g)) setGrowerId(g);
  }, []);

  const printPdf = () => window.print();

  return (
    <div className="cj-gr">

      <main className="gr-main">
        <header className="gr-head gr-noprint">
          <div className="gr-head-left">
            <label className="gr-select">
              <span>Grower</span>
              <select value={growerId} onChange={(e) => setGrowerId(e.target.value)}>
                {ALL_GROWERS.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} — #{g.id}
                  </option>
                ))}
              </select>
            </label>
            <div className="gr-grower-meta">
              <span className="gr-region">{grower.region}</span>
              <span className="gr-dot">·</span>
              <span>{grower.period}</span>
            </div>
          </div>
          <div className="gr-head-right">
            <div className="gr-toggle">
              <button className={effView === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}>
                Dashboard
              </button>
              {hasLots && (
                <button className={effView === "lots" ? "active" : ""} onClick={() => setView("lots")}>
                  Lots
                </button>
              )}
              <button className={effView === "statement" ? "active" : ""} onClick={() => setView("statement")}>
                Statement
              </button>
            </div>
            <button className="gr-pdf-btn" onClick={printPdf}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download PDF
            </button>
          </div>
        </header>

        {effView === "dashboard" && <Dashboard grower={grower} settled={growerSettled} />}
        {effView === "lots" && <LotsView lots={lots} />}
      </main>

      {/* Statement — shown on screen in statement view, always available to print */}
      <Statement grower={grower} shown={effView === "statement"} />
    </div>
  );
}

// ============================ DASHBOARD ============================
function Dashboard({ grower, settled }: { grower: Grower; settled: Inbound[] }) {
  const stats = useMemo(() => {
    const gross = growerGross(grower);
    const charges = growerChargesTotal(grower);
    const net = growerNet(grower);
    const units = growerUnits(grower);
    const advances = sum(
      grower.blocks.flatMap((b) => b.charges.filter((c) => isAdvance(c.label)).map((c) => c.amount))
    );
    const fees = charges - advances;
    const blocks = productBlocks(grower);
    const lines = sum(blocks.map((b) => b.products.length));
    return { gross, charges, net, units, advances, fees, blocks, lines };
  }, [grower]);

  const { gross, charges, net, units, advances, fees, blocks, lines } = stats;

  // Settled liquidations — the real settlement results, from the lot store.
  const liq = useMemo(() => {
    const s = settled.map((l) => l.settlement!);
    return {
      gross: sum(s.map((x) => x.gross)),
      commission: sum(s.map((x) => x.commission)),
      charges: sum(s.map((x) => x.charges)),
      net: sum(s.map((x) => x.net)),
      cases: sum(s.map((x) => x.soldCases)),
      count: settled.length,
    };
  }, [settled]);
  const hasBlocks = blocks.length > 0;
  const hasAny = hasBlocks || liq.count > 0;

  // Headline figures fold the (legacy) statement together with settlements.
  const totalNet = net + liq.net;
  const totalGross = gross + liq.gross;
  const totalCharges = charges + liq.commission + liq.charges;
  const totalUnits = units + liq.cases;
  const netZero = Math.abs(totalNet) < 1;

  const netCaption = netZero
    ? advances > 0
      ? "Settled — paid out via advances"
      : liq.count > 0
      ? "Fully liquidated"
      : "Nothing settled yet"
    : totalNet > 0
    ? "Net returned to you"
    : "Balance owed to Crown Jewels";

  const charged = chargeBreakdown(grower);
  const maxGross = Math.max(...blocks.map(blockGross), 1);
  const maxCharge = Math.max(...charged.map((c) => c.amount), 1);

  // settlement bar segments (% of gross)
  const seg = (v: number) => `${Math.max(0, (v / Math.max(gross, 1)) * 100)}%`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      {/* KPI cards */}
      <div className="gr-kpis">
        <Kpi
          hero
          label="Net Return"
          value={usd(totalNet)}
          caption={netCaption}
          tone={netZero ? "neutral" : totalNet > 0 ? "good" : "bad"}
          delay={0}
        />
        <Kpi
          label="Gross Sales"
          value={usd(totalGross)}
          caption={liq.count > 0 ? `${liq.count} lot${liq.count === 1 ? "" : "s"} settled` : `${blocks.length} commodities`}
          tone="plain"
          delay={0.05}
        />
        <Kpi
          label="Charges"
          value={usd(totalCharges)}
          caption={totalGross > 0 ? `${Math.round((totalCharges / totalGross) * 100)}% of gross` : "commission & charges"}
          tone="plain"
          delay={0.1}
        />
        <Kpi
          label={liq.count > 0 ? "Cases settled" : "Units Shipped"}
          value={qty(totalUnits)}
          caption={liq.count > 0 ? "liquidated to you" : `across ${lines} products`}
          tone="plain"
          delay={0.15}
        />
      </div>

      {/* Settled liquidations — straight from the Settlement Sheet */}
      {liq.count > 0 && (
        <section className="gr-card gr-liq">
          <div className="gr-card-head">
            <h3>Settled liquidations</h3>
            <span className="gr-card-sub">
              {liq.count} lot{liq.count === 1 ? "" : "s"} · {usd(liq.net)} net to you
            </span>
          </div>
          <div className="gr-liq-scroll">
            <table className="gr-liq-table">
              <thead>
                <tr>
                  <th>Lot</th>
                  <th>Settled</th>
                  <th className="r">Cases</th>
                  <th className="r">Gross</th>
                  <th className="r">Commission</th>
                  <th className="r">Charges</th>
                  <th className="r">Net to you</th>
                </tr>
              </thead>
              <tbody>
                {settled.map((l) => {
                  const s = l.settlement!;
                  return (
                    <tr key={l.id}>
                      <td className="mono">{lotCode(l)}</td>
                      <td className="dim">{settledDate(s.settledAt)}</td>
                      <td className="r">{qty(s.soldCases)}</td>
                      <td className="r">{usd(s.gross)}</td>
                      <td className="r dim">{usd(s.commission)}</td>
                      <td className="r dim">{usd(s.charges)}</td>
                      <td className="r net">{usd(s.net)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2}>Total liquidated</td>
                  <td className="r">{qty(liq.cases)}</td>
                  <td className="r">{usd(liq.gross)}</td>
                  <td className="r">{usd(liq.commission)}</td>
                  <td className="r">{usd(liq.charges)}</td>
                  <td className="r net">{usd(liq.net)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}

      {!hasAny && (
        <div className="gr-empty-state">
          No settlements yet for {grower.name}. The moment the Settlement Sheet
          liquidates one of this grower&apos;s lots, the result appears here.
        </div>
      )}

      {/* Settlement bar */}
      {hasBlocks && (
      <>
      {/* legacy statement charts */}
      <motion.section
        className="gr-card gr-settle"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
      >
        <div className="gr-card-head">
          <h3>Where your gross went</h3>
          <span className="gr-card-sub">{usd(gross)} gross sales</span>
        </div>
        <div className="gr-settle-bar">
          {net > 0 && <span className="seg net" style={{ width: seg(net) }} title={`Net return ${usd(net)}`} />}
          {advances > 0 && <span className="seg adv" style={{ width: seg(advances) }} title={`Advances paid ${usd(advances)}`} />}
          <span className="seg fee" style={{ width: seg(fees) }} title={`Fees ${usd(fees)}`} />
        </div>
        <div className="gr-settle-legend">
          {net > 0 && (
            <span><i className="sw net" /> Net return <b>{usd(net)}</b></span>
          )}
          {advances > 0 && (
            <span><i className="sw adv" /> Advances paid <b>{usd(advances)}</b></span>
          )}
          <span><i className="sw fee" /> Fees &amp; charges <b>{usd(fees)}</b></span>
        </div>
      </motion.section>

      {/* Two charts */}
      <div className="gr-two">
        <motion.section
          className="gr-card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.26, ease: EASE }}
        >
          <div className="gr-card-head">
            <h3>Gross sales by commodity</h3>
          </div>
          <div className="gr-bars">
            {blocks
              .slice()
              .sort((a, b) => blockGross(b) - blockGross(a))
              .map((b) => (
                <div className="gr-bar-row" key={b.code}>
                  <span className="gr-bar-label">{b.commodity}</span>
                  <span className="gr-bar-track">
                    <span className="gr-bar-fill" style={{ width: `${(blockGross(b) / maxGross) * 100}%`, background: b.accent }} />
                  </span>
                  <span className="gr-bar-val">{usd(blockGross(b))}</span>
                </div>
              ))}
          </div>
        </motion.section>

        <motion.section
          className="gr-card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.32, ease: EASE }}
        >
          <div className="gr-card-head">
            <h3>Charges breakdown</h3>
          </div>
          <div className="gr-bars">
            {charged.map((c) => (
              <div className="gr-bar-row" key={c.label}>
                <span className="gr-bar-label">{c.label}</span>
                <span className="gr-bar-track">
                  <span
                    className="gr-bar-fill"
                    style={{ width: `${(c.amount / maxCharge) * 100}%`, background: isAdvance(c.label) ? "#7a1f2b" : "#9a9ca1" }}
                  />
                </span>
                <span className="gr-bar-val">{usd(c.amount)}</span>
              </div>
            ))}
          </div>
        </motion.section>
      </div>

      {/* Commodity detail cards */}
      <motion.div
        className="gr-commodities"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.38, ease: EASE }}
      >
        {blocks.map((b) => (
          <CommodityCard key={b.code} block={b} />
        ))}
      </motion.div>
      </>
      )}
    </motion.div>
  );
}

function Kpi({
  label,
  value,
  caption,
  tone,
  hero,
  delay,
}: {
  label: string;
  value: string;
  caption: string;
  tone: "good" | "bad" | "neutral" | "plain";
  hero?: boolean;
  delay: number;
}) {
  return (
    <motion.div
      className={`gr-kpi ${hero ? "hero" : ""} tone-${tone}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: EASE }}
    >
      <span className="gr-kpi-label">{label}</span>
      <span className="gr-kpi-value">{value}</span>
      <span className="gr-kpi-caption">{caption}</span>
    </motion.div>
  );
}

function CommodityCard({ block }: { block: GrowerBlock }) {
  const gross = blockGross(block);
  const charges = blockChargesTotal(block);
  const net = blockNet(block);
  const units = blockUnits(block);
  return (
    <div className="gr-com-card">
      <div className="gr-com-head">
        <span className="gr-com-dot" style={{ background: block.accent }} />
        <h4>{block.commodity}</h4>
        <span className="gr-com-units">{qty(units)} units</span>
      </div>
      <table className="gr-com-table">
        <tbody>
          {block.products.map((p, i) => (
            <tr key={i}>
              <td className="gr-com-prod">{p.description}</td>
              <td className="num">{qty(p.invoiced)}</td>
              <td className="num">${p.avgPrice.toFixed(2)}</td>
              <td className="num strong">{usd(p.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="gr-com-foot">
        <span>Gross <b>{usd(gross)}</b></span>
        <span>Charges <b>{usd(charges)}</b></span>
        <span className={`gr-com-net ${net < 0 ? "neg" : ""}`}>Net <b>{usd(net)}</b></span>
      </div>
    </div>
  );
}

// ============================ STATEMENT (traditional) ============================
function Statement({ grower, shown }: { grower: Grower; shown: boolean }) {
  const gross = growerGross(grower);
  const charges = growerChargesTotal(grower);
  const net = growerNet(grower);

  return (
    <section className={`gr-statement ${shown ? "is-shown" : ""}`} aria-hidden={!shown}>
      <div className="gr-stmt-sheet">
        <header className="gr-stmt-head">
          <img src="/crown-jewels-logo.png" alt="" className="gr-stmt-logo" />
          <h1>Grower Activity Summary</h1>
          <p>Crown Jewels Produce Company, LLC</p>
          <div className="gr-stmt-grower">
            <span><strong>Grower:</strong> {grower.name}</span>
            <span><strong>ID:</strong> {grower.id}</span>
            <span><strong>Period:</strong> {grower.period}</span>
          </div>
        </header>

        <table className="gr-stmt-table">
          <thead>
            <tr>
              <th className="desc">Description</th>
              <th className="num">Rcvd Qnt</th>
              <th className="num">Shipd Qnt</th>
              <th className="num">Invcd Qnt</th>
              <th className="num">Avg Price</th>
              <th className="num">Amount</th>
            </tr>
          </thead>
          <tbody>
            {grower.blocks.map((b) => {
              const bg = blockGross(b);
              const bc = blockChargesTotal(b);
              const bn = blockNet(b);
              const bu = blockUnits(b);
              return (
                <BlockRows key={b.code} block={b} gross={bg} charges={bc} net={bn} units={bu} />
              );
            })}
            {/* Grand total */}
            <tr className="gr-stmt-grand">
              <td className="desc">Grand Total</td>
              <td className="num" colSpan={4}>Product / Charges / Net</td>
              <td className="num">
                <div>{usd2(gross)}</div>
                <div>{usd2(charges)}</div>
                <div className={net < 0 ? "neg" : ""}>{usd2(net)}</div>
              </td>
            </tr>
          </tbody>
        </table>

        <footer className="gr-stmt-foot">
          <span>{new Date(grower.statementDate + "T00:00:00").toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
          <span>Crown Jewels Produce Company, LLC</span>
        </footer>
      </div>
    </section>
  );
}

function BlockRows({
  block,
  gross,
  charges,
  net,
  units,
}: {
  block: GrowerBlock;
  gross: number;
  charges: number;
  net: number;
  units: number;
}) {
  return (
    <>
      <tr className="gr-stmt-block">
        <td colSpan={6}>
          <span className="gr-stmt-block-code">Block: {block.code}</span>
          {block.title}
        </td>
      </tr>
      {block.products.map((p, i) => (
        <tr key={`p${i}`}>
          <td className="desc">{p.description}</td>
          <td className="num">{p.rcvd ? qty(p.rcvd) : ""}</td>
          <td className="num">{p.shipped ? qty(p.shipped) : ""}</td>
          <td className="num">{p.invoiced ? qty(p.invoiced) : ""}</td>
          <td className="num">{p.avgPrice ? p.avgPrice.toFixed(2) : ""}</td>
          <td className="num">{usd2(p.amount)}</td>
        </tr>
      ))}
      {block.charges.map((c, i) => (
        <tr key={`c${i}`} className="gr-stmt-charge">
          <td className="desc">{c.label}</td>
          <td className="num" colSpan={3} />
          <td className="num">{c.pct ? c.pct.toFixed(2) : ""}</td>
          <td className="num">{usd2(c.amount)}</td>
        </tr>
      ))}
      <tr className="gr-stmt-totals">
        <td className="desc">Totals: {block.title}</td>
        <td className="num" colSpan={2} />
        <td className="num">{units ? qty(units) : ""}</td>
        <td className="num lbl">Net Return</td>
        <td className="num">
          <div>Product {usd2(gross)}</div>
          <div>Charges {usd2(charges)}</div>
          <div className={net < 0 ? "neg" : ""}>{usd2(net)}</div>
        </td>
      </tr>
    </>
  );
}

// ============================ LOTS (drill-down) ============================
const COM_ACCENT: Record<string, string> = {
  Cucumbers: "#4f5e36",
  "Roma Tomatoes": "#b03028",
  "Bell Peppers": "#4f8a39",
  "White Onions": "#b8bbc0",
  "Yellow Onions": "#7a1f2b",
  "Red Onions": "#9c2f33",
  Onions: "#9c2f33",
  "Charges & Advances": "#6b6a64",
};
const COM_ORDER = ["Cucumbers", "Roma Tomatoes", "Bell Peppers", "White Onions", "Yellow Onions", "Red Onions", "Onions", "Charges & Advances"];

function LotsView({ lots }: { lots: Lot[] }) {
  const groups = useMemo(() => {
    const m: Record<string, Lot[]> = {};
    lots.forEach((l) => {
      (m[l.commodity] = m[l.commodity] || []).push(l);
    });
    return Object.entries(m).sort((a, b) => {
      const ia = COM_ORDER.indexOf(a[0]);
      const ib = COM_ORDER.indexOf(b[0]);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
  }, [lots]);

  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => new Set(groups.length ? [groups[0][0]] : [])
  );
  const [openLot, setOpenLot] = useState<string | null>(null);
  const toggleGroup = (k: string) =>
    setOpenGroups((s) => {
      const n = new Set(s);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });

  const totalSale = lots.reduce((s, l) => s + l.sale, 0);
  const totalNet = lots.reduce((s, l) => s + l.net, 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <div className="gr-lots-note">
        <strong>Lot-level detail</strong> — every lot behind the statement. Transcribed from the PDF
        via OCR (best-effort); the summary figures stay authoritative.
      </div>
      <div className="gr-lots-summary">
        <span><b>{lots.length}</b> lots</span>
        <span><b>{usd(totalSale)}</b> gross</span>
        <span><b>{usd(totalNet)}</b> net</span>
      </div>

      {groups.map(([commodity, items]) => {
        const isOpen = openGroups.has(commodity);
        const gNet = items.reduce((s, l) => s + l.net, 0);
        return (
          <div className="gr-lotgroup" key={commodity}>
            <button className="gr-lotgroup-head" onClick={() => toggleGroup(commodity)}>
              <span className="gr-lg-dot" style={{ background: COM_ACCENT[commodity] || "#6b6a64" }} />
              <span className="gr-lg-name">{commodity}</span>
              <span className="gr-lg-count">{items.length} lots</span>
              <span className="gr-lg-net">{usd(gNet)} net</span>
              <span className={`gr-lg-chev ${isOpen ? "open" : ""}`}>▾</span>
            </button>
            {isOpen && (
              <div className="gr-lotrows">
                {items.map((l) => {
                  const units = l.products.reduce((s, p) => s + p.q, 0);
                  const expanded = openLot === l.code;
                  return (
                    <div className={`gr-lotrow ${expanded ? "exp" : ""}`} key={l.code}>
                      <button className="gr-lotrow-main" onClick={() => setOpenLot(expanded ? null : l.code)}>
                        <span className="gr-lot-code">{l.code}</span>
                        <span className="gr-lot-desc">
                          {l.products[0] ? l.products[0].d : l.charges[0] ? l.charges[0].l : "—"}
                        </span>
                        <span className="gr-lot-units">{units ? qty(units) : ""}</span>
                        <span className="gr-lot-sale">{usd(l.sale)}</span>
                        <span className="gr-lot-chg">{usd(l.charge)}</span>
                        <span className={`gr-lot-net ${l.net < 0 ? "neg" : ""}`}>{usd(l.net)}</span>
                        <span className={`gr-lot-chev ${expanded ? "open" : ""}`}>›</span>
                      </button>
                      {expanded && (
                        <div className="gr-lotdetail">
                          {l.products.length > 0 && (
                            <table className="gr-lotdetail-table">
                              <tbody>
                                {l.products.map((p, i) => (
                                  <tr key={"p" + i}>
                                    <td>{p.d}</td>
                                    <td className="num">{qty(p.q)}</td>
                                    <td className="num">${p.p.toFixed(2)}</td>
                                    <td className="num strong">{usd2(p.a)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                          {l.charges.length > 0 && (
                            <table className="gr-lotdetail-table charges">
                              <tbody>
                                {l.charges.map((c, i) => (
                                  <tr key={"c" + i}>
                                    <td>{c.l}</td>
                                    <td className="num">{usd2(c.a)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                          <div className="gr-lotdetail-foot">
                            <span>Gross <b>{usd2(l.sale)}</b></span>
                            <span>Charges <b>{usd2(l.charge)}</b></span>
                            <span className={l.net < 0 ? "neg" : ""}>Net <b>{usd2(l.net)}</b></span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </motion.div>
  );
}
