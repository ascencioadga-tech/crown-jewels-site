"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CURRENT_USER, firstName } from "./user";
import "./dashboard-home.css";
import "./app-boxes.css";

const EASE = [0.22, 1, 0.36, 1] as const;

type AppKind =
  | "sales" | "quote" | "gm" | "receiving" | "ship"
  | "growers" | "settlement" | "paca" | "accounting" | "messages";

type App = {
  kind: AppKind;
  title: string;
  badge: string;
  desc: string;
  href: string;
  highlight?: boolean;
};

// The launcher grid — grouped Sales → Operations → Growers → Finance → Team.
const APPS: App[] = [
  {
    kind: "sales", title: "Sales Desk", badge: "ORDERS", href: "/dashboard/order-system",
    desc: "Enter an order once — it checks availability and hands billing to Accounting.",
  },
  {
    kind: "quote", title: "Daily Quote Sheet", badge: "QUOTE", href: "/dashboard/daily-quote",
    desc: "Set today's prices per commodity and send branded sheets to clients.",
  },
  {
    kind: "gm", title: "GM Center", badge: "OPS", href: "/dashboard/gm-center",
    desc: "Every desk's live status and the levers to run the whole operation.",
  },
  {
    kind: "receiving", title: "Receiving", badge: "WAREHOUSE", href: "/dashboard/receiving",
    desc: "The warehouse verifies each inbound load by scan against what shipped.",
  },
  {
    kind: "ship", title: "Ship Sheet", badge: "SHIPPING", href: "/dashboard/ship-sheet",
    desc: "Growers log each truckload leaving Mexico — load, lot and dispatch.",
  },
  {
    kind: "growers", title: "Growers Portal", badge: "GROWERS", href: "/dashboard/grower-report",
    desc: "Each grower's settlement at a glance — returns, charges and a PDF statement.",
  },
  {
    kind: "settlement", title: "Settlement Sheet", badge: "SETTLEMENT", href: "/dashboard/la-libreta",
    desc: "Register a grower's sales and charges; the settlement computes itself.",
  },
  {
    kind: "paca", title: "PACA Trust", badge: "TRUST", href: "/dashboard/paca",
    desc: "Trust assets vs. what we owe growers, with prompt-pay status on every settlement.",
  },
  {
    kind: "accounting", title: "Accounting", badge: "AR", href: "/dashboard/accounting", highlight: true,
    desc: "Generate and send invoices, then track every receivable to collection.",
  },
  {
    kind: "messages", title: "Messages", badge: "CHAT", href: "/dashboard/messages",
    desc: "Team channels and DMs — sales, growers, finance — with live order events.",
  },
];

export default function DashboardHome() {
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
  }, [updateCtrl]);

  const scrollByCard = (dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    const first = el.querySelector<HTMLElement>(".appbox-cell");
    const step = first ? first.getBoundingClientRect().width + 26 : 360;
    el.scrollLeft += dir * step;
    updateCtrl();
  };

  return (
    <div className="cj-home">
      <main className="home-main">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="home-welcome"
        >
          <div className="flex-eyebrow">
            <span className="rule" />
            <span className="eyebrow-text">Team Workspace</span>
          </div>
          <h1>
            Welcome back, {firstName(CURRENT_USER.name)}.
            <br />
            <span className="accent">Your Crown <span className="cj-j">Jewels</span> workspace.</span>
          </h1>
          <p>
            Everything the team runs on, in one place — sales, growers, the
            warehouse and finance. Open an app to get started.
          </p>
        </motion.div>

        <div className="carousel-bar">
          <span className="carousel-label">Apps</span>
          <div className="carousel-ctrl">
            <button type="button" className="car-btn" aria-label="Previous" disabled={!canPrev} onClick={() => scrollByCard(-1)}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button type="button" className="car-btn" aria-label="Next" disabled={!canNext} onClick={() => scrollByCard(1)}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>

        <div className="apps-track" ref={trackRef} onScroll={updateCtrl}>
          {APPS.map((app, i) => (
            <motion.div
              key={app.kind}
              className="appbox-cell"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + i * 0.045, duration: 0.55, ease: EASE }}
            >
              <Link href={app.href} className={`appbox${app.highlight ? " highlight" : ""}`}>
                <div className="appbox-top">
                  <div className="appbox-head">
                    <img className="appbox-crown" src="/crown-emblem.png" alt="Crown Jewels" />
                    <span className="appbox-badge">
                      <BadgeIcon kind={app.kind} />
                      {app.badge}
                    </span>
                  </div>
                  <span className="appbox-rule" />
                  <div className="appbox-art">
                    <CardArt kind={app.kind} />
                  </div>
                </div>
                <div className="appbox-foot">
                  <div className="appbox-title-row">
                    <h3>{app.title}</h3>
                    <span className="appbox-live">
                      <span className="dot" />
                      Live
                    </span>
                  </div>
                  <p>{app.desc}</p>
                  <span className="appbox-open">
                    Open <span className="arr">→</span>
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}

/* ---- small badge icon (top-right pill) ---- */
function BadgeIcon({ kind }: { kind: AppKind }) {
  const p = { width: 13, height: 13, viewBox: "0 0 16 16", fill: "none", stroke: "#7a7f86" } as const;
  switch (kind) {
    case "quote":
      return (
        <svg {...p} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round">
          <path d="M4 2.5h5l3 3V13.5H4z" /><line x1="6" y1="7" x2="11" y2="7" /><line x1="6" y1="10" x2="11" y2="10" />
        </svg>
      );
    case "messages":
      return (
        <svg {...p} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round">
          <path d="M2.5 3.5h11v7H6l-2.5 2.5V10.5H2.5z" />
        </svg>
      );
    case "accounting":
      return (
        <svg {...p} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round">
          <path d="M4 2.2h8v11.6l-2-1-2 1-2-1-2 1z" /><line x1="6" y1="6" x2="10" y2="6" /><line x1="6" y1="9" x2="10" y2="9" />
        </svg>
      );
    case "sales":
      return (
        <svg {...p} strokeWidth={1.5} strokeLinecap="round">
          <line x1="4" y1="4" x2="13" y2="4" /><line x1="4" y1="8" x2="13" y2="8" /><line x1="4" y1="12" x2="13" y2="12" />
        </svg>
      );
    case "growers":
      return (
        <svg {...p} strokeWidth={1.8} strokeLinecap="round">
          <line x1="4" y1="13" x2="4" y2="8.5" /><line x1="8" y1="13" x2="8" y2="4.5" /><line x1="12" y1="13" x2="12" y2="9.5" />
        </svg>
      );
    case "settlement":
      return (
        <svg {...p} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round">
          <path d="M10.5 2.8l2.7 2.7-7.4 7.4-3.2.5.5-3.2z" />
        </svg>
      );
    case "gm":
      return (
        <svg {...p} strokeWidth={1.5} strokeLinejoin="round">
          <rect x="2.5" y="2.5" width="4.5" height="4.5" rx="1" /><rect x="9" y="2.5" width="4.5" height="4.5" rx="1" />
          <rect x="2.5" y="9" width="4.5" height="4.5" rx="1" /><rect x="9" y="9" width="4.5" height="4.5" rx="1" />
        </svg>
      );
    case "ship":
      return (
        <svg {...p} strokeWidth={1.4} strokeLinejoin="round" strokeLinecap="round">
          <path d="M1.5 4h7.5v6.5h-7.5z" /><path d="M9 6h3l2 2.2v2.3H9z" /><circle cx="4.5" cy="12" r="1.3" /><circle cx="11.5" cy="12" r="1.3" />
        </svg>
      );
    case "receiving":
      return (
        <svg {...p} strokeWidth={1.4} strokeLinejoin="round" strokeLinecap="round">
          <path d="M8 2l5.2 2.6v5.2L8 12.4 2.8 9.8V4.6z" /><path d="M2.8 4.6 8 7.2l5.2-2.6" /><line x1="8" y1="7.2" x2="8" y2="12.4" />
        </svg>
      );
    case "paca":
      return (
        <svg {...p} strokeWidth={1.4} strokeLinejoin="round" strokeLinecap="round">
          <path d="M8 1.8l5.2 1.9v4.1C13.2 11.3 8 14.2 8 14.2S2.8 11.3 2.8 7.8V3.7z" /><path d="M5.8 8l1.6 1.6 3-3.4" />
        </svg>
      );
  }
}

/* ---- animated geometric preview per app-kind (the "geo" variant) ---- */
function CardArt({ kind }: { kind: AppKind }) {
  const vb = { viewBox: "0 0 260 120", preserveAspectRatio: "xMidYMid meet" } as const;
  switch (kind) {
    case "quote":
      return (
        <svg {...vb}>
          <line x1="22" y1="100" x2="240" y2="100" stroke="#e2e4e7" strokeWidth="2" />
          <rect x="42" y="70" width="30" height="30" rx="4" fill="#d4d7db" />
          <rect x="92" y="54" width="30" height="46" rx="4" fill="#b9bdc2" />
          <rect x="142" y="38" width="30" height="62" rx="4" fill="#a64b54" />
          <rect x="192" y="22" width="30" height="78" rx="4" fill="#7a1f2b" style={{ transformOrigin: "207px 100px", animation: "cj-bar 3.6s ease-in-out infinite" }} />
          <path d="M207 8 l9 13 l-18 0 z" fill="#7a1f2b" />
        </svg>
      );
    case "messages":
      return (
        <svg {...vb}>
          <rect x="30" y="20" width="132" height="52" rx="16" fill="#e4e6e9" />
          <path d="M52 72 l0 18 l18 -18 z" fill="#e4e6e9" />
          <circle cx="62" cy="46" r="4.5" fill="#aeb2b8" /><circle cx="84" cy="46" r="4.5" fill="#aeb2b8" /><circle cx="106" cy="46" r="4.5" fill="#aeb2b8" />
          <rect x="104" y="52" width="126" height="50" rx="15" fill="#ffffff" stroke="#7a1f2b" strokeWidth="2.5" />
          <path d="M204 102 l0 16 l16 -16 z" fill="#7a1f2b" />
          <circle cx="146" cy="77" r="4.5" fill="#7a1f2b" style={{ animation: "cj-dot 1.5s ease-in-out infinite" }} /><circle cx="168" cy="77" r="4.5" fill="#a64b54" /><circle cx="190" cy="77" r="4.5" fill="#d09aa1" />
        </svg>
      );
    case "accounting":
      return (
        <svg {...vb}>
          <g transform="rotate(-90 130 60)">
            <circle cx="130" cy="60" r="38" fill="none" stroke="#e6e8ea" strokeWidth="18" />
            <circle cx="130" cy="60" r="38" fill="none" stroke="#7a1f2b" strokeWidth="18" strokeDasharray="119.4 238.8" />
            <circle cx="130" cy="60" r="38" fill="none" stroke="#a64b54" strokeWidth="18" strokeDasharray="59.7 238.8" strokeDashoffset="-119.4" />
            <circle cx="130" cy="60" r="38" fill="none" stroke="#c4c8cd" strokeWidth="18" strokeDasharray="35.8 238.8" strokeDashoffset="-179.1" />
            <circle cx="130" cy="60" r="38" fill="none" stroke="#aeb2b8" strokeWidth="18" strokeDasharray="23.9 238.8" strokeDashoffset="-214.9" />
          </g>
          <circle cx="130" cy="60" r="6" fill="#7a1f2b" style={{ transformOrigin: "130px 60px", animation: "cj-breathe 3s ease-in-out infinite" }} />
        </svg>
      );
    case "sales":
      return (
        <svg {...vb}>
          <rect x="24" y="38" width="46" height="46" rx="11" fill="#7a1f2b" style={{ transformOrigin: "47px 61px", animation: "cj-bar 3.4s ease-in-out infinite" }} />
          <rect x="34" y="55" width="26" height="4" rx="2" fill="#ffffff" opacity="0.75" /><rect x="34" y="64" width="18" height="4" rx="2" fill="#ffffff" opacity="0.5" />
          <path d="M78 61 l16 0 M90 56 l6 5 l-6 5" fill="none" stroke="#c4c8cd" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="107" y="38" width="46" height="46" rx="11" fill="#b9bdc2" style={{ transformOrigin: "130px 61px", animation: "cj-bar 3.4s ease-in-out infinite .4s" }} />
          <rect x="117" y="55" width="26" height="4" rx="2" fill="#ffffff" opacity="0.85" /><rect x="117" y="64" width="18" height="4" rx="2" fill="#ffffff" opacity="0.6" />
          <path d="M161 61 l16 0 M173 56 l6 5 l-6 5" fill="none" stroke="#c4c8cd" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="190" y="38" width="46" height="46" rx="11" fill="#a64b54" style={{ transformOrigin: "213px 61px", animation: "cj-bar 3.4s ease-in-out infinite .8s" }} />
          <path d="M203 61 l6 7 l12 -14" fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "growers":
      return (
        <svg {...vb}>
          <line x1="86" y1="106" x2="174" y2="106" stroke="#e2e4e7" strokeWidth="2" strokeLinecap="round" />
          <path d="M96 106 A 34 34 0 0 1 164 106" fill="none" stroke="#c4c8cd" strokeWidth="6" strokeLinecap="round" />
          <path d="M84 106 A 46 46 0 0 1 176 106" fill="none" stroke="#a64b54" strokeWidth="6" strokeLinecap="round" />
          <path d="M72 106 A 58 58 0 0 1 188 106" fill="none" stroke="#7a1f2b" strokeWidth="6" strokeLinecap="round" />
          <g style={{ transformOrigin: "130px 44px", animation: "cj-breathe 3.4s ease-in-out infinite" }}>
            <line x1="130" y1="48" x2="130" y2="28" stroke="#7a1f2b" strokeWidth="3" strokeLinecap="round" />
            <ellipse cx="120" cy="30" rx="9" ry="5" fill="#7a1f2b" transform="rotate(-35 120 30)" />
            <ellipse cx="140" cy="30" rx="9" ry="5" fill="#a64b54" transform="rotate(35 140 30)" />
          </g>
        </svg>
      );
    case "settlement":
      return (
        <svg {...vb}>
          <line x1="92" y1="104" x2="168" y2="104" stroke="#e2e4e7" strokeWidth="2" strokeLinecap="round" />
          <path d="M130 50 l-15 50 l30 0 z" fill="#7a1f2b" />
          <g>
            <animateTransform attributeName="transform" type="rotate" values="-3 130 50; 3 130 50; -3 130 50" dur="4.6s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" />
            <line x1="62" y1="50" x2="198" y2="50" stroke="#a64b54" strokeWidth="4" strokeLinecap="round" />
            <line x1="68" y1="50" x2="68" y2="66" stroke="#c4c8cd" strokeWidth="2" />
            <line x1="192" y1="50" x2="192" y2="66" stroke="#c4c8cd" strokeWidth="2" />
            <circle cx="68" cy="74" r="13" fill="#aeb2b8" />
            <circle cx="192" cy="74" r="13" fill="#d09aa1" />
          </g>
        </svg>
      );
    case "gm":
      return (
        <svg {...vb}>
          <rect x="52" y="24" width="68" height="32" rx="6" fill="#d4d7db" />
          <rect x="62" y="44" width="8" height="4" rx="2" fill="#ffffff" /><rect x="74" y="40" width="8" height="8" rx="2" fill="#ffffff" /><rect x="86" y="36" width="8" height="12" rx="2" fill="#ffffff" />
          <rect x="128" y="24" width="80" height="32" rx="6" fill="#7a1f2b" />
          <polyline points="138,46 152,40 166,43 180,32 198,36" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="52" y="64" width="80" height="32" rx="6" fill="#b9bdc2" />
          <rect x="62" y="74" width="60" height="4" rx="2" fill="#ffffff" opacity="0.8" /><rect x="62" y="84" width="40" height="4" rx="2" fill="#ffffff" opacity="0.6" />
          <rect x="140" y="64" width="68" height="32" rx="6" fill="#a64b54" />
          <g transform="translate(174 80)"><circle r="11" fill="none" stroke="#ffffff" strokeWidth="3" opacity="0.4" /><circle r="11" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeDasharray="46 69" transform="rotate(-90)" /></g>
          <circle cx="168" cy="40" r="3.4" fill="#ffffff" style={{ animation: "cj-dot 1.6s ease-in-out infinite" }} />
        </svg>
      );
    case "ship":
      return (
        <svg {...vb}>
          <line x1="22" y1="96" x2="238" y2="96" stroke="#e2e4e7" strokeWidth="2" strokeLinecap="round" />
          <path d="M30 96 L210 96" fill="none" stroke="#a64b54" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="7 8" />
          <circle cx="30" cy="96" r="5" fill="#7a1f2b" />
          <path d="M214 86 l0 20 M214 86 l14 5 l-14 5" fill="none" stroke="#7a1f2b" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
          <g style={{ transformOrigin: "center", animation: "cj-roll 2.6s ease-in-out infinite alternate" }}>
            <rect x="66" y="46" width="74" height="36" rx="5" fill="#b9bdc2" />
            <path d="M70 54 h6 M70 62 h6 M70 70 h6" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
            <path d="M140 56 h22 l14 12 v14 h-36 z" fill="#7a1f2b" />
            <rect x="146" y="60" width="14" height="10" rx="2" fill="#ffffff" opacity="0.85" />
            <circle cx="92" cy="84" r="8" fill="#3a3a3e" /><circle cx="92" cy="84" r="3" fill="#b9bdc2" />
            <circle cx="164" cy="84" r="8" fill="#3a3a3e" /><circle cx="164" cy="84" r="3" fill="#b9bdc2" />
          </g>
        </svg>
      );
    case "receiving":
      return (
        <svg {...vb}>
          <path d="M130 26 l44 22 v34 l-44 22 l-44 -22 v-34 z" fill="#d4d7db" />
          <path d="M86 48 l44 22 l44 -22" fill="none" stroke="#b3b7bc" strokeWidth="2.2" strokeLinejoin="round" />
          <line x1="130" y1="70" x2="130" y2="104" stroke="#b3b7bc" strokeWidth="2.2" />
          <path d="M108 37 l44 22" stroke="#aeb2b8" strokeWidth="2" opacity="0.6" />
          <rect x="78" y="66" width="104" height="5" rx="2.5" fill="#7a1f2b" style={{ transformOrigin: "center", animation: "cj-scan 2.4s ease-in-out infinite" }} />
          <g transform="translate(170 34)"><circle r="13" fill="#a64b54" /><path d="M-6 0 l4 5 l8 -10" fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></g>
        </svg>
      );
    case "paca":
      return (
        <svg {...vb}>
          <path d="M130 18 l40 14 v26 c0 26 -40 44 -40 44 s-40 -18 -40 -44 v-26 z" fill="#7a1f2b" />
          <path d="M130 26 l32 11 v21 c0 20 -32 35 -32 35 s-32 -15 -32 -35 v-21 z" fill="#ffffff" opacity="0.14" />
          <ellipse cx="130" cy="74" rx="22" ry="7" fill="#a64b54" />
          <ellipse cx="130" cy="66" rx="22" ry="7" fill="#d09aa1" />
          <ellipse cx="130" cy="58" rx="22" ry="7" fill="#ffffff" opacity="0.92" />
          <path d="M122 58 l5 5 l9 -10" fill="none" stroke="#7a1f2b" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transformOrigin: "130px 58px", animation: "cj-breathe 3s ease-in-out infinite" }} />
        </svg>
      );
  }
}
