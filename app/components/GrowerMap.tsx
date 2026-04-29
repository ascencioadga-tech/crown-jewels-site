"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { REGION_COLOR, REGION_LABEL, type Region } from "@/data/commodities";
import type { CountryPath, ProjectedRegion } from "@/lib/americas-map";

type Props = {
  countries: CountryPath[];
  regions: ProjectedRegion[];
  view: { w: number; h: number };
  latLines: { lat: number; x1: number; y1: number; x2: number; y2: number }[];
  lngLines: { lng: number; x1: number; y1: number; x2: number; y2: number }[];
};

const COUNTRY_BY_REGION: Record<Region, number> = {
  california: 840,
  mexico: 484,
  peru: 604,
  chile: 152,
};

const CONNECTIONS: [string, string][] = [
  ["san-joaquin", "coachella"],
  ["san-joaquin", "salinas-central-coast"],
  ["coachella", "sinaloa"],
  ["sinaloa", "sonora"],
  ["sonora", "san-joaquin"],
  ["sinaloa", "michoacan"],
  ["sinaloa", "jalisco"],
  ["jalisco", "michoacan"],
  ["san-joaquin", "ica"],
  ["ica", "central-valley-cl"],
  ["central-valley-cl", "san-joaquin"],
];

// Manual label positioning to prevent overlaps in clustered regions.
// Values are in viewBox units (added on top of pin position).
type LabelOffset = { side: "left" | "right"; dy?: number; dxExtra?: number; leader?: boolean };
const LABEL_OFFSETS: Record<string, LabelOffset> = {
  "san-joaquin":          { side: "left",  dy: -18 },
  "salinas-central-coast":{ side: "left",  dy: 18 },
  "coachella":            { side: "right", dy: 0 },
  "sonora":               { side: "right", dy: 0 },
  "sinaloa":              { side: "right", dy: 0 },
  "jalisco":              { side: "right", dy: -10 },
  "michoacan":            { side: "right", dy: 18 },
  "ica":                  { side: "left",  dy: 0 },
  "central-valley-cl":    { side: "left",  dy: 0 },
};

export default function GrowerMap({
  countries,
  regions,
  view,
  latLines,
  lngLines,
}: Props) {
  const [selectedId, setSelectedId] = useState<string>(regions[0].id);
  const selected = regions.find((r) => r.id === selectedId)!;
  const activeCountryId = COUNTRY_BY_REGION[selected.country];
  const regionsById = Object.fromEntries(regions.map((r) => [r.id, r]));

  return (
    <section
      id="growers"
      className="relative bg-ink text-paper"
    >
      {/* Section header */}
      <div className="relative z-20 mx-auto max-w-7xl px-6 lg:px-10 pt-16 lg:pt-20 pb-8 lg:pb-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-center gap-5 mb-6">
            <span className="block w-10 h-px bg-gold" />
            <p className="eyebrow text-paper/55">Growers & regions</p>
          </div>
          <h2 className="font-display text-4xl lg:text-6xl tracking-tight max-w-4xl leading-[1.05]">
            A network of{" "}
            <span className="italic text-gold">family growers</span>, from
            California to Chile.
          </h2>
          <p className="mt-6 text-paper/65 text-lg max-w-2xl leading-relaxed">
            Every commodity in our program is sourced from grower partners we
            know by name — a deliberate, hand-built network across nine
            producing regions in four countries.
          </p>
        </motion.div>
      </div>

      {/* Map + sticky side card */}
      <div className="relative">
        {/* Atlas frame labels */}
        <div className="absolute top-6 left-0 right-0 flex justify-between text-[11px] tracking-[0.32em] uppercase text-paper/35 px-6 lg:px-12 z-10 pointer-events-none">
          <span>The Americas</span>
          <span>2026 · Growing Network</span>
        </div>
        <div className="absolute bottom-6 left-0 right-0 flex justify-between text-[11px] tracking-[0.32em] uppercase text-paper/35 px-6 lg:px-12 z-10 pointer-events-none">
          <span>N ↑</span>
          <span>9 Regions · 4 Countries</span>
        </div>

        <div className="relative grid lg:grid-cols-12">
          {/* Map (full width — col-span-12; card overlays) */}
          <div
            className="lg:col-span-12 lg:col-start-1 lg:row-start-1 relative w-full"
            style={{ aspectRatio: `${view.w}/${view.h}` }}
          >
            {/* Decorative warmth */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse 50% 45% at 35% 38%, rgba(184,133,62,0.10), rgba(0,0,0,0) 70%)",
              }}
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse 45% 50% at 50% 80%, rgba(122,31,43,0.08), rgba(0,0,0,0) 70%)",
              }}
            />

            <svg
              viewBox={`0 0 ${view.w} ${view.h}`}
              preserveAspectRatio="xMidYMid meet"
              className="absolute inset-0 w-full h-full"
            >
              <defs>
                <pattern
                  id="landDots"
                  x="0"
                  y="0"
                  width="6"
                  height="6"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="3" cy="3" r="0.55" fill="rgba(246,241,231,0.18)" />
                </pattern>
                <pattern
                  id="landDotsActive"
                  x="0"
                  y="0"
                  width="5"
                  height="5"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="2.5" cy="2.5" r="0.7" fill="rgba(184,133,62,0.55)" />
                </pattern>
                <clipPath id="americasClip">
                  {countries.map((c) => (
                    <path key={c.id} d={c.d} />
                  ))}
                </clipPath>
              </defs>

              {/* Latitude / longitude grid */}
              {latLines.map((l, i) => (
                <motion.line
                  key={`lat-${i}`}
                  x1={l.x1}
                  y1={l.y1}
                  x2={l.x2}
                  y2={l.y2}
                  stroke="rgba(246,241,231,0.04)"
                  strokeWidth="0.6"
                  strokeDasharray="2 4"
                  initial={{ pathLength: 0, opacity: 0 }}
                  whileInView={{ pathLength: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.06, duration: 1.0 }}
                />
              ))}
              {lngLines.map((l, i) => (
                <motion.line
                  key={`lng-${i}`}
                  x1={l.x1}
                  y1={l.y1}
                  x2={l.x2}
                  y2={l.y2}
                  stroke="rgba(246,241,231,0.04)"
                  strokeWidth="0.6"
                  strokeDasharray="2 4"
                  initial={{ pathLength: 0, opacity: 0 }}
                  whileInView={{ pathLength: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 + i * 0.06, duration: 1.0 }}
                />
              ))}

              {/* Country fills */}
              <g>
                {countries.map((c, i) => {
                  const isActive = c.id === activeCountryId;
                  return (
                    <motion.path
                      key={c.id}
                      d={c.d}
                      fill={
                        isActive
                          ? "rgba(122,31,43,0.18)"
                          : "rgba(246,241,231,0.025)"
                      }
                      stroke="rgba(246,241,231,0.18)"
                      strokeWidth="0.5"
                      strokeLinejoin="round"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.9,
                        delay: 0.05 + (i % 6) * 0.04,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      style={{
                        transition: "fill 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
                      }}
                    />
                  );
                })}
              </g>

              {/* Land dot fill */}
              <motion.rect
                x="0"
                y="0"
                width={view.w}
                height={view.h}
                fill="url(#landDots)"
                clipPath="url(#americasClip)"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.4, delay: 0.4 }}
              />

              {/* Active country highlight dots */}
              {countries
                .filter((c) => c.id === activeCountryId)
                .map((c) => (
                  <g key={`active-${c.id}`}>
                    <clipPath id={`active-clip-${c.id}`}>
                      <path d={c.d} />
                    </clipPath>
                    <rect
                      x="0"
                      y="0"
                      width={view.w}
                      height={view.h}
                      fill="url(#landDotsActive)"
                      clipPath={`url(#active-clip-${c.id})`}
                    />
                  </g>
                ))}

              {/* Sharper border on top */}
              <g pointerEvents="none">
                {countries.map((c) => (
                  <path
                    key={`stroke-${c.id}`}
                    d={c.d}
                    fill="none"
                    stroke="rgba(246,241,231,0.22)"
                    strokeWidth="0.55"
                    strokeLinejoin="round"
                  />
                ))}
              </g>

              {/* Connection arcs */}
              {CONNECTIONS.map(([a, b], i) => {
                const ra = regionsById[a];
                const rb = regionsById[b];
                if (!ra || !rb) return null;
                const midX = (ra.x + rb.x) / 2;
                const dist = Math.hypot(rb.x - ra.x, rb.y - ra.y);
                const midY = (ra.y + rb.y) / 2 - dist * 0.22;
                const isActive = a === selectedId || b === selectedId;
                return (
                  <motion.path
                    key={i}
                    d={`M ${ra.x} ${ra.y} Q ${midX} ${midY} ${rb.x} ${rb.y}`}
                    fill="none"
                    stroke={isActive ? "rgba(184,133,62,0.85)" : "rgba(184,133,62,0.32)"}
                    strokeWidth={isActive ? 1.4 : 0.9}
                    strokeDasharray="4 5"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    whileInView={{ pathLength: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 1.6,
                      delay: 0.6 + i * 0.1,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    style={{ transition: "stroke 0.4s, stroke-width 0.4s" }}
                  />
                );
              })}

              {/* Pulse rings */}
              {regions.map((r, i) => {
                const color = REGION_COLOR[r.country];
                return (
                  <motion.circle
                    key={`pulse-${r.id}`}
                    cx={r.x}
                    cy={r.y}
                    r="14"
                    fill={color}
                    opacity="0.25"
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{
                      scale: [0, 2.4, 2.4],
                      opacity: [0, 0.45, 0],
                    }}
                    viewport={{ once: true }}
                    transition={{
                      delay: 1.4 + i * 0.1,
                      duration: 2.4,
                      repeat: Infinity,
                      repeatDelay: 0.5,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    style={{ transformOrigin: `${r.x}px ${r.y}px` }}
                  />
                );
              })}

              {/* Pin dots */}
              {regions.map((r, i) => {
                const isSelected = r.id === selectedId;
                const color = REGION_COLOR[r.country];
                return (
                  <motion.g
                    key={`pin-${r.id}`}
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      delay: 1.0 + i * 0.07,
                      duration: 0.5,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    style={{ transformOrigin: `${r.x}px ${r.y}px` }}
                  >
                    {isSelected && (
                      <circle
                        cx={r.x}
                        cy={r.y}
                        r="14"
                        fill="none"
                        stroke={color}
                        strokeWidth="1"
                        opacity="0.6"
                      />
                    )}
                    <circle cx={r.x} cy={r.y} r="6" fill={color} />
                    <circle cx={r.x} cy={r.y} r="3" fill="rgba(246,241,231,0.95)" />
                  </motion.g>
                );
              })}
            </svg>

            {/* HTML overlay for pin labels + interactivity */}
            <div className="absolute inset-0 pointer-events-none">
              {regions.map((r) => {
                const isSelected = r.id === selectedId;
                const offset = LABEL_OFFSETS[r.id] ?? { side: "right" };
                // Convert viewBox coords to percentages of the rendered SVG
                const xPct = (r.x / view.w) * 100;
                const yPct = (r.y / view.h) * 100;
                return (
                  <button
                    key={`btn-${r.id}`}
                    type="button"
                    onMouseEnter={() => setSelectedId(r.id)}
                    onFocus={() => setSelectedId(r.id)}
                    onClick={() => setSelectedId(r.id)}
                    className="absolute pointer-events-auto -translate-x-1/2 -translate-y-1/2 group focus:outline-none"
                    style={{
                      left: `${xPct}%`,
                      top: `${yPct}%`,
                      width: 28,
                      height: 28,
                    }}
                    aria-label={`Select ${r.name}`}
                  >
                    <span
                      className={`absolute whitespace-nowrap text-[10.5px] tracking-[0.22em] uppercase transition-all duration-200 ${
                        isSelected
                          ? "text-paper font-medium"
                          : "text-paper/55 group-hover:text-paper/85"
                      }`}
                      style={{
                        ...(offset.side === "left"
                          ? { right: "calc(100% + 12px)" }
                          : { left: "calc(100% + 12px)" }),
                        top: `calc(50% + ${offset.dy ?? 0}px)`,
                        transform: "translateY(-50%)",
                      }}
                    >
                      {r.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sticky side card — desktop overlay */}
          <aside
            className="hidden lg:block lg:col-start-9 lg:col-span-4 lg:row-start-1 lg:sticky lg:top-24 lg:self-start lg:z-20 lg:m-8 lg:max-h-[calc(100vh-7rem)]"
            aria-live="polite"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="bg-paper text-ink p-7 rounded-[2px] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)]"
              >
                <div className="flex items-center gap-2 mb-5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: REGION_COLOR[selected.country] }}
                  />
                  <span className="eyebrow">
                    {REGION_LABEL[selected.country]}
                  </span>
                </div>
                <h3 className="font-display text-3xl tracking-tight leading-tight">
                  {selected.name}
                </h3>
                <p className="mt-4 text-ink-soft leading-relaxed text-[15px]">
                  {selected.blurb}
                </p>
                <div className="mt-6 pt-5 border-t border-line/60">
                  <p className="eyebrow mb-3">Programs sourced here</p>
                  <ul className="flex flex-wrap gap-1.5">
                    {selected.commodities.map((c) => (
                      <li
                        key={c}
                        className="text-[11px] px-2.5 py-1 rounded-full bg-bg-soft text-ink-soft"
                      >
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </AnimatePresence>
          </aside>
        </div>

        {/* Mobile/tablet stacked card */}
        <div className="lg:hidden mx-auto max-w-7xl px-6 pb-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={`m-${selected.id}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="bg-paper text-ink p-7 rounded-[2px]"
            >
              <div className="flex items-center gap-2 mb-5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: REGION_COLOR[selected.country] }}
                />
                <span className="eyebrow">
                  {REGION_LABEL[selected.country]}
                </span>
              </div>
              <h3 className="font-display text-3xl tracking-tight">
                {selected.name}
              </h3>
              <p className="mt-3 text-ink-soft leading-relaxed">
                {selected.blurb}
              </p>
              <div className="mt-5 pt-5 border-t border-line/60">
                <p className="eyebrow mb-3">Programs sourced here</p>
                <ul className="flex flex-wrap gap-1.5">
                  {selected.commodities.map((c) => (
                    <li
                      key={c}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-bg-soft text-ink-soft"
                    >
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom spacer */}
      <div className="hidden lg:block h-6" />
    </section>
  );
}
