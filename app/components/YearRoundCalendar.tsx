"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  COMMODITIES,
  REGION_COLOR,
  REGION_LABEL,
  type Region,
} from "@/data/commodities";

const MONTHS_FULL = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const REGIONS_ORDER: Region[] = ["california", "mexico", "peru", "chile"];

const FEATURED = [
  "table-grapes",
  "citrus",
  "pomegranates",
  "cherries",
  "melons",
  "pears",
  "asparagus",
  "brussels-sprouts",
  "bell-peppers",
  "chili-peppers",
  "tomatoes",
  "cucumbers",
  "squash",
  "eggplant",
  "onions",
  "green-beans",
];

function regionMonths(slug: string, region: Region): Set<number> {
  const c = COMMODITIES.find((x) => x.slug === slug);
  if (!c) return new Set();
  if (!c.regions.includes(region)) return new Set();
  const windowsByRegion: Record<Region, Record<string, number[]>> = {
    california: {
      "table-grapes":     [5,6,7,8,9,10,11],
      "citrus":           [11,12,1,2,3,4,5],
      "pomegranates":     [9,10,11,12,1],
      "cherries":         [5,6,7],
      "melons":           [5,6,7,8,9,10],
      "pears":            [8,9,10,11,12,1,2,3,4],
      "asparagus":        [2,3,4,5,6],
      "brussels-sprouts": [9,10,11,12,1,2,3,4,5],
      "bell-peppers":     [6,7,8,9,10,11],
      "chili-peppers":    [6,7,8,9,10],
      "tomatoes":         [5,6,7,8,9,10,11],
      "cucumbers":        [5,6,7,8,9,10],
      "squash":           [5,6,7,8,9,10],
      "eggplant":         [6,7,8,9,10,11],
      "onions":           [4,5,6,7,8,9,10],
    },
    mexico: {
      "table-grapes":     [4,5,6],
      "citrus":           [9,10,11,12,1,2,3,4,5,6],
      "melons":           [11,12,1,2,3,4],
      "asparagus":        [9,10,11,2,3],
      "brussels-sprouts": [11,12,1,2,3],
      "bell-peppers":     [11,12,1,2,3,4,5],
      "chili-peppers":    [11,12,1,2,3,4,5],
      "tomatoes":         [11,12,1,2,3,4,5],
      "cucumbers":        [11,12,1,2,3,4],
      "squash":           [11,12,1,2,3,4],
      "eggplant":         [12,1,2,3,4,5],
      "onions":           [11,12,1,2,3,4],
      "green-beans":      [10,11,12,1,2,3,4,5],
    },
    peru: {
      "table-grapes": [11,12,1,2,3],
      "asparagus":    [8,9,10,11],
      "pomegranates": [3,4,5],
    },
    chile: {
      "table-grapes": [12,1,2,3,4],
      "cherries":     [11,12,1],
    },
  };
  return new Set(windowsByRegion[region]?.[slug] ?? c.months);
}

const EASE = [0.22, 1, 0.36, 1] as const;

export default function YearRoundCalendar() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const currentMonth = new Date().getMonth() + 1;

  return (
    <section
      id="programs"
      ref={ref}
      className="relative bg-bg-soft border-y border-line/60 overflow-hidden"
    >
      {/* Ambient warmth */}
      <div
        className="absolute -top-40 -left-40 w-[480px] h-[480px] rounded-full pointer-events-none opacity-50"
        style={{
          background:
            "radial-gradient(closest-side, rgba(184,133,62,0.18), rgba(184,133,62,0))",
        }}
      />
      <div
        className="absolute -bottom-40 -right-40 w-[480px] h-[480px] rounded-full pointer-events-none opacity-50"
        style={{
          background:
            "radial-gradient(closest-side, rgba(122,31,43,0.16), rgba(122,31,43,0))",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-10 py-24 lg:py-32">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: EASE }}
          className="max-w-3xl mb-12"
        >
          <div className="flex items-center gap-5 mb-5">
            <span className="block w-10 h-px bg-gold" />
            <p className="eyebrow">The year-round program</p>
          </div>
          <h2 className="font-display text-4xl lg:text-5xl tracking-tight">
            One partner, four hemispheres,{" "}
            <span className="italic text-brand">no gaps in supply.</span>
          </h2>
          <p className="mt-6 text-ink-soft text-lg leading-relaxed">
            We build the calendar by handing volume between growing regions as
            the seasons turn — so retail and foodservice buyers never have to
            re-source mid-year.
          </p>
        </motion.div>

        {/* Region legend */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.6, ease: EASE }}
          className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-6"
        >
          {REGIONS_ORDER.map((r) => (
            <div key={r} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-sm"
                style={{ background: REGION_COLOR[r] }}
              />
              <span className="text-sm text-ink-soft">{REGION_LABEL[r]}</span>
            </div>
          ))}
          <div className="hidden sm:flex items-center gap-2 ml-auto">
            <span className="block w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            <span className="text-[11px] tracking-wider uppercase text-muted">
              Current month
            </span>
          </div>
        </motion.div>

        {/* Calendar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="relative bg-paper border border-line rounded-[2px] overflow-hidden"
        >
          {/* Current-month vertical highlight */}
          <span
            aria-hidden
            className="absolute top-0 bottom-0 z-0 pointer-events-none"
            style={{
              left: `calc(160px + (100% - 160px) * ${(currentMonth - 1) / 12})`,
              width: `calc((100% - 160px) / 12)`,
              background:
                "linear-gradient(180deg, rgba(184,133,62,0.10) 0%, rgba(184,133,62,0.04) 100%)",
              borderLeft: "1px solid rgba(184,133,62,0.28)",
              borderRight: "1px solid rgba(184,133,62,0.28)",
            }}
          />

          {/* Month header */}
          <div className="relative grid grid-cols-[160px_repeat(12,minmax(0,1fr))] border-b border-line/70">
            <div className="px-4 py-3 text-[11px] tracking-wider uppercase text-muted">
              Commodity
            </div>
            {MONTHS_FULL.map((m, i) => {
              const isCurrent = i + 1 === currentMonth;
              return (
                <div
                  key={m}
                  className={`px-2 py-3 text-[11px] tracking-wider uppercase text-center border-l border-line/40 transition-colors ${
                    isCurrent ? "text-ink font-medium" : "text-muted"
                  }`}
                >
                  {m}
                </div>
              );
            })}
          </div>

          {FEATURED.map((slug, rowIdx) => {
            const c = COMMODITIES.find((x) => x.slug === slug)!;
            return (
              <motion.div
                key={slug}
                initial={{ opacity: 0, y: 8 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  delay: 0.5 + rowIdx * 0.09,
                  duration: 0.7,
                  ease: EASE,
                }}
                className="relative grid grid-cols-[160px_repeat(12,minmax(0,1fr))] border-b border-line/40 last:border-b-0 items-stretch hover:bg-bg-soft/40 transition-colors duration-200 group"
              >
                <div className="px-4 py-3 flex items-center">
                  <span className="font-display text-[15px] text-ink group-hover:text-brand transition-colors">
                    {c.name}
                  </span>
                </div>
                {Array.from({ length: 12 }, (_, i) => {
                  const month = i + 1;
                  const stack = REGIONS_ORDER.filter((r) =>
                    regionMonths(slug, r).has(month)
                  );
                  const isCurrent = month === currentMonth;
                  return (
                    <div
                      key={i}
                      className={`relative border-l border-line/30 px-1.5 py-2 flex flex-col gap-[3px] justify-center min-h-[44px] ${
                        isCurrent ? "" : ""
                      }`}
                    >
                      {stack.length === 0 ? (
                        <span className="block h-[6px]" />
                      ) : (
                        stack.map((r, si) => (
                          <motion.span
                            key={r}
                            initial={{ scaleX: 0, opacity: 0 }}
                            animate={
                              inView
                                ? { scaleX: 1, opacity: 1 }
                                : {}
                            }
                            transition={{
                              delay: 0.75 + rowIdx * 0.09 + i * 0.06 + si * 0.07,
                              duration: 0.85,
                              ease: EASE,
                            }}
                            title={`${REGION_LABEL[r]} · ${MONTHS_FULL[i]} · ${c.name}`}
                            className="block h-[6px] rounded-[1px] origin-left"
                            style={{ background: REGION_COLOR[r] }}
                          />
                        ))
                      )}
                    </div>
                  );
                })}
              </motion.div>
            );
          })}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="mt-6 text-sm text-muted"
        >
          All 16 commodities, by region, by month. Detailed weekly availability
          sheets sent on request.
        </motion.p>
      </div>
    </section>
  );
}
