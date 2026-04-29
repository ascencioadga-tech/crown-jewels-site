"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { FAMILY, type FamilyMember } from "@/data/family";
import { REGION_COLOR, REGION_LABEL } from "@/data/commodities";

export default function FamilyCarousel() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const [progress, setProgress] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const inView = useInView(sectionRef, { once: true, margin: "-100px" });

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
      id="about"
      ref={sectionRef}
      className="relative py-24 lg:py-32 overflow-hidden"
    >
      {/* Ambient warmth */}
      <div
        className="absolute -top-20 left-1/4 w-[420px] h-[420px] rounded-full pointer-events-none opacity-40"
        style={{
          background:
            "radial-gradient(closest-side, rgba(184,133,62,0.15), rgba(184,133,62,0))",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 lg:mb-16"
        >
          <div>
            <div className="flex items-center gap-5 mb-5">
              <span className="block w-10 h-px bg-gold" />
              <p className="eyebrow">Our family</p>
            </div>
            <h2 className="font-display text-4xl lg:text-5xl tracking-tight max-w-2xl leading-[1.05]">
              Three generations of{" "}
              <span className="italic text-brand">grower partners.</span>
            </h2>
            <p className="mt-5 text-ink-soft text-base max-w-xl leading-relaxed">
              The growers we work with aren&apos;t suppliers — they&apos;re
              partners we&apos;ve known for years, sometimes decades. Every
              commodity in our program flows through this family.
            </p>
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
        </motion.div>
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
          {FAMILY.map((f, i) => (
            <FamilyCard key={f.name} member={f} index={i} inView={inView} />
          ))}
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
          <span>{FAMILY.length} grower partners</span>
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
      aria-label={direction === "prev" ? "Previous family members" : "Next family members"}
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

function FamilyCard({
  member: m,
  index,
  inView,
}: {
  member: FamilyMember;
  index: number;
  inView: boolean;
}) {
  const accent = REGION_COLOR[m.country];
  return (
    <motion.li
      initial={{ opacity: 0, y: 32, scale: 0.96 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{
        delay: 0.1 + index * 0.06,
        duration: 0.75,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -6 }}
      className="shrink-0 snap-start w-[260px] sm:w-[280px] lg:w-[300px] group cursor-default"
    >
      <div className="relative block bg-paper border border-line/60 group-hover:border-ink/40 transition-all duration-300 group-hover:shadow-[0_24px_60px_-20px_rgba(14,20,17,0.25)]">
        {/* Top accent line that animates in on hover */}
        <span
          aria-hidden
          className="absolute top-0 left-0 right-0 h-px overflow-hidden"
        >
          <span
            className="block h-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"
            style={{ background: accent }}
          />
        </span>

        {/* Logo placeholder area — square */}
        <div
          className="relative aspect-square overflow-hidden"
          data-placeholder={`grower-${m.name.toLowerCase().replace(/\s+/g, "-")}`}
          style={{
            background: `linear-gradient(135deg, ${accent}10 0%, ${accent}28 100%)`,
          }}
        >
          <div className="absolute inset-0 grain pointer-events-none" />

          {/* Decorative frame */}
          <div className="absolute inset-5 border border-ink/8 pointer-events-none transition-all duration-500 group-hover:inset-3 group-hover:border-ink/15" />

          {/* Centered monogram */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="font-display italic transition-all duration-500 group-hover:scale-110"
              style={{
                color: accent,
                fontSize: "5rem",
                lineHeight: 1,
                opacity: 0.55,
                letterSpacing: "-0.02em",
              }}
            >
              {m.initials}
            </span>
          </div>

          {/* Subtle accent ring that appears on hover */}
          <div
            aria-hidden
            className="absolute inset-0 rounded-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              boxShadow: `inset 0 0 0 1px ${accent}33`,
            }}
          />

          {/* Index + region tag */}
          <span className="absolute top-3 left-3 text-[10px] tracking-wider uppercase text-ink/45">
            {String(index + 1).padStart(2, "0")} / {FAMILY.length}
          </span>
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <span
              className="block w-1.5 h-1.5 rounded-full transition-all duration-300 group-hover:scale-150"
              style={{ background: accent }}
            />
            <span className="text-[10px] tracking-wider uppercase text-ink/55">
              {REGION_LABEL[m.country]}
            </span>
          </div>
        </div>

        {/* Card body */}
        <div className="p-5 lg:p-6">
          <h3 className="font-display text-xl lg:text-[1.4rem] text-ink leading-tight transition-colors duration-300 group-hover:text-brand">
            {m.name}
          </h3>
          <p className="mt-2 text-sm text-muted">{m.region}</p>
        </div>
      </div>
    </motion.li>
  );
}
