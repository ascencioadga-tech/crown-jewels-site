"use client";

// Public app launcher — an elegant, light "front desk" for the standalone phone
// apps, presented as a horizontal carousel. White, airy, refined. No login.
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import "./apps-launch.css";

type Kind = "ship" | "sales";

type LaunchApp = {
  kind: Kind;
  title: string;
  badge: string;
  desc: string;
  href: string;
};

const APPS: LaunchApp[] = [
  {
    kind: "ship",
    title: "Ship Sheet",
    badge: "Grower app",
    href: "/ship-sheet",
    desc: "Growers declare each truckload leaving Mexico — products, lots and dispatch — once, from their phone.",
  },
  {
    kind: "sales",
    title: "New Order",
    badge: "Sales app",
    href: "/new-order",
    desc: "Photograph an order, scan it, or key it in — priced against live availability as the desk builds it.",
  },
];

export default function AppsLauncher() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth - 2;
    setCanPrev(el.scrollLeft > 2);
    setCanNext(el.scrollLeft < max);
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update]);

  // Synchronous scrollLeft (smooth-scroll is paused in the preview iframe).
  const scrollByCard = (dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(".lux-tile");
    const step = card ? card.getBoundingClientRect().width + 22 : 320;
    el.scrollLeft += dir * step;
    update();
  };

  return (
    <div className="lux">
      <div className="lux-bg" aria-hidden="true" />

      <main className="lux-main">
        <header className="lux-hero">
          <img className="lux-crest" src="/crown-emblem.png" alt="Crown Jewels" />
          <div className="lux-eyebrow">
            <span className="r" />
            Field &amp; Sales
            <span className="r" />
          </div>
          <h1>
            Open an app<span className="dot">.</span>
          </h1>
          <p>
            The grower&apos;s Ship Sheet and the sales desk&apos;s New Order —
            built for the phone, ready to demo.
          </p>
        </header>

        <div className="lux-carousel">
          <div className="lux-track" ref={trackRef} onScroll={update}>
            {APPS.map((app) => (
              <Link key={app.kind} href={app.href} className={`lux-tile lux-${app.kind}`}>
                <span className="lux-edge" />
                <div className="lux-screen">
                  <CardArt kind={app.kind} />
                  <span className="lux-badge">{app.badge}</span>
                </div>
                <div className="lux-body">
                  <h3>{app.title}</h3>
                  <p>{app.desc}</p>
                  <span className="lux-enter">
                    Enter
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="lux-carousel-ctrl">
            <button type="button" className="lux-cbtn" aria-label="Previous" disabled={!canPrev} onClick={() => scrollByCard(-1)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button type="button" className="lux-cbtn" aria-label="Next" disabled={!canNext} onClick={() => scrollByCard(1)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ---- animated geometric preview per app (on the card's light screen) ---- */
function CardArt({ kind }: { kind: Kind }) {
  const vb = { viewBox: "0 0 260 120", preserveAspectRatio: "xMidYMid meet" } as const;
  if (kind === "ship") {
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
  }
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
}
