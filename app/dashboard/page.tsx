"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { commodities, sizeKey } from "./data";
import { usePrices } from "./usePrices";
import { useProductConfig } from "./useProductConfig";
import ManageProducts from "./ManageProducts";
import "./dashboard.css";

const filters = [
  "All",
  "Grapes",
  "Citrus",
  "Stone Fruit",
  "Melons",
  "Peppers",
  "Tomatoes",
  "Squash",
  "Vegetables",
  "Greens",
] as const;

// Map filter pills to which c.group values they include
const FILTER_GROUPS: Record<string, string[]> = {
  "Grapes":      ["Grapes"],
  "Citrus":      ["Citrus"],
  "Stone Fruit": ["Pomegranates", "Cherries", "Pears"],
  "Melons":      ["Melons"],
  "Peppers":     ["Peppers"],
  "Tomatoes":    ["Tomatoes"],
  "Squash":      ["Squash"],
  "Vegetables":  ["Cucumbers", "Eggplant", "Roots"],
  "Greens":      ["Greens", "Asparagus"],
};

export default function DashboardPage() {
  const today = new Date();
  const month = today.getMonth();
  const dateText = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [query, setQuery] = useState("");
  const [manageOpen, setManageOpen] = useState(false);
  const { prices, setPrices } = usePrices();
  const configHook = useProductConfig();
  const { config, toggleCommodity } = configHook;

  // Apply user customizations: append custom sizes, drop hidden commodities and sizes.
  const customized = useMemo(() => {
    return commodities
      .filter((c) => !config.hiddenCommodities.includes(c.id))
      .map((c) => {
        const extras = config.customSizes[c.id] || [];
        const sizes = [...c.sizes, ...extras].filter(
          (_, i) => !config.hiddenSizes.includes(sizeKey(c.id, i))
        );
        return { ...c, sizes };
      })
      .filter((c) => c.sizes.length > 0);
  }, [config]);

  const filtered = useMemo(() => {
    return customized.filter((c) => {
      const matchesFilter =
        filter === "All" ||
        (FILTER_GROUPS[filter]?.includes(c.group) ?? false);
      const matchesQuery =
        query.trim() === "" ||
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.group.toLowerCase().includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [customized, filter, query]);

  const setPrice = (key: string, v: string) => {
    setPrices((cur) => ({ ...cur, [key]: v }));
  };

  // For correct keying with hidden sizes, we need to know original indexes
  const getOriginalIndex = (commodityId: string, sizeIndexInVisible: number) => {
    const original = commodities.find((c) => c.id === commodityId);
    if (!original) return sizeIndexInVisible;
    const extras = config.customSizes[commodityId] || [];
    const allSizes = [...original.sizes, ...extras];
    const visibleIndexes = allSizes
      .map((_, i) => i)
      .filter((i) => !config.hiddenSizes.includes(sizeKey(commodityId, i)));
    return visibleIndexes[sizeIndexInVisible] ?? sizeIndexInVisible;
  };

  const totalSlots = filtered.reduce((s, c) => s + c.sizes.length, 0);
  const filledSlots = filtered.reduce((s, c) => {
    return (
      s +
      c.sizes.filter((_, i) => {
        const origIdx = getOriginalIndex(c.id, i);
        return (prices[sizeKey(c.id, origIdx)] || "").trim().length > 0;
      }).length
    );
  }, 0);

  const totalHidden =
    config.hiddenCommodities.length + config.hiddenSizes.length;

  return (
    <div className="tf-dash">
      <header className="topbar">
        <div className="topbar-inner">
          <Link href="/dashboard" className="brand">
            <span className="brand-mark">
              Crown <em>Jewels</em>
            </span>
            <span className="brand-tag">Daily Quote</span>
          </Link>

          <div className="topbar-date">
            <span className="dot" />
            <span>{dateText}</span>
          </div>

          <div className="search">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="search"
              placeholder="Search commodities…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="user-menu" title="Crown Jewels Team">
            <div className="avatar">CJ</div>
            <div className="user-name">Crown Jewels Team</div>
            <Link href="/" className="logout-link">
              Sign out
            </Link>
          </div>
        </div>
      </header>

      <main>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="page-head"
        >
          <div>
            <h1>
              Good morning, team.<br />
              <span className="accent">Set today&apos;s prices.</span>
            </h1>
            <p className="sub">
              Enter your daily quote per size · FOB Fresno, CA · free-form so you
              can type &quot;Market&quot;, &quot;Call&quot;, or a dollar amount per size variant.
            </p>
          </div>
          <div className="quick-actions">
            <button className="btn btn-ghost" onClick={() => setManageOpen(true)}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Manage
              {totalHidden > 0 && (
                <span className="manage-badge">{totalHidden}</span>
              )}
            </button>
            <Link href="/dashboard/send" className="btn btn-primary">
              Send to clients
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="card"
        >
          <div className="card-head">
            <h2>Today's Availability</h2>
            <div className="filled-meter">
              <span className="num">{filledSlots}</span> / {totalSlots} priced
            </div>
            <div className="filter-pills">
              {filters.map((f) => (
                <button
                  key={f}
                  className={f === filter ? "active" : ""}
                  onClick={() => setFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="commodity-grid">
            {filtered.map((c) => {
              const status = c.availability[month];
              const filledHere = c.sizes.filter((_, i) => (prices[sizeKey(c.id, i)] || "").trim().length > 0).length;
              return (
                <div key={c.id} className={`commodity-card status-${status}`}>
                  <div className="cc-head">
                    <div
                      className="cc-img"
                      aria-label={c.name}
                      style={{
                        background: `linear-gradient(135deg, ${c.accent}33 0%, ${c.accent}99 100%)`,
                      }}
                    >
                      <span className="cc-img-mono">{c.name.charAt(0)}</span>
                    </div>
                    <div className="cc-head-body">
                      <div className="cc-name">{c.name}</div>
                      <div className="cc-meta">
                        <span>{c.group}</span>
                        {c.heat && (
                          <span className="heat" aria-label={`Heat ${c.heat} of 5`}>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <span key={n} className={n <= c.heat! ? "on" : ""} />
                            ))}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="cc-head-right">
                      <span className={`status ${status}`}>
                        {status === "peak" ? "Peak" : status === "available" ? "Avail" : "Out"}
                      </span>
                      <div className="cc-filled-pill">
                        {filledHere}/{c.sizes.length}
                      </div>
                    </div>
                  </div>
                  <button
                    className="cc-hide-btn"
                    title={`Hide ${c.name} from today's quote`}
                    onClick={() => toggleCommodity(c.id)}
                    aria-label={`Hide ${c.name}`}
                  >
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  </button>

                  <div className="cc-size-table">
                    <div className="cc-size-header">
                      <span>Size</span>
                      <span>Unit</span>
                      <span># Pallet</span>
                      <span>Price</span>
                    </div>
                    {c.sizes.map((s, i) => {
                      const origIdx = getOriginalIndex(c.id, i);
                      const key = sizeKey(c.id, origIdx);
                      return (
                        <div key={key} className="cc-size-row">
                          <span className="cc-size-cell sz">{s.size}</span>
                          <span className="cc-size-cell unit">{s.unit}</span>
                          <span className="cc-size-cell pal">{s.pallet}</span>
                          <input
                            type="text"
                            inputMode="text"
                            placeholder="$ / Market / Call"
                            value={prices[key] || ""}
                            onChange={(e) => setPrice(key, e.target.value)}
                            aria-label={`Price for ${c.name} ${s.size} ${s.unit}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: "rgba(30,39,25,0.45)", fontSize: 13 }}>
              No commodities match this filter.
            </div>
          )}
        </motion.section>

        <div className="page-foot">
          <button className="btn btn-ghost" onClick={() => setPrices({})}>
            Clear all prices
          </button>
          <Link href="/dashboard/send" className="btn btn-primary btn-lg">
            Send to clients
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </main>

      <ManageProducts
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        config={configHook.config}
        toggleCommodity={configHook.toggleCommodity}
        toggleSize={configHook.toggleSize}
        addCustomSize={configHook.addCustomSize}
        removeCustomSize={configHook.removeCustomSize}
        reset={configHook.reset}
      />
    </div>
  );
}
