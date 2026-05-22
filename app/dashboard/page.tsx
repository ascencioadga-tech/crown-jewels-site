"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Topbar from "./Topbar";
import { CURRENT_USER, firstName } from "./user";
import "./dashboard-home.css";

const EASE = [0.22, 1, 0.36, 1] as const;

type App = {
  id: string;
  name: string;
  desc: string;
  href?: string;
  status: "active" | "soon";
  accent: string;
  /** Screenshot preview shown at the top of the card (active apps). */
  preview?: string;
  icon: React.ReactNode;
};

const APPS: App[] = [
  {
    id: "daily-quote",
    name: "Daily Quote System",
    desc: "Set today's prices per commodity and send branded availability sheets to your clients.",
    href: "/dashboard/daily-quote",
    status: "active",
    accent: "#7a1f2b",
    preview: "/app-daily-quote.jpg",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: "orders",
    name: "Order System",
    desc: "Enter an order once — it mints the order number, feeds Rob's report, and stages the invoice.",
    href: "/dashboard/order-system",
    status: "active",
    accent: "#2a4a5e",
    preview: "/app-order-system.jpg",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
      </svg>
    ),
  },
];

export default function DashboardHome() {
  return (
    <div className="cj-home">
      <Topbar />

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
            <span className="accent">Your Crown Jewels workspace.</span>
          </h1>
          <p>
            Everything your sales desk needs in one place. Open an app to get
            started — the daily quote tool is live now, with more on the way.
          </p>
        </motion.div>

        <div className="home-app-grid">
          {APPS.map((app, i) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.07, duration: 0.6, ease: EASE }}
            >
              <AppCard app={app} />
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}

function AppCard({ app }: { app: App }) {
  const inner = (
    <>
      <div className="app-preview">
        {app.preview ? (
          <img src={app.preview} alt={`${app.name} preview`} />
        ) : (
          <div
            className="app-preview-icon"
            style={{
              color: app.accent,
              background: `linear-gradient(135deg, ${app.accent}16, ${app.accent}06)`,
            }}
          >
            {app.icon}
          </div>
        )}
      </div>
      <div className="app-body">
        <div className="app-name-row">
          <h2>{app.name}</h2>
          {app.status === "soon" ? (
            <span className="app-badge soon">Coming soon</span>
          ) : (
            <span className="app-badge live">
              <span className="live-dot" /> Live
            </span>
          )}
        </div>
        <p>{app.desc}</p>
      </div>
      {app.status === "active" && (
        <span className="app-cta" aria-hidden>
          Open
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </span>
      )}
    </>
  );

  if (app.status === "active" && app.href) {
    return (
      <Link href={app.href} className="app-card is-active">
        {inner}
      </Link>
    );
  }
  return (
    <div className="app-card is-soon" aria-disabled="true">
      {inner}
    </div>
  );
}
