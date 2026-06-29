"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { COMMODITIES, REGION_LABEL, type Region } from "@/data/commodities";

const ROTATING_PHRASES = [
  "Twelve months",
  "Every region",
  "Every season",
  "Field-direct",
];

// The widest phrase locks the container width so adjacent words don't shift.
const LONGEST_PHRASE = ROTATING_PHRASES.reduce(
  (a, b) => (a.length >= b.length ? a : b)
);

const EASE = [0.22, 1, 0.36, 1] as const;

export default function Hero() {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setPhraseIndex((i) => (i + 1) % ROTATING_PHRASES.length);
    }, 3800);
    return () => clearInterval(id);
  }, []);

  // Live data for the bottom ticker
  const monthIndex = new Date().getMonth() + 1;
  const inSeason = COMMODITIES.filter((c) => c.months.includes(monthIndex));

  // Pair each in-season commodity with a representative region for ticker copy
  const tickerItems = inSeason.map((c) => ({
    name: c.name,
    region: REGION_LABEL[(c.regions[0] ?? "california") as Region],
    accent: c.accent,
  }));
  const doubledTicker = [...tickerItems, ...tickerItems];

  // Fade-up entrance for headline words
  const wordVariants = {
    hidden: { opacity: 0, y: 28 },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: 0.4 + i * 0.07, duration: 0.7, ease: EASE },
    }),
  };

  return (
    <section className="relative overflow-hidden bg-ink text-paper min-h-screen flex flex-col">
      {/* Background video with subtle Ken Burns */}
      <video
        className="absolute inset-0 w-full h-full object-cover animate-kenburns"
        src="/hero-green-bell.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
      />

      {/* White wash over the video */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "rgba(255,255,255,0.15)" }}
        aria-hidden="true"
      />

      {/* Cinematic overlays */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(8,12,10,0.55) 0%, rgba(8,12,10,0.15) 35%, rgba(8,12,10,0.25) 60%, rgba(8,12,10,0.85) 100%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, rgba(8,12,10,0.65) 0%, rgba(8,12,10,0.25) 45%, rgba(8,12,10,0) 100%)",
        }}
      />

      {/* Content shell */}
      <div className="relative flex-1 flex flex-col">
        {/* Headline block — pinned to lower-left */}
        <div className="flex-1 flex items-end pt-28 lg:pt-32">
          <div className="mx-auto w-full max-w-7xl px-6 lg:px-10 pb-28 lg:pb-32">
            <div className="max-w-3xl">
              <h1
                className="font-display text-[2.6rem] sm:text-6xl lg:text-[5.25rem] leading-[0.98] tracking-tight text-paper"
                aria-label={`Sixteen commodities. ${ROTATING_PHRASES[phraseIndex]} of supply.`}
              >
                <span className="block overflow-hidden">
                  {["Sixteen", "commodities."].map((w, i) => (
                    <motion.span
                      key={w}
                      custom={i}
                      variants={wordVariants}
                      initial="hidden"
                      animate="show"
                      className="inline-block mr-[0.22em] last:mr-0"
                    >
                      {w}
                    </motion.span>
                  ))}
                </span>
                {/* Cycling phrase — its own line.
                    Invisible sizer locks the line's height + width to the
                    longest phrase, so layout never shifts and text isn't
                    clipped. The visible phrase fades + lifts in/out. */}
                <span className="block mt-1 sm:mt-2 lg:mt-3">
                  <span className="relative inline-block align-baseline">
                    {/* Soft lighter wash behind the cycling phrase for legibility */}
                    <span
                      aria-hidden="true"
                      className="absolute -inset-x-8 -inset-y-3 rounded-[2rem] pointer-events-none"
                      style={{
                        background:
                          "radial-gradient(60% 75% at 35% 50%, rgba(246,241,231,0.30) 0%, rgba(246,241,231,0.12) 55%, rgba(246,241,231,0) 100%)",
                        filter: "blur(10px)",
                      }}
                    />
                    <span
                      className="invisible italic whitespace-nowrap"
                      aria-hidden="true"
                    >
                      {LONGEST_PHRASE}
                    </span>
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={phraseIndex}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.5, ease: EASE }}
                        className="absolute left-0 top-0 italic text-brand whitespace-nowrap"
                        aria-hidden="true"
                      >
                        {ROTATING_PHRASES[phraseIndex]}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                </span>

                {/* "of supply." on its own line, beneath the cycling phrase */}
                <span className="block mt-1 sm:mt-2 lg:mt-3">
                  {["of", "supply."].map((w, i) => (
                    <motion.span
                      key={w}
                      custom={i + 3}
                      variants={wordVariants}
                      initial="hidden"
                      animate="show"
                      className="inline-block mr-[0.22em] last:mr-0"
                    >
                      {w}
                    </motion.span>
                  ))}
                </span>
              </h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0, duration: 0.8, ease: EASE }}
                className="mt-8 max-w-xl text-lg text-paper/80 leading-relaxed"
              >
                Crown Jewels Produce delivers a year-round program from
                California, Mexico, Chile, and Peru — built on three
                generations of grower relationships. One partner, one call,
                every season.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.15, duration: 0.8, ease: EASE }}
                className="mt-10 flex flex-wrap items-center gap-4"
              >
                <a
                  href="#contact"
                  className="inline-flex items-center gap-2 rounded-full bg-brand text-paper px-6 py-3.5 text-sm font-medium hover:bg-brand-deep transition-colors"
                >
                  Contact us
                  <span aria-hidden>→</span>
                </a>
                <a
                  href="#commodities"
                  className="inline-flex items-center gap-2 rounded-full border border-paper/30 px-6 py-3.5 text-sm font-medium text-paper hover:bg-paper hover:text-ink hover:border-paper transition-colors"
                >
                  See commodities
                </a>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Bottom: in-season ticker */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 1.2 }}
          className="relative border-t border-paper/15 bg-ink/30 backdrop-blur-sm"
        >
          <div className="overflow-hidden">
            <div className="flex w-max animate-marquee py-3.5">
              {doubledTicker.map((item, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-3 px-6 whitespace-nowrap"
                >
                  <span
                    className="block w-1.5 h-1.5 rounded-full"
                    style={{ background: item.accent }}
                  />
                  <span className="text-[10.5px] tracking-[0.22em] uppercase text-paper/70">
                    {item.name}
                  </span>
                  <span className="text-[10.5px] tracking-[0.22em] uppercase text-paper/40">
                    {item.region}
                  </span>
                  <span className="text-paper/20">·</span>
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Scroll cue — centered, with a traveling dot down the line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 1 }}
          className="hidden lg:flex absolute left-1/2 -translate-x-1/2 bottom-24 flex-col items-center gap-3 text-paper/55 pointer-events-none"
        >
          <span className="text-[10px] tracking-[0.32em] uppercase animate-scroll-pulse">
            Scroll
          </span>
          <span className="relative block w-px h-14 overflow-hidden bg-paper/20">
            <span className="absolute left-1/2 -translate-x-1/2 -top-1 w-1 h-3 rounded-full bg-gold animate-scroll-dot" />
          </span>
        </motion.div>
      </div>
    </section>
  );
}
