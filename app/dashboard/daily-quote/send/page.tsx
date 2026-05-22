"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { commodities, customers, sizeKey } from "../data";
import { usePrices, useSelectedClients } from "../usePrices";
import { useProductConfig } from "../useProductConfig";
import Topbar from "../../Topbar";
import { CURRENT_USER } from "../../user";
import "../dashboard.css";

interface QuoteLine {
  commodityId: string;
  name: string;
  group: string;
  accent: string;
  image?: string;
  heat?: number;
  size: string;
  unit: string;
  pallet: string;
  priceText: string;
}

export default function SendQuotePage() {
  const today = new Date();
  const longDate = today.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const quoteId = `CJ-${today.getFullYear()}-${String(today.getMonth() * 30 + today.getDate()).padStart(4, "0")}`;

  const { prices } = usePrices();
  const { selected, setSelected } = useSelectedClients();
  const { config } = useProductConfig();

  const [subject, setSubject] = useState(`Crown Jewels — Daily Quote · ${longDate}`);
  const [message, setMessage] = useState(
    `Good morning,\n\nPlease find today's Crown Jewels Produce availability and pricing below. All prices FOB Fresno, CA. Reply with your needs and we'll have a confirmation back to you within the hour.\n\nBest,\n${CURRENT_USER.name} · Crown Jewels Sales`
  );
  const [showSent, setShowSent] = useState(false);

  const lines: QuoteLine[] = useMemo(() => {
    const out: QuoteLine[] = [];
    commodities.forEach((c) => {
      if (config.hiddenCommodities.includes(c.id)) return;
      const extras = config.customSizes[c.id] || [];
      const allSizes = [...c.sizes, ...extras];
      allSizes.forEach((s, i) => {
        const key = sizeKey(c.id, i);
        if (config.hiddenSizes.includes(key)) return;
        const text = (prices[key] || "").trim();
        if (text.length === 0) return;
        out.push({
          commodityId: c.id,
          name: c.name,
          group: c.group,
          accent: c.accent,
          image: c.image,
          heat: c.heat,
          size: s.size,
          unit: s.unit,
          pallet: s.pallet,
          priceText: text,
        });
      });
    });
    return out;
  }, [prices, config]);

  const groupedLines = useMemo(() => {
    const groups: Record<string, QuoteLine[]> = {};
    lines.forEach((l) => {
      if (!groups[l.group]) groups[l.group] = [];
      groups[l.group].push(l);
    });
    return groups;
  }, [lines]);

  const toggleClient = (id: string) => {
    setSelected((cur) =>
      cur.includes(id) ? cur.filter((c) => c !== id) : [...cur, id]
    );
  };

  const selectAll = () => setSelected(customers.map((c) => c.id));
  const clearAll = () => setSelected([]);

  const send = () => {
    if (selected.length === 0 || lines.length === 0) return;
    setShowSent(true);
    setTimeout(() => setShowSent(false), 3800);
  };

  return (
    <div className="tf-dash tf-send">
      <Topbar
        tool="Daily Quote"
        nav={[
          { label: "Availability", href: "/dashboard/daily-quote" },
          { label: "Send", href: "/dashboard/daily-quote/send", active: true },
        ]}
      />

      <main className="send-main">
        {/* LEFT: client picker sidebar */}
        <motion.aside
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45 }}
          className="card client-sidebar"
        >
          <div className="card-head">
            <h2>Recipients</h2>
            <span className="sel-count">{selected.length} / {customers.length}</span>
          </div>
          <div className="sidebar-actions">
            <button className="link-btn" onClick={selectAll}>Select all</button>
            <span className="sep">·</span>
            <button className="link-btn" onClick={clearAll}>Clear</button>
          </div>
          <ul className="client-list">
            {customers.map((c) => {
              const isOn = selected.includes(c.id);
              return (
                <li key={c.id}>
                  <button
                    className={`client-row ${isOn ? "on" : ""}`}
                    onClick={() => toggleClient(c.id)}
                  >
                    <span className="cc-box">
                      {isOn && (
                        <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </span>
                    <span className="cc-info">
                      <span className="cc-name">{c.name}</span>
                      <span className="cc-ch">{c.channel}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </motion.aside>

        {/* RIGHT: email + quote sheet */}
        <motion.section
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="email-canvas"
        >
          <div className="email-head">
            <div className="email-row">
              <label>From</label>
              <div className="email-pill from">
                <span className="avatar">{CURRENT_USER.initials}</span>
                {CURRENT_USER.name} · {CURRENT_USER.email}
              </div>
            </div>
            <div className="email-row">
              <label>To</label>
              <div className="email-pills">
                <AnimatePresence>
                  {selected.length === 0 ? (
                    <span className="email-pill empty">Select recipients on the left ←</span>
                  ) : (
                    customers
                      .filter((c) => selected.includes(c.id))
                      .map((c) => (
                        <motion.span
                          key={c.id}
                          layout
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.85 }}
                          transition={{ duration: 0.2 }}
                          className="email-pill recipient"
                        >
                          {c.name}
                          <button onClick={() => toggleClient(c.id)} aria-label={`Remove ${c.name}`}>
                            ×
                          </button>
                        </motion.span>
                      ))
                  )}
                </AnimatePresence>
              </div>
            </div>
            <div className="email-row">
              <label>Subject</label>
              <input
                className="email-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
          </div>

          <div className="email-body">
            <textarea
              className="email-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />

            {/* Quote sheet preview */}
            <div className="quote-sheet">
              <span className="qs-gold-rule" aria-hidden="true" />
              <div className="qs-head">
                <div className="qs-brand">
                  <span className="qs-brand-logo-crop" aria-hidden="true">
                    <img src="/crown-jewels-logo.png" alt="" />
                  </span>
                  <div>
                    <span className="qs-brand-mark">
                      Crown <em>Jewels</em>
                    </span>
                    <div className="qs-brand-meta">
                      <div>Year-round produce programs · Grower-direct</div>
                      <div>Fresno, California · sales@crownjewelsproduce.com</div>
                    </div>
                  </div>
                </div>
                <div className="qs-meta">
                  <div className="qs-label">Daily Quote</div>
                  <div className="qs-id">{quoteId}</div>
                  <div className="qs-date">{longDate}</div>
                </div>
              </div>

              <div className="qs-table-head qs-table-head-4">
                <span>Commodity</span>
                <span>Size</span>
                <span>Unit · Pallet</span>
                <span style={{ textAlign: "right" }}>Price</span>
              </div>

              {lines.length === 0 ? (
                <div className="qs-empty">
                  <strong>No priced sizes yet.</strong>
                  Go back to the availability list and enter prices on at least one size variant.
                </div>
              ) : (
                <div className="qs-table">
                  {Object.entries(groupedLines).map(([group, items]) => (
                    <div key={group} className="qs-group">
                      <div className="qs-group-label">{group}</div>
                      {items.map((l, i) => (
                        <div key={`${l.commodityId}-${i}`} className="qs-row qs-row-4">
                          <div className="qs-cell name">
                            {l.image ? (
                              <span className="qs-cell-photo" aria-hidden="true">
                                <img src={l.image} alt="" />
                              </span>
                            ) : (
                              <span
                                className="qs-cell-swatch"
                                aria-hidden="true"
                                style={{
                                  background: `linear-gradient(135deg, ${l.accent}33 0%, ${l.accent}99 100%)`,
                                }}
                              />
                            )}
                            <div>
                              <div className="qs-cell-name">{l.name}</div>
                              {l.heat && (
                                <div className="qs-cell-heat">Heat {l.heat}/5</div>
                              )}
                            </div>
                          </div>
                          <div className="qs-cell sz">{l.size}</div>
                          <div className="qs-cell pack">
                            {l.unit} <span className="dim">· #{l.pallet}</span>
                          </div>
                          <div className="qs-cell price">{l.priceText}</div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              <div className="qs-foot">
                <span className="qs-gold-rule" aria-hidden="true" />
                <div className="qs-foot-grid">
                  <div className="qs-foot-block">
                    <div className="qs-foot-label">Sourcing</div>
                    <div className="qs-foot-text">
                      California · Mexico · Peru · Chile · year-round program
                    </div>
                  </div>
                  <div className="qs-foot-block">
                    <div className="qs-foot-label">Terms</div>
                    <div className="qs-foot-text">
                      FOB Fresno, CA · Subject to availability · Cold-chain monitored
                    </div>
                  </div>
                  <div className="qs-foot-block">
                    <div className="qs-foot-label">Contact</div>
                    <div className="qs-foot-text">
                      sales@crownjewelsproduce.com<br />
                      crownjewelsproduce.com
                    </div>
                  </div>
                </div>
                <div className="qs-thanks">
                  <span>—</span>
                  <span className="qs-thanks-mark">
                    Crown <em>Jewels</em> Sales
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="send-bar">
            <div className="send-meta">
              {selected.length > 0 ? (
                <>
                  <strong>{selected.length}</strong> recipient{selected.length === 1 ? "" : "s"}
                  {lines.length > 0 && (
                    <> · <strong>{lines.length}</strong> priced line{lines.length === 1 ? "" : "s"}</>
                  )}
                </>
              ) : (
                <span style={{ color: "rgba(30,39,25,0.45)" }}>Select recipients to enable send</span>
              )}
            </div>
            <button
              className="btn btn-primary btn-lg"
              onClick={send}
              disabled={selected.length === 0 || lines.length === 0}
            >
              Send Quote
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </motion.section>
      </main>

      <AnimatePresence>
        {showSent && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="toast"
          >
            <span className="dot" />
            Sent to {selected.length} recipient{selected.length === 1 ? "" : "s"} · {lines.length} priced lines
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
