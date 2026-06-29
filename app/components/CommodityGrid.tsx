"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  COMMODITIES,
  REGION_COLOR,
  REGION_LABEL,
  type Commodity,
} from "@/data/commodities";

const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

export default function CommodityCarousel() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const [progress, setProgress] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const inView = useInView(sectionRef, { once: true, margin: "-100px" });
  const currentMonth = new Date().getMonth() + 1;

  const updateState = () => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const cur = el.scrollLeft;
    setProgress(max > 0 ? cur / max : 0);
    setCanPrev(cur > 4);
    setCanNext(cur < max - 4);
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateState();
    el.addEventListener("scroll", updateState, { passive: true });
    window.addEventListener("resize", updateState);
    return () => {
      el.removeEventListener("scroll", updateState);
      window.removeEventListener("resize", updateState);
    };
  }, []);

  const scrollByCards = (dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector("li");
    if (!card) return;
    const gap = 20;
    const step = card.getBoundingClientRect().width + gap;
    el.scrollBy({ left: dir * step * 2, behavior: "smooth" });
  };

  return (
    <section
      id="commodities"
      ref={sectionRef}
      className="relative py-24 lg:py-32 overflow-hidden"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 lg:mb-16">
          <div>
            <p className="eyebrow mb-4">Our commodities</p>
            <h2 className="font-display text-4xl lg:text-5xl tracking-tight max-w-2xl">
              Sixteen programs, kept in season every month of the year.
            </h2>
          </div>
          <div className="flex items-center gap-3 self-start md:self-auto">
            <CarouselButton
              direction="prev"
              disabled={!canPrev}
              onClick={() => scrollByCards(-1)}
            />
            <CarouselButton
              direction="next"
              disabled={!canNext}
              onClick={() => scrollByCards(1)}
            />
          </div>
        </div>
      </div>

      {/* Track */}
      <div className="relative">
        {/* Edge fade gradients */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-12 lg:w-20 z-10"
          style={{
            background:
              "linear-gradient(to right, var(--bg) 0%, transparent 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-12 lg:w-20 z-10"
          style={{
            background:
              "linear-gradient(to left, var(--bg) 0%, transparent 100%)",
          }}
        />

        <ul
          ref={trackRef}
          className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-6 px-6 lg:px-10 scrollbar-hide cursor-grab active:cursor-grabbing"
          style={{
            scrollPaddingLeft: "1.5rem",
            scrollPaddingRight: "1.5rem",
          }}
        >
          {/* Spacer to align first card with content */}
          <li aria-hidden className="shrink-0 w-0 lg:w-[calc((100vw-80rem)/2)] max-w-[40px]" />
          {COMMODITIES.map((c, i) => (
            <CommodityCard
              key={c.slug}
              commodity={c}
              index={i}
              inView={inView}
              currentMonth={currentMonth}
            />
          ))}
          {/* End spacer */}
          <li aria-hidden className="shrink-0 w-0 lg:w-[calc((100vw-80rem)/2)] max-w-[40px]" />
        </ul>
      </div>

      {/* Progress bar */}
      <div className="mx-auto max-w-7xl px-6 lg:px-10 mt-4">
        <div className="relative h-px bg-line/60">
          <motion.div
            className="absolute inset-y-0 left-0 bg-brand"
            initial={false}
            animate={{ width: `${(progress * 100).toFixed(2)}%` }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{ minWidth: "8%" }}
          />
        </div>
        <div className="mt-3 flex justify-between text-[11px] tracking-wider uppercase text-muted">
          <span>Drag, swipe, or use arrows</span>
          <span>{COMMODITIES.length} commodities</span>
        </div>
      </div>
    </section>
  );
}

function CarouselButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "prev" ? "Previous commodities" : "Next commodities"}
      className={`group relative w-12 h-12 rounded-full border transition-all duration-200 flex items-center justify-center ${
        disabled
          ? "border-line text-muted/50 cursor-not-allowed"
          : "border-ink/20 text-ink hover:border-ink hover:bg-ink hover:text-paper"
      }`}
    >
      <span aria-hidden className="text-base">
        {direction === "prev" ? "←" : "→"}
      </span>
    </button>
  );
}

function CommodityCard({
  commodity: c,
  index,
  inView,
  currentMonth,
}: {
  commodity: Commodity;
  index: number;
  inView: boolean;
  currentMonth: number;
}) {
  const active = new Set(c.months);
  const isInSeason = active.has(currentMonth);

  return (
    <motion.li
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        delay: 0.1 + index * 0.05,
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="shrink-0 snap-start w-[260px] sm:w-[280px] lg:w-[300px] group"
    >
      <a
        href={`#commodity-${c.slug}`}
        className="block bg-paper border border-line/60 hover:border-ink/30 transition-colors duration-300"
      >
        {/* Card body */}
        <div className="p-5 lg:p-6">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="block w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: c.accent }}
              />
              <h3 className="font-display text-xl lg:text-[1.4rem] text-ink leading-tight truncate">
                {c.name}
              </h3>
            </div>
            {isInSeason && (
              <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-leaf/10 px-2.5 py-1">
                <span className="block w-1.5 h-1.5 rounded-full bg-leaf animate-pulse" />
                <span className="text-[10px] tracking-wider uppercase text-leaf font-medium">
                  In season
                </span>
              </span>
            )}
          </div>

          {/* Region chips */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {c.regions.map((r) => (
              <span
                key={r}
                className="inline-flex items-center gap-1.5 text-[11px] text-muted"
              >
                <span
                  className="block w-1.5 h-1.5 rounded-full"
                  style={{ background: REGION_COLOR[r] }}
                />
                {REGION_LABEL[r]}
              </span>
            ))}
          </div>

          {/* Seasonality bar */}
          <div>
            <div className="grid grid-cols-12 gap-[2px]">
              {MONTHS.map((m, i) => {
                const on = active.has(i + 1);
                const isCurrent = i + 1 === currentMonth;
                return (
                  <div
                    key={i}
                    className={`h-1.5 rounded-[1px] transition-colors ${
                      isCurrent && on ? "ring-1 ring-ink/40" : ""
                    }`}
                    style={{
                      background: on ? c.accent : "rgba(14,20,17,0.07)",
                    }}
                    aria-label={`${m} ${on ? "in season" : "off"}`}
                  />
                );
              })}
            </div>
            <div className="mt-1.5 grid grid-cols-12 text-[9px] text-muted tracking-wider">
              {MONTHS.map((m, i) => (
                <span
                  key={i}
                  className={`text-center ${i + 1 === currentMonth ? "text-ink font-medium" : ""}`}
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
      </a>
    </motion.li>
  );
}
