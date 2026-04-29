"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

type Stat = {
  value: number;
  suffix?: string;
  label: string;
  body: string;
  viz: "grid" | "regions" | "months" | "years";
};

const STATS: Stat[] = [
  {
    value: 16,
    label: "Commodities",
    body: "From table grapes to asparagus — sixteen programs we run year-round.",
    viz: "grid",
  },
  {
    value: 9,
    label: "Growing regions",
    body: "Hand-picked partners across California, Mexico, Peru, and Chile.",
    viz: "regions",
  },
  {
    value: 12,
    label: "Months of supply",
    body: "A program built so you never have to re-source mid-year.",
    viz: "months",
  },
  {
    value: 30,
    suffix: "+",
    label: "Years shipping",
    body: "Three generations of grower relationships, kept by name.",
    viz: "years",
  },
];

export default function StatStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="bg-paper border-y border-line/60">
      <div className="mx-auto max-w-7xl px-6 lg:px-12 py-14 lg:py-20">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 flex items-center gap-5"
        >
          <span className="block w-10 h-px bg-gold" />
          <p className="eyebrow text-ink">By the numbers</p>
        </motion.div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <Card key={s.label} stat={s} index={i} inView={inView} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function Card({
  stat,
  index,
  inView,
}: {
  stat: Stat;
  index: number;
  inView: boolean;
}) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        delay: 0.15 + index * 0.12,
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative flex flex-col px-5 lg:px-7 py-6 lg:[&:not(:first-child)]:border-l border-line/50 max-sm:[&:not(:first-child)]:border-t max-lg:[&:nth-child(2)]:sm:border-l max-lg:[&:nth-child(3)]:border-t max-lg:[&:nth-child(4)]:sm:border-l max-lg:[&:nth-child(4)]:sm:border-t"
    >
      <div className="flex items-baseline gap-1.5">
        <span className="font-display text-[2.75rem] lg:text-[3.25rem] leading-none text-ink tabular-nums tracking-[-0.035em]">
          <CountUp value={stat.value} trigger={inView} delay={0.35 + index * 0.12} />
        </span>
        {stat.suffix && (
          <span className="font-display text-xl text-brand leading-none -translate-y-0.5">
            {stat.suffix}
          </span>
        )}
      </div>

      <p className="eyebrow text-ink mt-3 mb-2 text-[0.68rem]">{stat.label}</p>
      <p className="font-display italic text-[14px] text-ink-soft leading-snug max-w-[16rem]">
        {stat.body}
      </p>

      <div className="mt-5 flex items-end h-[60px]">
        <Viz kind={stat.viz} trigger={inView} delay={0.55 + index * 0.12} />
      </div>
    </motion.li>
  );
}

function CountUp({
  value,
  trigger,
  delay = 0,
}: {
  value: number;
  trigger: boolean;
  delay?: number;
}) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    const start = performance.now() + delay * 1000;
    const duration = 1500;
    let raf: number;
    const tick = (t: number) => {
      if (t < start) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const elapsed = t - start;
      const p = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(eased * value));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [trigger, value, delay]);
  return <>{n}</>;
}

function Viz({
  kind,
  trigger,
  delay,
}: {
  kind: Stat["viz"];
  trigger: boolean;
  delay: number;
}) {
  switch (kind) {
    case "grid":
      return <GridViz trigger={trigger} delay={delay} />;
    case "regions":
      return <RegionsViz trigger={trigger} delay={delay} />;
    case "months":
      return <MonthsViz trigger={trigger} delay={delay} />;
    case "years":
      return <YearsViz trigger={trigger} delay={delay} />;
  }
}

const GRID_COLORS = [
  "#7a1f2b", "#d27a1e", "#5b1a3a", "#5b0e1a",
  "#c89c3e", "#9b9457", "#c0341c", "#a0291f",
  "#b03028", "#a4895a", "#4f5e36", "#3b1f43",
  "#b88b1d", "#5c7a32", "#6b8a52", "#3e5028",
];

function GridViz({ trigger, delay }: { trigger: boolean; delay: number }) {
  return (
    <div className="grid grid-cols-8 gap-[4px] w-[128px]">
      {GRID_COLORS.map((c, i) => (
        <motion.span
          key={i}
          className="block aspect-square rounded-[1px]"
          style={{ background: c }}
          initial={{ opacity: 0, scale: 0.4 }}
          animate={trigger ? { opacity: 1, scale: 1 } : {}}
          transition={{
            delay: delay + (i % 8) * 0.04 + Math.floor(i / 8) * 0.06,
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
          }}
        />
      ))}
    </div>
  );
}

function RegionsViz({ trigger, delay }: { trigger: boolean; delay: number }) {
  const pins = [
    { x: 8,  y: 22, c: "#7a1f2b" },
    { x: 16, y: 32, c: "#7a1f2b" },
    { x: 26, y: 42, c: "#7a1f2b" },
    { x: 38, y: 50, c: "#b8853e" },
    { x: 50, y: 56, c: "#b8853e" },
    { x: 60, y: 60, c: "#b8853e" },
    { x: 72, y: 64, c: "#b8853e" },
    { x: 84, y: 74, c: "#2a4a5e" },
    { x: 94, y: 86, c: "#4f5e36" },
  ];
  return (
    <svg viewBox="0 0 100 100" className="w-[140px] h-[60px]">
      <motion.path
        d="M 8 22 C 30 42, 50 50, 70 62 S 90 80, 94 86"
        fill="none"
        stroke="rgba(122,31,43,0.35)"
        strokeWidth="0.7"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={trigger ? { pathLength: 1 } : {}}
        transition={{ delay, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
      />
      {pins.map((p, i) => (
        <g key={i}>
          <motion.circle
            cx={p.x}
            cy={p.y}
            r="2.6"
            fill={p.c}
            initial={{ scale: 0, opacity: 0 }}
            animate={trigger ? { scale: 1, opacity: 1 } : {}}
            transition={{
              delay: delay + 0.4 + i * 0.06,
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{ transformOrigin: `${p.x}px ${p.y}px` }}
          />
          <motion.circle
            cx={p.x}
            cy={p.y}
            r="5"
            fill="none"
            stroke={p.c}
            strokeWidth="0.4"
            opacity="0.4"
            initial={{ scale: 0, opacity: 0 }}
            animate={trigger ? { scale: 1, opacity: 0.4 } : {}}
            transition={{
              delay: delay + 0.55 + i * 0.06,
              duration: 0.5,
            }}
            style={{ transformOrigin: `${p.x}px ${p.y}px` }}
          />
        </g>
      ))}
    </svg>
  );
}

function MonthsViz({ trigger, delay }: { trigger: boolean; delay: number }) {
  const heights = [62, 70, 78, 84, 90, 86, 80, 78, 82, 90, 84, 70];
  return (
    <div className="w-[150px] h-[54px] flex items-end gap-[4px]">
      {heights.map((h, i) => (
        <motion.span
          key={i}
          className="flex-1 rounded-[1px]"
          style={{ background: "#4f5e36" }}
          initial={{ height: 0, opacity: 0 }}
          animate={trigger ? { height: `${h}%`, opacity: 1 } : {}}
          transition={{
            delay: delay + i * 0.05,
            duration: 0.55,
            ease: [0.22, 1, 0.36, 1],
          }}
        />
      ))}
    </div>
  );
}

function YearsViz({ trigger, delay }: { trigger: boolean; delay: number }) {
  const marks = [12, 50, 88];
  return (
    <svg viewBox="0 0 100 32" className="w-[160px] h-[44px]">
      <motion.line
        x1="2"
        y1="16"
        x2="98"
        y2="16"
        stroke="rgba(14,20,17,0.18)"
        strokeWidth="0.6"
        initial={{ pathLength: 0 }}
        animate={trigger ? { pathLength: 1 } : {}}
        transition={{ delay, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      />
      {marks.map((x, i) => (
        <motion.g
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={trigger ? { opacity: 1, scale: 1 } : {}}
          transition={{
            delay: delay + 0.7 + i * 0.18,
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{ transformOrigin: `${x}px 16px` }}
        >
          <circle cx={x} cy={16} r="3" fill="#b8853e" />
          <circle cx={x} cy={16} r="6" fill="none" stroke="rgba(184,133,62,0.4)" strokeWidth="0.5" />
        </motion.g>
      ))}
    </svg>
  );
}
