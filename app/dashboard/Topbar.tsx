"use client";

import Link from "next/link";
import { CURRENT_USER } from "./user";
import "./shell.css";

export type TopbarNav = { label: string; href: string; active?: boolean };

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
        <Link href="/dashboard" className="cjt-brand">
          <span className="cjt-logo">
            <img src="/crown-jewels-logo.png" alt="Crown Jewels Produce" />
          </span>
          <span className="cjt-mark">
            Crown <em>Jewels</em>
          </span>
          {tool && <span className="cjt-tag">{tool}</span>}
        </Link>

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

        <div className="cjt-user">
          <div className="cjt-avatar" title={CURRENT_USER.name}>
            {CURRENT_USER.initials}
          </div>
          <div className="cjt-userblock">
            <span className="cjt-username">{CURRENT_USER.name}</span>
            <span className="cjt-userrole">{CURRENT_USER.role}</span>
          </div>
          <Link href="/" className="cjt-logout">
            Sign out
          </Link>
        </div>
      </div>
    </header>
  );
}
