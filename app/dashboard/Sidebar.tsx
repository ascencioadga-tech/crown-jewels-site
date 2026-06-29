"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { CURRENT_USER } from "./user";
import "./shell.css";

/* Single-path icon set (heroicons outline paths) */
const IC: Record<string, string> = {
  home: "M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75",
  orders: "M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z",
  grid: "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 8.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z",
  quote: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  chart: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
  pencil: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10",
  bank: "M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z",
  search: "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z",
  plus: "M12 4.5v15m7.5-7.5h-15",
  send: "M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5",
  chat: "M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z",
  gm: "M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z",
  doc: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
  box: "M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9",
  truck: "M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12",
  shield: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z",
};

function Ic({ name }: { name: string }) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7">
      <path strokeLinecap="round" strokeLinejoin="round" d={IC[name] ?? IC.search} />
    </svg>
  );
}

type NavItem = { href: string; label: string; icon: string; also?: string[] };
type NavGroup = { grp: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    grp: "Overview",
    items: [
      { href: "/dashboard", label: "Home", icon: "home" },
      { href: "/dashboard/messages", label: "Messages", icon: "chat" },
    ],
  },
  {
    grp: "Sales",
    items: [
      {
        href: "/dashboard/order-system",
        label: "Sales Desk",
        icon: "orders",
        also: ["/dashboard/order-system/new", "/dashboard/order-system/receivables"],
      },
      { href: "/dashboard/daily-quote", label: "Daily Quote Sheet", icon: "quote", also: ["/dashboard/daily-quote/send"] },
      { href: "/dashboard/rob-report", label: "Rob's Report", icon: "doc" },
    ],
  },
  {
    grp: "Operations",
    items: [
      { href: "/dashboard/gm-center", label: "GM Center", icon: "gm" },
      { href: "/dashboard/order-system/availability", label: "Availability", icon: "grid" },
    ],
  },
  {
    grp: "Warehousing",
    items: [
      { href: "/dashboard/receiving", label: "Receiving", icon: "box" },
      { href: "/dashboard/shipping", label: "Shipping", icon: "truck" },
    ],
  },
  {
    grp: "Growers",
    items: [
      { href: "/dashboard/grower-report", label: "Growers Portal", icon: "chart" },
      { href: "/dashboard/ship-sheet", label: "Ship Sheet", icon: "truck" },
    ],
  },
  {
    grp: "Finance",
    items: [
      { href: "/dashboard/la-libreta", label: "Settlement Sheet", icon: "pencil" },
      { href: "/dashboard/paca", label: "PACA Trust", icon: "shield" },
      { href: "/dashboard/accounting", label: "Accounting", icon: "bank" },
    ],
  },
];

/* ⌘K palette: every nav page plus the common quick actions. */
const COMMANDS: { label: string; sub: string; href: string; icon: string }[] = [
  ...NAV.flatMap((g) => g.items.map((it) => ({ label: it.label, sub: g.grp, href: it.href, icon: it.icon }))),
  { label: "New Order", sub: "Sales Desk", href: "/dashboard/order-system/new", icon: "plus" },
  { label: "Send Today's Quote", sub: "Daily Quote Sheet", href: "/dashboard/daily-quote/send", icon: "send" },
  { label: "Receivables", sub: "Accounting", href: "/dashboard/order-system/receivables", icon: "bank" },
];

const trim = (p: string) => p.replace(/\/+$/, "") || "/";

export default function Sidebar() {
  const router = useRouter();
  const path = trim(usePathname() || "/");

  // Longest-prefix match across every item's href + aliases, so nested
  // routes (e.g. /order-system/availability) light up the right entry.
  const activeHref = useMemo(() => {
    let best = "";
    let bestLen = 0;
    for (const g of NAV) {
      for (const it of g.items) {
        for (const cand of [it.href, ...(it.also ?? [])]) {
          const c = trim(cand);
          if ((path === c || path.startsWith(c + "/")) && c.length > bestLen) {
            best = it.href;
            bestLen = c.length;
          }
        }
      }
    }
    return best;
  }, [path]);

  /* ---- ⌘K command palette ---- */
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const hits = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return COMMANDS.filter(
      (c) => !needle || c.label.toLowerCase().includes(needle) || c.sub.toLowerCase().includes(needle)
    ).slice(0, 9);
  }, [q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setOpen((o) => !o);
        setQ("");
        setSel(0);
        return;
      }
      if (!open) return;
      if (e.key === "Escape") setOpen(false);
      else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSel((s) => Math.min(s + 1, hits.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSel((s) => Math.max(0, s - 1));
      } else if (e.key === "Enter") {
        const it = hits[sel];
        if (it) {
          setOpen(false);
          router.push(it.href);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, hits, sel, router]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  // Close the palette when navigation lands.
  useEffect(() => {
    setOpen(false);
  }, [path]);

  return (
    <>
      <aside className="cjsb">
        <Link href="/dashboard" className="cjsb-brand">
          <img className="cjsb-logo-full" src="/crown-jewels-logo-dark.png" alt="Crown Jewels Produce" />
          <span className="cjsb-logo-crown" aria-hidden>
            <img src="/crown-jewels-logo-dark.png" alt="" />
          </span>
        </Link>

        <button
          type="button"
          className="cjsb-search"
          onClick={() => {
            setOpen(true);
            setQ("");
            setSel(0);
          }}
        >
          <Ic name="search" />
          <span>Search…</span>
          <kbd>⌘K</kbd>
        </button>

        <nav className="cjsb-nav">
          {NAV.map((g) => (
            <div key={g.grp}>
              <div className="cjsb-grp">{g.grp}</div>
              {g.items.map((it) => (
                <Link
                  key={it.href}
                  href={it.href}
                  className={`cjsb-item${activeHref === it.href ? " active" : ""}`}
                >
                  <Ic name={it.icon} />
                  <span>{it.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="cjsb-foot">
          <div className="cjsb-foot-user">
            <b>{CURRENT_USER.name}</b>
            <span>{CURRENT_USER.role}</span>
          </div>
          <Link href="/">Sign out</Link>
        </div>
      </aside>

      {open && (
        <div
          className="cjk-back"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="cjk">
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setSel(0);
              }}
              placeholder="Search apps and actions…"
              autoComplete="off"
              spellCheck={false}
            />
            <div className="cjk-list">
              {hits.length === 0 && <div className="cjk-empty">No matches</div>}
              {hits.map((c, i) => (
                <button
                  key={c.href + c.label}
                  type="button"
                  className={`cjk-item${i === sel ? " sel" : ""}`}
                  onMouseEnter={() => setSel(i)}
                  onClick={() => {
                    setOpen(false);
                    router.push(c.href);
                  }}
                >
                  <Ic name={c.icon} />
                  <span>{c.label}</span>
                  <span className="cjk-sub">{c.sub}</span>
                </button>
              ))}
            </div>
            <div className="cjk-foot">
              <span>↑↓ navigate</span>
              <span>↵ open</span>
              <span>esc close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
