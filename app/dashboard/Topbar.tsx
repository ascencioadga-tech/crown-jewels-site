"use client";

import Link from "next/link";
import "./shell.css";

export type TopbarNav = { label: string; href: string; active?: boolean };

/**
 * Slim per-tool toolbar. The brand and user block moved into the workspace
 * sidebar (Sidebar.tsx) — this keeps each tool's subnav, date, and search.
 */
export default function Topbar({
  tool,
  nav,
  search,
}: {
  tool?: string;
  nav?: TopbarNav[];
  search?: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
  };
}) {
  const dateText = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <header className="cjt-topbar">
      <div className="cjt-inner">
        {tool && <span className="cjt-tag">{tool}</span>}

        {nav && nav.length > 0 && (
          <nav className="cjt-nav">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className={n.active ? "active" : ""}>
                {n.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="cjt-date">
          <span className="cjt-dot" />
          <span>{dateText}</span>
        </div>

        <div className="cjt-spacer" />

        {search && (
          <div className="cjt-search">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="search"
              placeholder={search.placeholder ?? "Search…"}
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
            />
          </div>
        )}
      </div>
    </header>
  );
}
