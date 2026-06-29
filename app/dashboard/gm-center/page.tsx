"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import GrowerCRM, { GROWERS as GROWER_RECORDS, type GrowerRecord } from "./GrowerCRM";
import ContractWorkspace, { type ContractSeed } from "./ContractWorkspace";
import "./gm-center.css";

/* =========================================================================
   Crown Jewels — GM Center
   Alejandro Bours' executive command dashboard. The whole operation on one
   page: the decisions that need him are at the top; everything below is the
   full picture (budget, credit, growers, systems, contracts).
   All data is seeded as const arrays; KPIs are computed from these constants.
   ========================================================================= */

/* ---- currency: big figures, no cents ($355,000) ---- */
const money0 = (n: number) =>
  "$" + Math.round(n).toLocaleString("en-US");

/* ---- Budget vs. actual — YTD through May (plan, actual) ---- */
type BudgetLine = { name: string; plan: number; actual: number };
const BUDGET: BudgetLine[] = [];
const budTotal = BUDGET.reduce((s, r) => s + r.plan, 0);
const actTotal = BUDGET.reduce((s, r) => s + r.actual, 0);
const totalVar = budTotal ? ((actTotal - budTotal) / budTotal) * 100 : 0;

/* ---- Credit facilities ---- */
type Facility = {
  name: string;
  who: string;
  meta: string;
  limit: number;
  used: number;
  balance?: boolean; // outstanding-balance facility (vs. revolving line)
};
const FACILITIES: Facility[] = [];
const availCredit = FACILITIES[0] ? FACILITIES[0].limit - FACILITIES[0].used : 0;

/* ---- Shared position numbers (PACA trust) ---- */
const owedGrowers = 0; // open grower settlements
const arOutstanding = 0; // customers owe us
const trustAssets = 0; // cash + receivables backing the trust
const pacaCoverage = owedGrowers ? trustAssets / owedGrowers : 0;

/* ---- Grower program (priority order; owed drives status) ---- */
type GrowerRow = {
  name: string;
  region: string;
  contract: string;
  contractWarn?: boolean;
  purchasesYTD: number;
  owed: number;
  daysLate: number; // >0 = past the prompt-pay window
};
const GROWERS: GrowerRow[] = [
  {
    name: "Rancho Thomas",
    region: "Caborca, Sonora · MX",
    contract: "Renewal — to sign",
    contractWarn: true,
    purchasesYTD: 0,
    owed: 0,
    daysLate: 0,
  },
  {
    name: "Agrícola del Valle",
    region: "Culiacán, Sinaloa · MX",
    contract: "Active 2025–26",
    purchasesYTD: 0,
    owed: 0,
    daysLate: 0,
  },
  {
    name: "Hortícola San Luis",
    region: "San Luis Río Colorado · MX",
    contract: "Draft",
    purchasesYTD: 0,
    owed: 0,
    daysLate: 0,
  },
];

/* ---- Grower purchasing (open POs) ---- */
type POStatus = "paid" | "over" | "invoiced" | "open";
type PORow = {
  po: string;
  item: string;
  amount: number;
  status: POStatus;
  label: string;
};
const POS: PORow[] = [];

/* ---- Systems & IT ---- */
type SysRow = { name: string; status: string; warn?: boolean };
const SYSTEMS: SysRow[] = [];

/* ---- Contracts & legal ---- */
type ContractStatus = "over" | "current" | "confirmed";
type ContractRow = {
  party: string;
  type: string;
  lang: string;
  renews: string;
  status: ContractStatus;
  label: string;
  note?: string;
};
const CONTRACTS: ContractRow[] = [
  {
    party: "Rancho Thomas",
    type: "Marketing & consignment",
    lang: "EN · ES",
    renews: "Jul 1, 2026",
    status: "confirmed",
    label: "Renewal — to sign",
    note: "Caborca, Sonora · awaiting your signature",
  },
  {
    party: "Agrícola del Valle",
    type: "Marketing & consignment",
    lang: "EN · ES",
    renews: "Jul 1, 2026",
    status: "current",
    label: "Active",
    note: "Culiacán, Sinaloa · executed Jul 2025",
  },
  {
    party: "Hortícola San Luis",
    type: "Marketing & consignment",
    lang: "EN · ES",
    renews: "New",
    status: "current",
    label: "In drafting",
    note: "San Luis Río Colorado · grape window",
  },
];

/* ---- Action queue — what needs Alejandro's decision today ---- */
type QueueFlag = "urgent" | "warn" | "ok";
type QueueItem = {
  id: string;
  flag: QueueFlag;
  title: string;
  sub: string;
  action: string;
  done: string; // inline confirmation once acted on
  kind?: "contract"; // a contract item opens the Contract Workspace
};
const QUEUE: QueueItem[] = [
  {
    id: "contract-rt-2026",
    flag: "urgent",
    kind: "contract",
    title: "Grower agreement — Rancho Thomas (2026 renewal)",
    sub: "Bilingual marketing & consignment draft is ready — awaiting your signature.",
    action: "Review & sign",
    done: "Signed — agreement with Rancho Thomas is executed.",
  },
];

// The decision-queue contract item maps to this grower record.
const RT_RECORD = GROWER_RECORDS.find((g) => g.id === "RT")!;

export default function GMCenterPage() {
  // Each acted-on item collapses to an inline confirmation (kept in the list so
  // Alejandro sees what he's already cleared today).
  const [acted, setActed] = useState<Record<string, boolean>>({});
  const acknowledge = (id: string) =>
    setActed((prev) => ({ ...prev, [id]: true }));

  // View: the GM Center home, or the full-page Contract Workspace. When a
  // grower's agreement is opened (from the CRM or the decision queue) we stash
  // its seed + the queue id it should resolve once Alejandro signs.
  const [view, setView] = useState<"home" | "contract">("home");
  const [activeSeed, setActiveSeed] = useState<ContractSeed | null>(null);
  const [activeQueueId, setActiveQueueId] = useState<string | null>(null);

  const openContract = (seed: ContractSeed, queueId?: string) => {
    setActiveSeed(seed);
    setActiveQueueId(queueId ?? null);
    setView("contract");
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  };
  const openAgreementFromCRM = (g: GrowerRecord) =>
    openContract(g.seed, g.id === "RT" ? "contract-rt-2026" : undefined);

  // A queue row's primary action. The contract item opens the workspace; a
  // plain item just acknowledges in place.
  const runQueueAction = (q: QueueItem) => {
    if (q.kind === "contract") {
      openContract(RT_RECORD.seed, q.id);
    } else {
      acknowledge(q.id);
    }
  };

  // Fired by the Contract Workspace whenever Alejandro signs/executes. Once
  // signed, the linked decision-queue item resolves (drops out of pending).
  const handleSigned = (status: "review" | "partial" | "changes" | "exec") => {
    if ((status === "partial" || status === "exec") && activeQueueId) {
      acknowledge(activeQueueId);
    }
  };

  // "Needs your decision" count = items not yet acted on. The banner counts the
  // urgent/warn ones (the ones that are genuinely waiting on a call).
  const pending = QUEUE.filter((q) => !acted[q.id]);
  const waitingN = pending.filter((q) => q.flag !== "ok").length;

  // KPIs computed from the seeded constants.
  const contractsToRenew = useMemo(
    () => CONTRACTS.filter((c) => c.status === "over" || c.status === "confirmed").length,
    []
  );
  const maxBud = useMemo(
    () =>
      BUDGET.length
        ? Math.max(...BUDGET.map((r) => Math.max(r.plan, r.actual)))
        : 0,
    []
  );

  // ---- Contract Workspace (full-page sub-view) ----
  if (view === "contract" && activeSeed) {
    return (
      <div className="cj-gm">
        <main>
          <ContractWorkspace
            seed={activeSeed}
            onBack={() => setView("home")}
            onSign={handleSigned}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="cj-gm">
      <main>
        {/* ---- Header ---- */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="gm-head"
        >
          <div>
            <div className="eyebrow">
              <span className="rule" />
              <span className="txt">Operations · June 2026</span>
            </div>
            <h1>
              Good morning, Alejandro<span className="accent">.</span>
            </h1>
            <p className="gm-sub">
              The whole operation on one page. The items that need your decision
              are at the top — everything below is the full picture across
              budget, credit, growers, systems and legal.
            </p>
          </div>
          <button
            className="gm-btn primary"
            onClick={() =>
              alert(
                "Exec packet compiled — budget vs. plan, credit summary, grower program & PACA position, ready as PDF."
              )
            }
          >
            Export exec packet
          </button>
        </motion.div>

        {/* ---- Status banner ---- */}
        <div className="gm-banner">
          <span className="ic" aria-hidden>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <div>
            <b>
              {`${waitingN} ${waitingN === 1 ? "item" : "items"} waiting`}
            </b>
            <span>
              Everything else — budget, credit, growers and systems — is running
              normally.
            </span>
          </div>
        </div>

        {/* ---- Needs your decision: action queue ---- */}
        <div className="gm-card gm-queue-card">
          <div className="gm-card-head">
            <h2>Needs your decision</h2>
            <span className="gm-ch-sub">
              {pending.length} open · most important first
            </span>
          </div>
          <div className="gm-queue">
            {QUEUE.length === 0 ? (
              <div className="gm-empty">Nothing yet.</div>
            ) : (
              QUEUE.map((q, i) => {
                const isDone = !!acted[q.id];
                return (
                  <div
                    key={q.id}
                    className={`gm-queue-row ${q.flag}${isDone ? " is-done" : ""}`}
                  >
                    <span className="gm-q-num">{isDone ? "✓" : i + 1}</span>
                    <span className="gm-q-tx">
                      <b>{q.title}</b>
                      <span>{isDone ? q.done : q.sub}</span>
                    </span>
                    {isDone ? (
                      <span className="gm-q-ack">Done</span>
                    ) : (
                      <button className="gm-q-act" onClick={() => runQueueAction(q)}>
                        {q.action}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ---- KPI strip (6) ---- */}
        <div className="gm-kpis">
          <KPI
            label="Spending vs. plan"
            value={`${totalVar <= 0 ? "−" : "+"}${Math.abs(totalVar).toFixed(1)}%`}
            cap={`${totalVar <= 0 ? "under" : "over"} budget so far this year`}
            tone={totalVar <= 0 ? "good" : "danger"}
          />
          <KPI
            label="Available to borrow"
            value={money0(availCredit)}
            cap="left on the bank line"
            tone="accent"
          />
          <KPI
            label="We owe growers"
            value={money0(owedGrowers)}
            cap="open settlements"
          />
          <KPI
            label="Customers owe us"
            value={money0(arOutstanding)}
            cap="open invoices"
          />
          <KPI
            label="PACA safety margin"
            value={`${pacaCoverage.toFixed(1)}×`}
            cap="assets covering grower funds"
            tone="good"
          />
          <KPI
            label="Contracts to renew"
            value={String(contractsToRenew)}
            cap="in the next 60 days"
          />
        </div>

        {/* ---- Budget vs. actual | Credit facilities ---- */}
        <div className="gm-two-col">
          <div className="gm-card">
            <div className="gm-card-head">
              <h2>Budget vs. actual</h2>
              <span className="gm-ch-sub">January through May</span>
            </div>
            <div className="gm-pad">
              <p className="gm-sec-note">
                Grey bar is the plan, green bar is what we actually spent. Red
                means over plan.
              </p>
              {BUDGET.length === 0 && <div className="gm-empty">Nothing yet.</div>}
              {BUDGET.map((r) => {
                const v = r.plan ? ((r.actual - r.plan) / r.plan) * 100 : 0;
                const over = v > 0;
                return (
                  <div className="gm-bud" key={r.name}>
                    <div className="gm-bud-top">
                      <b>{r.name}</b>
                      <span className={`gm-var-pill ${over ? "over" : "under"}`}>
                        {over ? "+" : "−"}
                        {Math.abs(v).toFixed(1)}%
                      </span>
                      <span className="gm-nums">
                        spent {money0(r.actual)} of {money0(r.plan)}
                      </span>
                    </div>
                    <div className="gm-bud-bars">
                      <span
                        className="gm-bb"
                        style={{ width: `${(r.plan / maxBud) * 100}%` }}
                      />
                      <span
                        className={`gm-bb a ${over ? "over" : ""}`}
                        style={{ width: `${(r.actual / maxBud) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="gm-card">
            <div className="gm-card-head">
              <h2>Credit facilities</h2>
              <span className="gm-ch-sub">{FACILITIES.length} agreements</span>
            </div>
            <div className="gm-pad">
              <p className="gm-sec-note">How much of each facility is in use today.</p>
              {FACILITIES.length === 0 && (
                <div className="gm-empty">Nothing yet.</div>
              )}
              {FACILITIES.map((f) => {
                const pct = f.limit ? (f.used / f.limit) * 100 : 0;
                return (
                  <div className="gm-fac" key={f.name}>
                    <b>{f.name}</b>
                    <div className="gm-fac-meta">
                      {f.who} · {f.meta}
                    </div>
                    <div className="gm-fac-bar">
                      <span style={{ width: `${pct}%` }} />
                    </div>
                    <div className="gm-fac-nums">
                      <span>
                        {f.balance ? "outstanding" : "in use"}: {money0(f.used)}
                      </span>
                      <span>
                        {f.balance ? "original" : "limit"}: {money0(f.limit)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ---- Grower program | Grower purchasing ---- */}
        <div className="gm-two-col">
          <div className="gm-card">
            <div className="gm-card-head">
              <h2>Grower program</h2>
              <span className="gm-ch-sub">
                contracts, purchases and what we owe each grower
              </span>
            </div>
            <div className="gm-table-scroll">
              <table className="gm-table">
                <thead>
                  <tr>
                    <th>Grower</th>
                    <th>Contract</th>
                    <th className="r">Purchases YTD</th>
                    <th className="r">We owe them</th>
                    <th className="r">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {GROWERS.length === 0 && (
                    <tr>
                      <td colSpan={5}>
                        <div className="gm-empty">Nothing yet.</div>
                      </td>
                    </tr>
                  )}
                  {GROWERS.map((g) => {
                    const st =
                      g.owed <= 0
                        ? { cls: "paid", txt: "Settled" }
                        : g.daysLate > 0
                          ? { cls: "over", txt: `${g.daysLate} days late` }
                          : { cls: "current", txt: "On schedule" };
                    return (
                      <tr key={g.name}>
                        <td>
                          <b>{g.name}</b>
                          <div className="gm-sub-line">{g.region}</div>
                        </td>
                        <td>
                          {g.contractWarn ? (
                            <span className="gm-var-pill over">{g.contract}</span>
                          ) : (
                            g.contract
                          )}
                        </td>
                        <td className="r amt">{money0(g.purchasesYTD)}</td>
                        <td className="r amt">{money0(g.owed)}</td>
                        <td className="r">
                          <span className={`gm-pill ${st.cls}`}>
                            <span className="pd" />
                            {st.txt}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="gm-card">
            <div className="gm-card-head">
              <h2>Grower purchasing</h2>
              <span className="gm-ch-sub">open purchase orders</span>
            </div>
            <div className="gm-table-scroll">
              <table className="gm-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Item</th>
                    <th className="r">Amount</th>
                    <th className="r">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {POS.length === 0 && (
                    <tr>
                      <td colSpan={4}>
                        <div className="gm-empty">Nothing yet.</div>
                      </td>
                    </tr>
                  )}
                  {POS.map((p) => (
                    <tr key={p.po}>
                      <td>
                        <span className="gm-mono">{p.po}</span>
                      </td>
                      <td>
                        <b>{p.item}</b>
                      </td>
                      <td className="r amt">{money0(p.amount)}</td>
                      <td className="r">
                        <span className={`gm-pill ${p.status}`}>
                          <span className="pd" />
                          {p.label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ---- Grower relationship management ---- */}
        <div className="gm-section-head">
          <div className="eyebrow">
            <span className="rule" />
            <span className="txt">Relationships</span>
          </div>
          <h2 className="gm-section-title">
            Managing the grower relationship
          </h2>
          <p className="gm-section-sub">
            The farmer side of the program — who they are, what they grow, their
            food-safety standing, the seasons we run together, and the state of
            each contract. Open an agreement to review, sign or send it.
          </p>
        </div>
        <div className="gm-crm-wrap">
          <GrowerCRM onOpenAgreement={openAgreementFromCRM} />
        </div>

        {/* ---- Systems & IT | Contracts & legal ---- */}
        <div className="gm-two-col">
          <div className="gm-card">
            <div className="gm-card-head">
              <h2>Systems &amp; IT</h2>
              <span className="gm-ch-sub">$0 of $0 monthly budget</span>
            </div>
            <div className="gm-pad">
              {SYSTEMS.length === 0 && <div className="gm-empty">Nothing yet.</div>}
              {SYSTEMS.map((s) => (
                <div className="gm-sys-row" key={s.name}>
                  <span className={`gm-sys-dot ${s.warn ? "warn" : ""}`} />
                  <span className="nm">{s.name}</span>
                  <span className="st">{s.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="gm-card">
            <div className="gm-card-head">
              <h2>Contracts &amp; legal</h2>
              <span className="gm-ch-sub">renewal watch</span>
            </div>
            <div className="gm-table-scroll">
              <table className="gm-table">
                <thead>
                  <tr>
                    <th>Party</th>
                    <th>Type</th>
                    <th>Language</th>
                    <th className="r">Renews</th>
                    <th className="r">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {CONTRACTS.length === 0 && (
                    <tr>
                      <td colSpan={5}>
                        <div className="gm-empty">Nothing yet.</div>
                      </td>
                    </tr>
                  )}
                  {CONTRACTS.map((c) => (
                    <tr key={c.party}>
                      <td>
                        <b>{c.party}</b>
                        {c.note && <div className="gm-sub-line">{c.note}</div>}
                      </td>
                      <td>{c.type}</td>
                      <td>
                        <span className="gm-lang">{c.lang}</span>
                      </td>
                      <td className="r">{c.renews}</td>
                      <td className="r">
                        <span className={`gm-pill ${c.status}`}>
                          <span className="pd" />
                          {c.label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ---- KPI card (.os-ar-metrics look) ---- */
function KPI({
  label,
  value,
  cap,
  tone,
}: {
  label: string;
  value: string;
  cap: string;
  tone?: "good" | "danger" | "accent";
}) {
  return (
    <div className={`gm-kpi ${tone ?? ""}`}>
      <div className="gm-kpi-label">{label}</div>
      <div className="gm-kpi-value">{value}</div>
      <div className="gm-kpi-cap">{cap}</div>
    </div>
  );
}
