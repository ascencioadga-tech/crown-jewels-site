"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { commodities, sizeKey, CommoditySize } from "./data";
import { ProductConfig } from "./useProductConfig";

interface Props {
  open: boolean;
  onClose: () => void;
  config: ProductConfig;
  toggleCommodity: (id: string) => void;
  toggleSize: (key: string) => void;
  addCustomSize: (id: string, s: CommoditySize) => void;
  removeCustomSize: (id: string, index: number) => void;
  reset: () => void;
}

const groups = [
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

const FILTER_GROUPS: Record<string, string[]> = {
  Grapes:        ["Grapes"],
  Citrus:        ["Citrus"],
  "Stone Fruit": ["Pomegranates", "Cherries", "Pears"],
  Melons:        ["Melons"],
  Peppers:       ["Peppers"],
  Tomatoes:      ["Tomatoes"],
  Squash:        ["Squash"],
  Vegetables:    ["Cucumbers", "Eggplant", "Roots"],
  Greens:        ["Greens", "Asparagus"],
};

export default function ManageProducts({
  open,
  onClose,
  config,
  toggleCommodity,
  toggleSize,
  addCustomSize,
  removeCustomSize,
  reset,
}: Props) {
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState<(typeof groups)[number]>("All");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [newSize, setNewSize] = useState<CommoditySize>({ size: "", unit: "", pallet: "" });

  const filtered = useMemo(() => {
    return commodities.filter((c) => {
      const inGroup =
        groupFilter === "All" ||
        (FILTER_GROUPS[groupFilter]?.includes(c.group) ?? false);
      const matchesQuery =
        query.trim() === "" ||
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.group.toLowerCase().includes(query.toLowerCase());
      return inGroup && matchesQuery;
    });
  }, [groupFilter, query]);

  const visibleCount = commodities.length - config.hiddenCommodities.length;

  const submitNewSize = (commodityId: string) => {
    if (!newSize.size.trim() || !newSize.unit.trim()) return;
    addCustomSize(commodityId, {
      size: newSize.size.trim(),
      unit: newSize.unit.trim(),
      pallet: newSize.pallet.trim() || "—",
    });
    setNewSize({ size: "", unit: "", pallet: "" });
    setAdding(null);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="manage-backdrop"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="manage-drawer"
            role="dialog"
            aria-label="Manage products"
          >
            <header className="manage-head">
              <div>
                <h2>Manage Products</h2>
                <p>
                  Show, hide, or customize the commodities and sizes that appear
                  on today's quote. Changes save automatically.
                </p>
              </div>
              <button className="icon-btn" onClick={onClose} aria-label="Close">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </header>

            <div className="manage-toolbar">
              <div className="manage-search">
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
              <div className="manage-stats">
                <span className="manage-stat-num">{visibleCount}</span>
                <span>of {commodities.length} visible</span>
              </div>
            </div>

            <div className="manage-group-pills">
              {groups.map((g) => (
                <button
                  key={g}
                  className={g === groupFilter ? "active" : ""}
                  onClick={() => setGroupFilter(g)}
                >
                  {g}
                </button>
              ))}
            </div>

            <div className="manage-list">
              {filtered.map((c) => {
                const cHidden = config.hiddenCommodities.includes(c.id);
                const isExpanded = expanded === c.id;
                const customSizes = config.customSizes[c.id] || [];
                const allSizes = [...c.sizes, ...customSizes];
                const visibleSizes = allSizes.filter((_, i) => !config.hiddenSizes.includes(sizeKey(c.id, i))).length;

                return (
                  <div key={c.id} className={`mc-row ${cHidden ? "is-hidden" : ""}`}>
                    <div className="mc-main">
                      <div
                        className="mc-expand-target"
                        onClick={() => setExpanded(isExpanded ? null : c.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setExpanded(isExpanded ? null : c.id);
                          }
                        }}
                      >
                        {c.image ? (
                          <div className="mc-img mc-img-photo">
                            <img src={c.image} alt={c.name} />
                          </div>
                        ) : (
                          <div
                            className="mc-img"
                            aria-label={c.name}
                            style={{
                              background: `linear-gradient(135deg, ${c.accent}33 0%, ${c.accent}99 100%)`,
                            }}
                          >
                            <span className="cc-img-mono">{c.name.charAt(0)}</span>
                          </div>
                        )}
                        <div className="mc-info">
                          <div className="mc-name">{c.name}</div>
                          <div className="mc-meta">
                            <span>{c.group}</span>
                            <span>·</span>
                            <span>
                              {cHidden ? (
                                <em>Hidden</em>
                              ) : (
                                <>{visibleSizes} of {allSizes.length} sizes</>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Toggle
                        on={!cHidden}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleCommodity(c.id);
                        }}
                        label={`Toggle ${c.name}`}
                      />
                      <button
                        className={`mc-caret ${isExpanded ? "open" : ""}`}
                        onClick={() => setExpanded(isExpanded ? null : c.id)}
                        aria-label={isExpanded ? "Collapse sizes" : "Expand sizes"}
                      >
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </button>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="mc-sizes"
                        >
                          <div className="mc-sizes-head">
                            <span>Size</span>
                            <span>Unit</span>
                            <span># Pallet</span>
                            <span style={{ textAlign: "right" }}>Show</span>
                          </div>
                          {allSizes.map((s, i) => {
                            const k = sizeKey(c.id, i);
                            const isOff = config.hiddenSizes.includes(k);
                            const isCustom = i >= c.sizes.length;
                            return (
                              <div key={k} className={`mc-size-row ${isOff ? "is-off" : ""}`}>
                                <span className="sz">
                                  {s.size}
                                  {isCustom && <em className="custom-badge">Custom</em>}
                                </span>
                                <span>{s.unit}</span>
                                <span>{s.pallet}</span>
                                <span className="mc-size-actions">
                                  {isCustom && (
                                    <button
                                      className="del-btn"
                                      onClick={() => removeCustomSize(c.id, i - c.sizes.length)}
                                      title="Remove custom size"
                                    >
                                      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                      </svg>
                                    </button>
                                  )}
                                  <Toggle
                                    on={!isOff}
                                    onChange={() => toggleSize(k)}
                                    label={`Toggle ${c.name} ${s.size}`}
                                    small
                                  />
                                </span>
                              </div>
                            );
                          })}

                          {adding === c.id ? (
                            <div className="mc-add-form">
                              <input
                                type="text"
                                placeholder="Size (JBO, 4's, STA…)"
                                value={newSize.size}
                                onChange={(e) => setNewSize({ ...newSize, size: e.target.value })}
                              />
                              <input
                                type="text"
                                placeholder="Unit (11 LBS, CARTON…)"
                                value={newSize.unit}
                                onChange={(e) => setNewSize({ ...newSize, unit: e.target.value })}
                              />
                              <input
                                type="text"
                                placeholder="# Pallet"
                                value={newSize.pallet}
                                onChange={(e) => setNewSize({ ...newSize, pallet: e.target.value })}
                              />
                              <button
                                className="link-btn"
                                onClick={() => setAdding(null)}
                              >
                                Cancel
                              </button>
                              <button
                                className="add-confirm"
                                disabled={!newSize.size.trim() || !newSize.unit.trim()}
                                onClick={() => submitNewSize(c.id)}
                              >
                                Add size
                              </button>
                            </div>
                          ) : (
                            <button
                              className="mc-add-btn"
                              onClick={() => {
                                setAdding(c.id);
                                setNewSize({ size: "", unit: "", pallet: "" });
                              }}
                            >
                              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                              </svg>
                              Add custom size
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {filtered.length === 0 && (
                <div className="manage-empty">
                  No commodities match this search.
                </div>
              )}
            </div>

            <footer className="manage-foot">
              <button className="link-btn danger" onClick={reset}>
                Reset all customizations
              </button>
              <button className="btn btn-primary" onClick={onClose}>
                Done
              </button>
            </footer>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Toggle({
  on,
  onChange,
  label,
  small,
}: {
  on: boolean;
  onChange: (e: React.MouseEvent) => void;
  label: string;
  small?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className={`tf-toggle ${on ? "on" : ""} ${small ? "small" : ""}`}
    >
      <span className="thumb" />
    </button>
  );
}
