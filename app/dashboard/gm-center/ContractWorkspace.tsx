"use client";

/* ============================================================
   Crown Jewels — Contract Workspace

   A full bilingual contract review surface for the grower
   "Marketing & Consignment Agreement", modeled 1:1 on Chucho's
   contract.html: a status bar (In review / Awaiting signature /
   Changes requested / Executed), a what-changed summary, a
   2-column layout (the document 1fr + a sticky 360px
   collaboration panel), the DOCUMENT (centered letterhead +
   bilingual title + parties; a two-column EN | ES clause body;
   signature blocks with a Caveat sign-name + pending/signed
   tags & dates; a footer), and the COLLABORATION PANEL (a Sign
   CTA, Send for signature, Request changes; a participants list;
   an activity thread; a comment composer).

   Sign actually works: stamping Alejandro's Caveat signature,
   logging a "signed" event, flipping the status, and — once both
   parties have signed — marking the agreement Executed. The
   parent (GM Center) is told via onSign so the decision-queue
   item resolves. Pure CSS, React state; rethemed to CJ maroon.
   ============================================================ */

import { useState } from "react";
import "./contract-workspace.css";

const ME = "Alejandro Bours";

/* ---------- The agreement Alejandro is reviewing ---------- */
export type ContractSeed = {
  growerName: string;
  growerRegion: string;
  growerSigner: string; // grower's authorized signer
  growerSignerRole: string;
  growerInitials: string;
};

/* ---------- Bilingual clause body (EN | ES) ---------- */
type Clause = { t: string; es: string; en: string; esT: string };
const CLAUSES: Clause[] = [
  {
    t: "1. Term & season",
    es: "Vigencia y temporada",
    en: "This agreement runs from July 1, 2026 through June 30, 2027 and renews for successive one-season terms unless either party gives written notice sixty (60) days before the end of the then-current season.",
    esT: "El presente convenio estará vigente del 1 de julio de 2026 al 30 de junio de 2027 y se renovará por temporadas sucesivas de un año, salvo aviso por escrito de cualquiera de las partes con sesenta (60) días de anticipación al término de la temporada en curso.",
  },
  {
    t: "2. Commodities & programs",
    es: "Productos y programas",
    en: "The Grower will deliver cucumbers, Roma tomatoes and bell peppers grown under Crown Jewels year-round programs, with a season plan of sixty-eight thousand (68,000) cases. The plan is a good-faith estimate, reviewed monthly against the program calendar by both parties.",
    esT: "El Productor entregará pepino, tomate Roma y pimiento morrón cultivados bajo los programas todo-el-año de Crown Jewels, con un plan de temporada de sesenta y ocho mil (68,000) cajas. El plan es un estimado de buena fe, revisado mensualmente contra el calendario de programa por ambas partes.",
  },
  {
    t: "3. Marketing & consignment",
    es: "Comercialización y consignación",
    en: "Product is received on consignment. Crown Jewels will market the product grower-direct under its retail and foodservice programs and act as the Grower's exclusive marketing agent for the commodities and regions named above during the term.",
    esT: "El producto se recibe en consignación. Crown Jewels comercializará el producto en venta directa de productor bajo sus programas de retail y servicio de alimentos, y actuará como agente de comercialización exclusivo del Productor para los productos y regiones señalados durante la vigencia.",
  },
  {
    t: "4. Commission & charges",
    es: "Comisión y cargos",
    en: "Crown Jewels will deduct a sales commission of eight percent (8%) of gross sales plus the charges listed in Schedule A (cold storage $0.58/case, USDA inspection, repack, palletizing and packing supplies at cost), and remit the net proceeds with a lot-level settlement statement.",
    esT: "Crown Jewels descontará una comisión de venta del ocho por ciento (8%) sobre la venta bruta más los cargos del Anexo A (frío $0.58/caja, inspección USDA, reempaque, paletizado y material de empaque a costo), y entregará el neto junto con una liquidación detallada por lote.",
  },
  {
    t: "5. Settlement & PACA",
    es: "Liquidación y PACA",
    en: "Net proceeds are payable within ten (10) days of final settlement of each lot, consistent with the Perishable Agricultural Commodities Act. Both parties expressly preserve their trust rights and obligations under PACA. Crown Jewels may advance up to fifty thousand dollars (USD $50,000) per month against in-season deliveries, recovered from settlement before net remittance.",
    esT: "El neto se pagará dentro de los diez (10) días siguientes a la liquidación final de cada lote, conforme a la Ley de Productos Agrícolas Perecederos (PACA). Ambas partes preservan expresamente sus derechos y obligaciones de fideicomiso bajo PACA. Crown Jewels podrá anticipar hasta cincuenta mil dólares (USD $50,000) por mes contra entregas de la temporada, recuperados de la liquidación antes de la entrega del neto.",
  },
  {
    t: "6. Food safety & PrimusGFS",
    es: "Inocuidad y PrimusGFS",
    en: "The Grower will maintain current PrimusGFS / GAP certification and lot-level traceability records for the full term. Product not meeting grade at receiving may be reconditioned, regraded or rejected, with photographic evidence shared the same day at the Nogales crossing.",
    esT: "El Productor mantendrá vigente su certificación PrimusGFS / GAP y registros de trazabilidad por lote durante toda la vigencia. El producto fuera de grado al recibo podrá reacondicionarse, reclasificarse o rechazarse, compartiendo evidencia fotográfica el mismo día en el cruce de Nogales.",
  },
  {
    t: "7. Exclusivity & termination",
    es: "Exclusividad y terminación",
    en: "During the term the Grower will market the named commodities exclusively through Crown Jewels. Either party may terminate for uncured material breach on thirty (30) days' written notice; obligations for product already shipped survive termination.",
    esT: "Durante la vigencia el Productor comercializará los productos señalados exclusivamente a través de Crown Jewels. Cualquiera de las partes podrá terminar por incumplimiento material no subsanado con aviso por escrito de treinta (30) días; las obligaciones por producto ya embarcado subsisten a la terminación.",
  },
  {
    t: "8. Governing law",
    es: "Ley aplicable",
    en: "This agreement is governed by the laws of the State of Arizona and applicable federal law. The parties will seek good-faith resolution before any formal proceeding; the English version controls in case of conflict.",
    esT: "Este convenio se rige por las leyes del Estado de Arizona y la ley federal aplicable. Las partes buscarán una solución de buena fe antes de cualquier procedimiento formal; en caso de conflicto prevalece la versión en inglés.",
  },
];

/* ---------- People on the review ---------- */
type Party = {
  id: string;
  name: string;
  role: string;
  access: string; // "Signer" / "Signer (grower)" / "Reviewer" / "Viewer"
  you?: boolean;
  signed: boolean;
  signedAt?: string;
  c: string; // avatar color
};

/* ---------- Activity thread ---------- */
type EvType = "system" | "edit" | "comment" | "revision" | "sign";
type Ev = { type: EvType; who: string; t: string; x: string };

type Status = "review" | "partial" | "changes" | "exec";

const initials = (n: string) =>
  n
    .split(" ")
    .filter((w) => /[A-Za-zÀ-ÿ]/.test(w[0] ?? ""))
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

const today = () =>
  new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });

/* ---------- Icons (Heroicons paths, matching Chucho) ---------- */
const PATHS: Record<string, string> = {
  pen: "M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32l8.4-8.4z",
  check: "M4.5 12.75l6 6 9-13.5",
  send: "M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5",
  back: "M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3",
  user: "M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z",
};
function Icon({ n, w = 17 }: { n: string; w?: number }) {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
      style={{ width: w, height: w }}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={PATHS[n]} />
    </svg>
  );
}

export default function ContractWorkspace({
  seed,
  onBack,
  onSign,
}: {
  seed: ContractSeed;
  onBack: () => void;
  /** Fired whenever Alejandro signs/executes so the parent's decision queue can resolve. */
  onSign?: (status: Status) => void;
}) {
  const [parties, setParties] = useState<Party[]>([
    {
      id: "ab",
      name: ME,
      role: "General Manager · Crown Jewels",
      access: "Signer",
      you: true,
      signed: false,
      c: "#7a1f2b",
    },
    {
      id: "mz",
      name: "Marisol Zamora",
      role: "Controller · Crown Jewels",
      access: "Reviewer",
      signed: false,
      c: "#4f5e36",
    },
    {
      id: "rd",
      name: "Ricardo Duarte",
      role: "Grower Programs · Crown Jewels",
      access: "Reviewer",
      signed: false,
      c: "#8a5a2b",
    },
    {
      id: "gr",
      name: seed.growerSigner,
      role: `${seed.growerName} · ${seed.growerRegion}`,
      access: "Signer (grower)",
      signed: false,
      c: "#511319",
    },
  ]);

  const [activity, setActivity] = useState<Ev[]>([
    {
      type: "system",
      who: "System",
      t: "Jun 6",
      x: `Renewal draft v2 generated from the ${seed.growerName} agreement dated July 1, 2023, as amended.`,
    },
    {
      type: "edit",
      who: "Marisol Zamora",
      t: "Jun 9",
      x: "Updated cold storage to $0.58/case and the season plan to 68,000 cases.",
    },
    {
      type: "comment",
      who: "Ricardo Duarte",
      t: "Jun 11",
      x: "Calendar lines up with the year-round program. Confirm the advance cap stays at $50K/month before you sign.",
    },
  ]);

  const [status, setStatus] = useState<Status>("review");
  const [comment, setComment] = useState("");
  const [signOpen, setSignOpen] = useState(false);
  const [signName, setSignName] = useState(ME);

  const signers = parties.filter((p) => p.access.startsWith("Signer"));
  const me = parties.find((p) => p.you)!;
  const grower = parties.find((p) => p.id === "gr")!;

  /* derived status — "changes" is sticky until re-signed */
  function statusInfo(): { cls: string; txt: string } {
    if (status === "changes") return { cls: "changes", txt: "Changes requested" };
    const done = signers.filter((p) => p.signed).length;
    if (signers.length && done === signers.length)
      return { cls: "exec", txt: "Executed" };
    if (done > 0)
      return {
        cls: "partial",
        txt: `Awaiting ${signers.length - done} signature${
          signers.length - done > 1 ? "s" : ""
        }`,
      };
    return { cls: "review", txt: "In review" };
  }
  const si = statusInfo();

  function log(ev: Ev) {
    setActivity((a) => [...a, ev]);
  }

  /* ---- Sign: stamp Alejandro's signature, log it, flip status ---- */
  function applySign() {
    const name = signName.trim() || ME;
    const at = today();
    setParties((ps) =>
      ps.map((p) => (p.you ? { ...p, name, signed: true, signedAt: at } : p))
    );
    setSignOpen(false);
    log({ type: "sign", who: name, t: at, x: "Signed the agreement." });
    // recompute status with me now signed
    const bothSigned = grower.signed; // grower already signed?
    const next: Status = bothSigned ? "exec" : "partial";
    setStatus(next);
    onSign?.(next);
  }

  /* ---- Send to grower → they countersign → Executed ---- */
  function sendForSignature() {
    log({
      type: "system",
      who: "System",
      t: today(),
      x: `Sent to ${seed.growerName} (${seed.growerSigner}) for countersignature.`,
    });
    setTimeout(() => {
      const at = today();
      setParties((ps) =>
        ps.map((p) => (p.id === "gr" ? { ...p, signed: true, signedAt: at } : p))
      );
      log({ type: "sign", who: grower.name, t: at, x: "Countersigned the agreement." });
      setStatus("exec");
      onSign?.("exec");
    }, 2400);
  }

  /* ---- Request changes ---- */
  const [revOpen, setRevOpen] = useState(false);
  const [revNote, setRevNote] = useState("");
  const [revTo, setRevTo] = useState("Marisol Zamora (drafting)");
  function submitRevision() {
    const note = revNote.trim();
    if (!note) return;
    setStatus("changes");
    setRevOpen(false);
    setRevNote("");
    log({
      type: "revision",
      who: ME,
      t: today(),
      x: `Requested changes → ${revTo}: “${note}”`,
    });
  }

  function addComment() {
    const x = comment.trim();
    if (!x) return;
    setComment("");
    log({ type: "comment", who: ME, t: today(), x });
  }

  const executed = si.cls === "exec";

  return (
    <div className="cw">
      {/* ---- page head ---- */}
      <div className="cw-head">
        <div className="eyebrow">
          <span className="rule" />
          <span className="txt">Contracts &amp; legal</span>
        </div>
        <h1>
          Grower agreement — renewal<span className="accent">.</span>
        </h1>
        <p className="cw-sub">
          {seed.growerName} · {seed.growerRegion}. The bilingual 2026–2027 draft
          is ready for your review. Read the language, add people to the review,
          sign it, or send it back with notes.
        </p>
      </div>

      {/* ---- status bar ---- */}
      <div className="cw-bar">
        <span className={`cw-status ${si.cls}`}>
          <span className="d" />
          {si.txt}
        </span>
        <span className="cw-meta">
          Draft v2 · prepared by Marisol Zamora · renews Jul 1, 2026
        </span>
        <div className="cw-right">
          <button className="cw-gbtn" onClick={onBack}>
            ← Back to growers
          </button>
        </div>
      </div>

      {/* ---- what changed ---- */}
      <div className="cw-changes">
        <h2>What changed from last season</h2>
        <ul>
          <li>
            Term renews <b>Jul 1, 2026 – Jun 30, 2027</b> (one season;
            auto-renewal clause unchanged).
          </li>
          <li>
            Season plan set to <b>68,000 cases</b> across cucumbers, Roma and
            bell peppers under the year-round program.
          </li>
          <li>
            Cold storage updated to <b>$0.58 per case</b>; commission unchanged
            at <b>8%</b>.
          </li>
          <li>
            Advance cap unchanged at <b>$50,000 per month</b>; settlement timing
            unchanged (10 days, PACA).
          </li>
        </ul>
      </div>

      {/* ---- layout: document + collaboration ---- */}
      <div className="cw-layout">
        {/* ============ DOCUMENT ============ */}
        <div className="cw-doc">
          <div className="cw-doc-rule" />
          <div className="cw-doc-inner">
            <div className="cw-doc-head">
              <div className="cw-letterhead">
                Crown <span className="cw-j">Jewels</span>
              </div>
              <h2>Grower marketing &amp; consignment agreement</h2>
              <div className="es">
                Convenio de comercialización y consignación con el productor
              </div>
              <div className="cw-parties">
                <span>
                  <b>Marketer:</b> Crown Jewels Produce — Nogales, AZ
                </span>
                <span>
                  <b>Grower / Productor:</b> {seed.growerName} —{" "}
                  {seed.growerRegion}
                </span>
              </div>
              <p className="cw-doc-note">
                Season 2026–2027 · Renewal of the agreement dated July 1, 2023,
                as amended
              </p>
            </div>

            <div className="cw-lang-head">
              <span>English</span>
              <span>Español</span>
            </div>

            {CLAUSES.map((c) => (
              <div className="cw-clause" key={c.t}>
                <h3>
                  {c.t} <span className="es">· {c.es}</span>
                </h3>
                <div className="cw-cl-grid">
                  <p>{c.en}</p>
                  <p className="es">{c.esT}</p>
                </div>
              </div>
            ))}

            {/* ---- signature blocks (both parties) ---- */}
            <div className="cw-sig">
              {signers.map((p) => (
                <div className="cw-sig-box" key={p.id}>
                  {p.signed ? (
                    <span className="cw-signed-tag">Signed</span>
                  ) : (
                    <span className="cw-pend">Awaiting signature</span>
                  )}
                  <div className="cw-sig-line">
                    {p.signed && <span className="cw-sign-name">{p.name}</span>}
                  </div>
                  <b>{p.name}</b>
                  <span>{p.role}</span>
                  {p.signed && p.signedAt && (
                    <div className="cw-sig-dt">Signed {p.signedAt}, 2026</div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="cw-doc-foot">
            <span>
              Draft for internal review — confirm final language with counsel.
            </span>
            <span>Crown Jewels Produce · Year-round, grower-direct</span>
          </div>
        </div>

        {/* ============ COLLABORATION ============ */}
        <aside className="cw-collab">
          {/* actions */}
          <div className="cw-panel">
            <div className="cw-acts">
              {!me.signed ? (
                <button
                  className="cw-act sign"
                  onClick={() => {
                    setSignName(me.name);
                    setSignOpen(true);
                  }}
                >
                  <Icon n="pen" /> Sign agreement
                </button>
              ) : grower.signed ? (
                <button className="cw-act exec" disabled>
                  <Icon n="check" /> Executed — fully signed
                </button>
              ) : (
                <button className="cw-act send" onClick={sendForSignature}>
                  <Icon n="send" /> Send to grower to countersign
                </button>
              )}
              <div className="cw-act-row">
                <button
                  className="cw-act warn"
                  onClick={() => setRevOpen(true)}
                  disabled={executed}
                >
                  <Icon n="back" /> Request changes
                </button>
                <button className="cw-act ghost" onClick={onBack}>
                  <Icon n="user" /> Grower record
                </button>
              </div>
            </div>
          </div>

          {/* participants */}
          <div className="cw-panel">
            <div className="cw-panel-h">
              <b>People on this review</b>
            </div>
            {parties.map((p) => (
              <div className="cw-party" key={p.id}>
                <span className="cw-pav" style={{ background: p.c }}>
                  {initials(p.name)}
                </span>
                <span className="cw-pn">
                  <b>
                    {p.name}
                    {p.you && <span className="cw-you"> · you</span>}
                  </b>
                  <span>{p.role}</span>
                </span>
                <span className="cw-pmeta">
                  <span
                    className={`cw-acc ${
                      p.access.startsWith("Signer") ? "signer" : ""
                    }`}
                  >
                    {p.access}
                  </span>
                  {p.signed && (
                    <span className="cw-sg">
                      <Icon n="check" w={12} /> signed
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>

          {/* activity thread */}
          <div className="cw-panel">
            <div className="cw-panel-h">
              <b>Activity &amp; comments</b>
            </div>
            <div className="cw-thread">
              {activity.map((e, i) => {
                const p = parties.find((x) => x.name === e.who);
                const tag =
                  e.type === "edit" ? (
                    <span className="cw-tag edit">edit</span>
                  ) : e.type === "sign" ? (
                    <span className="cw-tag sign">signed</span>
                  ) : e.type === "revision" ? (
                    <span className="cw-tag rev">revision</span>
                  ) : null;
                return (
                  <div className={`cw-ev ${e.type}`} key={i}>
                    {p ? (
                      <span className="cw-eav" style={{ background: p.c }}>
                        {initials(e.who)}
                      </span>
                    ) : (
                      <span className="cw-eav sys">·</span>
                    )}
                    <div className="cw-eb">
                      <div className="cw-etop">
                        <b>{e.who}</b>
                        {tag}
                        <span className="cw-et">{e.t}</span>
                      </div>
                      <div className="cw-ex">{e.x}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="cw-composer">
              <textarea
                rows={1}
                placeholder="Add a comment for everyone…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    addComment();
                  }
                }}
              />
              <button className="cw-cs" onClick={addComment} aria-label="Send">
                <Icon n="send" w={16} />
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* ---- Sign modal ---- */}
      {signOpen && (
        <div
          className="cw-modal-back"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSignOpen(false);
          }}
        >
          <div className="cw-modal">
            <div className="cw-modal-head">
              <div>
                <h3>Sign agreement</h3>
                <div className="cw-mh-sub">
                  {me.name} · {me.role}
                </div>
              </div>
              <button className="cw-x" onClick={() => setSignOpen(false)}>
                ✕
              </button>
            </div>
            <div className="cw-modal-body">
              <div className="cw-mfield">
                <label>Full legal name</label>
                <input
                  value={signName}
                  onChange={(e) => setSignName(e.target.value)}
                />
              </div>
              <div className="cw-mfield">
                <label>Signature</label>
                <div className="cw-sign-prev">
                  <span className="cw-sp">{signName || me.name}</span>
                </div>
              </div>
              <p className="cw-sign-legal">
                By signing, you adopt this typed signature as your electronic
                signature and agree to be bound by the Crown Jewels grower
                marketing &amp; consignment agreement, season 2026–2027.
              </p>
            </div>
            <div className="cw-modal-foot">
              <button className="cw-gbtn" onClick={() => setSignOpen(false)}>
                Cancel
              </button>
              <button className="cw-gbtn primary" onClick={applySign}>
                Apply signature
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Request-changes modal ---- */}
      {revOpen && (
        <div
          className="cw-modal-back"
          onClick={(e) => {
            if (e.target === e.currentTarget) setRevOpen(false);
          }}
        >
          <div className="cw-modal">
            <div className="cw-modal-head">
              <div>
                <h3>Request changes</h3>
                <div className="cw-mh-sub">Send the draft back with your notes</div>
              </div>
              <button className="cw-x" onClick={() => setRevOpen(false)}>
                ✕
              </button>
            </div>
            <div className="cw-modal-body">
              <div className="cw-mfield">
                <label>What needs to change?</label>
                <textarea
                  rows={4}
                  placeholder="e.g. Cap cold storage at $0.55 — the $0.58 wasn't agreed. Add a clause on reefer temp at the crossing."
                  value={revNote}
                  onChange={(e) => setRevNote(e.target.value)}
                />
              </div>
              <div className="cw-mfield">
                <label>Send back to</label>
                <select value={revTo} onChange={(e) => setRevTo(e.target.value)}>
                  <option>Marisol Zamora (drafting)</option>
                  <option>{seed.growerName} (grower)</option>
                  <option>Outside counsel</option>
                </select>
              </div>
            </div>
            <div className="cw-modal-foot">
              <button className="cw-gbtn" onClick={() => setRevOpen(false)}>
                Cancel
              </button>
              <button className="cw-gbtn primary" onClick={submitRevision}>
                Send back with notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
