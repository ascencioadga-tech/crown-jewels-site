"use client";

/* ============================================================
   Crown Jewels Produce — Receiving  (Operations · Warehousing)
   --------------------------------------------------------------
   Growers in Mexico upload each load before it ships. The cross
   happens at Nogales / Mariposa, AZ; the truck then runs to the
   Fresno cold dock. The warehouse crew sees a rolling 48-hour
   arrivals window, SCANS the truck (manifest / seal barcode) on
   arrival to pull up exactly what the grower declared, verifies
   each line against the count, edits any exceptions, and posts
   the received cases to inventory.
   ============================================================ */

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import jsQR from "jsqr";
import ProduceGlyph from "../ProduceGlyph";
import { useInboundUploads, parseQR, type Inbound, type Line } from "../inboundUploads";
import { useInventory, newLotId, type LotKind } from "../order-system/useInventory";
import "./receiving.css";

/* Decode a Crown Jewels QR from a picked image file → load id (or null). */
function decodeQrFromImage(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const maxW = 1100;
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(data.data, canvas.width, canvas.height);
        const parsed = code ? parseQR(code.data) : null;
        resolve(parsed ? parsed.id : null);
      } catch {
        resolve(null);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

const num = (n: number) => n.toLocaleString("en-US");

/* ---- types: Inbound / Line are the shared shape from the Ship Sheet pipe ---- */

/* ---- seed data — none; arrivals come from the Ship Sheet (inboundUploads) ---- */
const INBOUND: Inbound[] = [];

const REASONS = ["Short", "Over", "Damaged", "Temp issue", "Rejected"] as const;

/* ---- per-line working state, keyed load.id → line index ---- */
type LineState = { ex: boolean; recv: number; reason: string; note: string };
type LoadState = { posted: boolean; lines: LineState[] };

function freshLoad(s: Inbound): LoadState {
  return {
    posted: false,
    lines: s.lines.map((l) => ({ ex: false, recv: l.dec, reason: "", note: "" })),
  };
}

/* ---- icons ---- */
const CK = (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);
const FLAG = (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5"
    />
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

export default function ReceivingPage() {
  // working store: load.id → LoadState
  const [store, setStore] = useState<Record<string, LoadState>>(() => {
    const init: Record<string, LoadState> = {};
    INBOUND.forEach((s) => (init[s.id] = freshLoad(s)));
    return init;
  });
  const [view, setView] = useState<{ mode: "arrivals" | "receive"; id: string | null }>({
    mode: "arrivals",
    id: null,
  });
  const [scanId, setScanId] = useState<string | null>(null); // load being scanned (modal)
  const [scanPhase, setScanPhase] = useState<0 | 1 | 2>(0); // 0 reading · 1 matching · 2 matched
  const [scanDoc, setScanDoc] = useState<{ name: string; matched: boolean } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingIdRef = useRef<string | null>(null);

  // Arrivals come from the Ship Sheet pipe (newest first), plus any seed.
  const { uploads, markReceived } = useInboundUploads();
  const { addLots } = useInventory();
  const loads = useMemo(() => [...uploads, ...INBOUND], [uploads]);

  // Keep the working store seeded with an entry for every load as uploads arrive.
  useEffect(() => {
    setStore((cur) => {
      let changed = false;
      const next = { ...cur };
      loads.forEach((s) => {
        if (!next[s.id]) {
          next[s.id] = freshLoad(s);
          changed = true;
        }
      });
      return changed ? next : cur;
    });
  }, [loads]);

  const rec = (id: string) => store[id];
  const decTotal = (s: Inbound) => s.lines.reduce((a, l) => a + l.dec, 0);
  const recvOf = (s: Inbound, i: number) => {
    const rl = store[s.id]?.lines[i];
    return rl?.ex ? rl.recv || 0 : s.lines[i].dec;
  };
  const recvTotal = (s: Inbound) => s.lines.reduce((a, _l, i) => a + recvOf(s, i), 0);
  const variances = (s: Inbound) =>
    s.lines.filter((l, i) => store[s.id]?.lines[i]?.ex && recvOf(s, i) !== l.dec).length;

  // open = still an arrival: not received (persisted) and not posted (this session)
  const open = useMemo(
    () => loads.filter((s) => !s.received && !store[s.id]?.posted),
    [loads, store]
  );
  const dock = open.filter((s) => s.arrived);
  const later = open.filter((s) => !s.arrived && s.when === "today");
  const tmrw = open.filter((s) => !s.arrived && s.when === "tomorrow");
  const casesExp = open.reduce((a, s) => a + decTotal(s), 0);
  const recvdToday = loads
    .filter((s) => s.received || store[s.id]?.posted)
    .reduce((a, s) => a + recvTotal(s), 0);

  const fireToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 4200);
  };

  /* ---- state mutators ---- */
  const patchLine = (id: string, i: number, patch: Partial<LineState>) =>
    setStore((cur) => {
      const ls = cur[id];
      const lines = ls.lines.map((rl, idx) => (idx === i ? { ...rl, ...patch } : rl));
      return { ...cur, [id]: { ...ls, lines } };
    });

  const toggleEx = (s: Inbound, i: number) => {
    const rl = store[s.id].lines[i];
    patchLine(s.id, i, { ex: !rl.ex, recv: !rl.ex ? rl.recv || s.lines[i].dec : rl.recv });
  };
  const resolveEx = (s: Inbound, i: number) =>
    patchLine(s.id, i, { ex: false, recv: s.lines[i].dec, reason: "", note: "" });
  const verifyAll = (s: Inbound) => {
    setStore((cur) => ({
      ...cur,
      [s.id]: {
        ...cur[s.id],
        lines: s.lines.map((l) => ({ ex: false, recv: l.dec, reason: "", note: "" })),
      },
    }));
    fireToast(`All ${s.lines.length} lines on ${s.id} marked received`);
  };
  const setRecv = (s: Inbound, i: number, v: number) => {
    const recv = Math.max(0, v);
    const cur = store[s.id].lines[i];
    const reason =
      cur.reason ||
      (recv < s.lines[i].dec ? "Short" : recv > s.lines[i].dec ? "Over" : "");
    patchLine(s.id, i, { recv, reason });
  };
  const setReason = (s: Inbound, i: number, rn: string) => {
    const cur = store[s.id].lines[i];
    patchLine(s.id, i, { reason: cur.reason === rn ? "" : rn });
  };

  /* ---- scan flow: pick a document off the computer, read its QR ---- */
  const openScan = (id?: string) => {
    // Remember which load the crew tapped (if any), then open the file picker.
    pendingIdRef.current = id ?? null;
    if (fileRef.current) {
      fileRef.current.value = "";
      fileRef.current.click();
    }
  };

  const onFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Read the QR off the shipping letter / label if it's an image.
    const decodedId = file.type.startsWith("image/")
      ? await decodeQrFromImage(file)
      : null;
    const byQr = decodedId ? loads.find((x) => x.id === decodedId) : null;
    const byPending = pendingIdRef.current
      ? loads.find((x) => x.id === pendingIdRef.current)
      : null;
    const cand = byQr ?? byPending ?? dock[0] ?? open[0];
    if (!cand) {
      fireToast("No matching arrival for that document yet.");
      return;
    }
    setScanDoc({ name: file.name, matched: !!byQr });
    setScanId(cand.id);
    setScanPhase(0);
    window.setTimeout(() => setScanPhase(1), 700);
    window.setTimeout(() => setScanPhase(2), 1500);
    window.setTimeout(() => {
      setScanId(null);
      setScanDoc(null);
      setView({ mode: "receive", id: cand.id });
      fireToast(
        byQr
          ? `QR matched — ${cand.grower}, load ${cand.id}. Verify the lines.`
          : `Opened ${cand.id} from ${file.name}. Verify the lines.`
      );
    }, 2600);
  };
  const closeScan = () => {
    setScanId(null);
    setScanDoc(null);
  };

  /* ---- post: received cases flow into Availability inventory ---- */
  const post = (s: Inbound) => {
    const got = recvTotal(s);
    const v = variances(s);

    // Group the received lines by commodity → one inventory lot each, with
    // quantities under the size the grower declared (Availability shows them
    // under the right commodity as on-hand, netted against open orders).
    const byCommodity: Record<string, Record<string, number>> = {};
    s.lines.forEach((l, i) => {
      const recv = recvOf(s, i);
      if (recv <= 0) return;
      const q = (byCommodity[l.cid] ||= {});
      q[l.sz] = (q[l.sz] || 0) + recv;
    });
    const today = new Date().toISOString().slice(0, 10);
    const nowIso = new Date().toISOString();
    const newLots = Object.entries(byCommodity).map(([cid, quantities]) => ({
      id: newLotId(),
      commodityId: cid,
      kind: "holdover" as LotKind,
      grower: s.grower,
      label: `Received · ${s.id}`,
      arrivalDate: today,
      manifest: s.manifest,
      quantities,
      createdAt: nowIso,
    }));
    addLots(newLots);

    // Persist the receipt so it leaves the arrivals window for good (survives reload)
    // and advances the lot to "received" with the actual case count.
    markReceived(s.id, got);
    setStore((cur) => ({ ...cur, [s.id]: { ...cur[s.id], posted: true } }));
    setView({ mode: "arrivals", id: null });
    fireToast(
      `Posted ${num(got)} cs from ${s.grower} to inventory — now available to sell${
        v ? ` · ${v} variance${v === 1 ? "" : "s"} flagged back to the grower` : ""
      }.`
    );
  };

  const scanLoad = scanId ? loads.find((x) => x.id === scanId) ?? null : null;
  const receiveLoad =
    view.mode === "receive" && view.id ? loads.find((x) => x.id === view.id) ?? null : null;

  return (
    <div className="cj-recv">
      <main>
        {receiveLoad ? (
          <ReceiveScreen
            s={receiveLoad}
            ls={rec(receiveLoad.id)}
            decTotal={decTotal(receiveLoad)}
            recvTotal={recvTotal(receiveLoad)}
            variances={variances(receiveLoad)}
            recvOf={(i) => recvOf(receiveLoad, i)}
            onBack={() => setView({ mode: "arrivals", id: null })}
            onToggleEx={(i) => toggleEx(receiveLoad, i)}
            onResolveEx={(i) => resolveEx(receiveLoad, i)}
            onVerifyAll={() => verifyAll(receiveLoad)}
            onSetRecv={(i, v) => setRecv(receiveLoad, i, v)}
            onSetReason={(i, rn) => setReason(receiveLoad, i, rn)}
            onSetNote={(i, note) => patchLine(receiveLoad.id, i, { note })}
            onPost={() => post(receiveLoad)}
          />
        ) : (
          <>
            <div className="rc-head">
              <div>
                <div className="rc-eyebrow">
                  <span className="rule" />
                  <span className="txt">Operations · Warehousing</span>
                </div>
                <h1>
                  Receiving<span className="accent">.</span>
                </h1>
                <p className="rc-sub">
                  Every grower uploads their load before it leaves Mexico. Here&apos;s
                  everything crossing at Nogales and rolling into the Fresno cold dock over
                  the next 48 hours — scan a truck when it arrives to check it in against
                  what was declared.
                </p>
              </div>
              <div className="rc-head-actions">
                <button className="rc-btn primary" onClick={() => openScan()}>
                  <span className="vf" style={{ display: "none" }} />
                  Log a receipt
                </button>
              </div>
            </div>

            <div className="rc-kpis">
              <Kpi cls="accent" label="Arriving · next 48 h" value={num(open.length)} />
              <Kpi label="Cases expected" value={num(casesExp)} />
              <Kpi cls="amber" label="At the dock now" value={num(dock.length)} />
              <Kpi cls="green" label="Cases received today" value={num(recvdToday)} />
            </div>

            <div className="scanbar">
              <div>
                <div className="sbt">Truck at the dock?</div>
                <div className="sbs">
                  Scan the manifest or seal barcode — we&apos;ll pull up exactly what the
                  grower declared so the crew can check it in line by line.
                </div>
              </div>
              <button className="scan-btn" onClick={() => openScan()}>
                <span className="vf">
                  <i />
                  <i />
                  <i />
                  <i />
                </span>{" "}
                Scan delivery
              </button>
            </div>

            <div className="arr-window">
              <ArrGroup
                title="At the dock — ready to receive"
                count={`${dock.length} waiting`}
                cls="dock"
                rows={dock}
                decTotal={decTotal}
                onScan={(id) => openScan(id)}
              />
              <ArrGroup
                title="Arriving later today"
                count={`${later.length}`}
                rows={later}
                decTotal={decTotal}
                onScan={(id) => openScan(id)}
              />
              <ArrGroup
                title="Tomorrow"
                count={`${tmrw.length}`}
                rows={tmrw}
                decTotal={decTotal}
                onScan={(id) => openScan(id)}
              />
              {open.length === 0 && (
                <div className="arr-empty">
                  All caught up — nothing else expected in the next 48 hours.
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* hidden file input — "Scan" opens the computer's document picker */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*,application/pdf,.png,.jpg,.jpeg,.pdf"
        style={{ display: "none" }}
        onChange={onFilePicked}
      />

      {/* ---- Scan modal ---- */}
      <AnimatePresence>
        {scanLoad && (
          <motion.div
            className="scan-back"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeScan}
          >
            <motion.div
              className="scan-modal"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="scan-modal-h">
                <b>{scanDoc ? "Reading document" : "Scan delivery"}</b>
                <button className="scan-x" onClick={closeScan} aria-label="Close">
                  ×
                </button>
              </div>
              <div className={`viewer${scanPhase === 2 ? " done" : ""}`}>
                <span className="corner tl" />
                <span className="corner tr" />
                <span className="corner bl" />
                <span className="corner br" />
                <span className="beam" />
                <span className="code">▌▍ ▎▌ ▍▌▎ ▌</span>
                <div className="ok">
                  <div className="ck">{CK}</div>
                  <div>
                    <b>{scanLoad.id}</b>
                    <div className="okm">
                      {scanLoad.grower} · Seal {scanLoad.seal}
                    </div>
                  </div>
                </div>
              </div>
              <div className="scan-status">
                <div className="ph">
                  {scanPhase < 2
                    ? scanDoc
                      ? `Reading ${scanDoc.name}…`
                      : "Hold the manifest or seal barcode in frame…"
                    : scanDoc?.matched
                    ? `QR matched — ${scanLoad.grower}`
                    : `Matched — ${scanLoad.grower}`}
                </div>
                <div className="det">
                  {scanPhase === 0 && (scanDoc ? "Decoding the label…" : "Reading code…")}
                  {scanPhase === 1 && "Matching to the declared load…"}
                  {scanPhase === 2 &&
                    `${num(decTotal(scanLoad))} cs declared across ${
                      scanLoad.lines.length
                    } lines`}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- Toast ---- */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="rc-toast"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.22 }}
          >
            {CK}
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================= Components ================= */

function Kpi({ label, value, cls }: { label: string; value: string; cls?: string }) {
  return (
    <div className={`rc-kpi${cls ? ` ${cls}` : ""}`}>
      <div className="lbl">{label}</div>
      <div className="val">{value}</div>
    </div>
  );
}

function ArrGroup({
  title,
  count,
  cls,
  rows,
  decTotal,
  onScan,
}: {
  title: string;
  count: string;
  cls?: string;
  rows: Inbound[];
  decTotal: (s: Inbound) => number;
  onScan: (id: string) => void;
}) {
  if (rows.length === 0) return null;
  return (
    <>
      <div className={`arr-grp${cls ? ` ${cls}` : ""}`}>
        {title}
        <span className="gc">{count}</span>
      </div>
      {rows.map((s) => {
        const cs =
          s.lines.map((l) => l.n).slice(0, 3).join(", ") +
          (s.lines.length > 3 ? ` +${s.lines.length - 3}` : "");
        return (
          <div key={s.id} className={`arr-row${s.arrived ? " dock" : ""}`}>
            <div className="arr-when">
              <div className="t">{s.eta}</div>
              <div className="r">{s.rel}</div>
            </div>
            <div className="arr-main">
              <div className="arr-grower">
                {s.grower}
                {s.arrived && <span className="arr-fresh">At door {s.door}</span>}
              </div>
              <div className="arr-sum">
                <span>
                  Load <b>{s.id}</b>
                </span>
                <span>{s.region}</span>
                <span>
                  Truck <b>{s.truck}</b>
                </span>
                <span>{cs}</span>
              </div>
              <div className="arr-up">
                Grower uploaded <b>{s.uploaded}</b> · Manifest {s.manifest} · Seal{" "}
                {s.seal} · {s.receiver}
              </div>
            </div>
            <div className="arr-cs">
              <div className="n">{num(decTotal(s))}</div>
              <div className="l">
                cs · {s.lines.length} lines
              </div>
            </div>
            <div className="arr-act">
              {s.arrived ? (
                <button className="rc-btn green" onClick={() => onScan(s.id)}>
                  Scan to receive
                </button>
              ) : s.when === "tomorrow" ? (
                <span className="pill sched">
                  <span className="pd" />
                  Scheduled
                </span>
              ) : (
                <span className="pill transit">
                  <span className="pd" />
                  In transit
                </span>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}

function ReceiveScreen({
  s,
  ls,
  decTotal,
  recvTotal,
  variances,
  recvOf,
  onBack,
  onToggleEx,
  onResolveEx,
  onVerifyAll,
  onSetRecv,
  onSetReason,
  onSetNote,
  onPost,
}: {
  s: Inbound;
  ls: LoadState;
  decTotal: number;
  recvTotal: number;
  variances: number;
  recvOf: (i: number) => number;
  onBack: () => void;
  onToggleEx: (i: number) => void;
  onResolveEx: (i: number) => void;
  onVerifyAll: () => void;
  onSetRecv: (i: number, v: number) => void;
  onSetReason: (i: number, rn: string) => void;
  onSetNote: (i: number, note: string) => void;
  onPost: () => void;
}) {
  const ready = variances === 0;
  const warmTemp = s.temp !== "—" && parseInt(s.temp, 10) > 50;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32 }}
    >
      <button className="rc-back" onClick={onBack}>
        ← 48-hour arrivals
      </button>
      <div className="rc-head">
        <div>
          <div className="rc-eyebrow">
            <span className="rule" />
            <span className="txt">Receiving · {s.id}</span>
          </div>
          <h1>
            {s.grower}
            <span className="accent">.</span>
          </h1>
          <div className="rcv-shipmeta">
            <span>{s.region}</span>
            <span>
              Truck <b>{s.truck}</b>
            </span>
            <span>
              Manifest <b>{s.manifest}</b>
            </span>
            <span>
              Seal <b>{s.seal}</b>
            </span>
            <span>
              Door <b>{s.door}</b>
            </span>
            <span className={warmTemp ? "temp-warm" : ""}>
              Reefer pulp <b>{s.temp}</b>
            </span>
            <span>
              Receiver <b>{s.receiver}</b>
            </span>
          </div>
          <div className="rcv-up">
            Declared by grower · uploaded <b>{s.uploaded}</b> · ETA {s.eta}
          </div>
        </div>
      </div>

      <div className="rcv-allbar">
        <div className="t">
          <b>{s.lines.length} lines</b> declared · <b>{num(decTotal)} cs</b>. Everything is
          marked received — flag only what&apos;s short or damaged.
        </div>
        <button className="rc-btn ghost sm" onClick={onVerifyAll}>
          ✓ Verify all as received
        </button>
      </div>

      <div>
        {s.lines.map((l, i) => {
          const rl = ls.lines[i];
          const got = recvOf(i);
          const diff = got - l.dec;
          const cls = !rl.ex ? "" : diff < 0 ? "short" : diff > 0 ? "over" : "flag";
          const recvCls = !rl.ex ? "ok" : diff < 0 ? "short" : diff > 0 ? "over" : "flag";
          const tag = !rl.ex ? (
            <>
              {CK} received
            </>
          ) : diff < 0 ? (
            `${Math.abs(diff)} short`
          ) : diff > 0 ? (
            `+${diff} over`
          ) : (
            rl.reason || "Flagged"
          );
          return (
            <div key={i} className={`rl${cls ? ` ${cls}` : ""}`}>
              <div className="rl-head">
                <ProduceGlyph id={l.cid} size={46} className="rl-glyph" title={l.n} />
                <div className="rl-info">
                  <div className="rl-top">
                    <span className="rl-name">{l.n}</span>
                    <span className="rl-sz">{l.sz}</span>
                    <span className="rl-lot">{l.lot}</span>
                  </div>
                  <div className="rl-dec">
                    Grower declared <b>{num(l.dec)} cs</b>
                  </div>
                </div>
                <div className={`rl-recv ${recvCls}`}>
                  <div className="rl-num">
                    {num(got)} <small>cs</small>
                  </div>
                  <div className={`rl-tag ${recvCls}`}>{tag}</div>
                </div>
              </div>

              {rl.ex ? (
                <ExceptionEditor
                  l={l}
                  rl={rl}
                  onSetRecv={(v) => onSetRecv(i, v)}
                  onSetReason={(rn) => onSetReason(i, rn)}
                  onSetNote={(note) => onSetNote(i, note)}
                  onResolve={() => onResolveEx(i)}
                />
              ) : (
                <button className="rl-flag" onClick={() => onToggleEx(i)}>
                  {FLAG} Flag short, over or damaged
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="postbar">
        <div className="pb-left">
          <span className={`pb-badge ${ready ? "ok" : "warn"}`}>{ready ? CK : WARN}</span>
          <div>
            <div className="pb-n">
              {num(recvTotal)} <span className="of">/ {num(decTotal)} cs</span>
            </div>
            <div className={`pb-sub${ready ? "" : " warn"}`}>
              {ready
                ? "All received · no exceptions"
                : `${variances} exception${variances === 1 ? "" : "s"} flagged`}
            </div>
          </div>
        </div>
        <button className="pb-post" onClick={onPost}>
          Post {num(recvTotal)} cs to inventory {ARROW}
        </button>
      </div>
    </motion.div>
  );
}

function ExceptionEditor({
  l,
  rl,
  onSetRecv,
  onSetReason,
  onSetNote,
  onResolve,
}: {
  l: Line;
  rl: LineState;
  onSetRecv: (v: number) => void;
  onSetReason: (rn: string) => void;
  onSetNote: (note: string) => void;
  onResolve: () => void;
}) {
  const got = rl.recv || 0;
  const diff = got - l.dec;
  const dcls = diff < 0 ? "short" : diff > 0 ? "over" : "zero";
  const dtxt =
    diff === 0 ? "matches declared" : diff > 0 ? `+${diff} over` : `${diff} short`;
  return (
    <div className="exc">
      <div className="exc-row">
        <div className="exc-fld">
          <label>Cases received</label>
          <div className="qty">
            <button onClick={() => onSetRecv(got - 1)} aria-label="Decrease">
              −
            </button>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={got}
              onChange={(e) => onSetRecv(parseInt(e.target.value || "0", 10))}
            />
            <button onClick={() => onSetRecv(got + 1)} aria-label="Increase">
              +
            </button>
          </div>
        </div>
        <div className="exc-fld">
          <label>vs declared {l.dec}</label>
          <span className={`delta ${dcls}`}>{dtxt}</span>
        </div>
      </div>
      <div className="reasons">
        {REASONS.map((rn) => (
          <button
            key={rn}
            className={`rchip${rl.reason === rn ? " on" : ""}`}
            onClick={() => onSetReason(rn)}
          >
            {rn}
          </button>
        ))}
      </div>
      <textarea
        className="exc-note"
        rows={2}
        placeholder="Note for the grower (optional) — e.g. 2 pallets soft on the Roma, rejected at the dock"
        value={rl.note}
        onChange={(e) => onSetNote(e.target.value)}
      />
      <div>
        <button className="exc-resolve" onClick={onResolve}>
          ↩ It&apos;s actually all here — mark received
        </button>
      </div>
    </div>
  );
}
