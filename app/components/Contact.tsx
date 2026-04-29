"use client";

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function Contact() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 900));
    setSubmitting(false);
    setSent(true);
  };

  return (
    <section
      id="contact"
      ref={ref}
      className="relative bg-bg-soft border-y border-line/60 overflow-hidden"
    >
      {/* Ambient warmth */}
      <div
        className="absolute -top-32 -right-32 w-[480px] h-[480px] rounded-full pointer-events-none opacity-50"
        style={{
          background:
            "radial-gradient(closest-side, rgba(184,133,62,0.16), rgba(184,133,62,0))",
        }}
      />
      <div
        className="absolute -bottom-32 -left-32 w-[420px] h-[420px] rounded-full pointer-events-none opacity-40"
        style={{
          background:
            "radial-gradient(closest-side, rgba(122,31,43,0.14), rgba(122,31,43,0))",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-10 py-24 lg:py-32 grid lg:grid-cols-12 gap-12">
        {/* Left column */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: EASE }}
          className="lg:col-span-5"
        >
          <div className="flex items-center gap-5 mb-5">
            <span className="block w-10 h-px bg-gold" />
            <p className="eyebrow">Talk to us</p>
          </div>
          <h2 className="font-display text-4xl lg:text-5xl tracking-tight">
            Request an{" "}
            <span className="italic text-brand">availability sheet.</span>
          </h2>
          <p className="mt-6 text-ink-soft text-lg leading-relaxed">
            Tell us what you need and we&apos;ll route you to the right rep —
            usually within the same business day.
          </p>

          <ul className="mt-10 space-y-0">
            {[
              { label: "Sales", value: "sales@crownjewelsproduce.com", href: "mailto:sales@crownjewelsproduce.com" },
              { label: "Dispatch", value: "dispatch@crownjewelsproduce.com", href: "mailto:dispatch@crownjewelsproduce.com" },
              { label: "Phone", value: "(559) 000-0000", href: "tel:+15590000000" },
              { label: "Office", value: "Fresno, California" },
            ].map((row, i) => (
              <motion.li
                key={row.label}
                initial={{ opacity: 0, x: -8 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{
                  delay: 0.25 + i * 0.08,
                  duration: 0.6,
                  ease: EASE,
                }}
              >
                <ContactRow {...row} />
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Right column — Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.15, duration: 0.7, ease: EASE }}
          className="lg:col-span-7"
        >
          <form
            onSubmit={handleSubmit}
            className="relative bg-paper border border-line/60 p-7 lg:p-10 rounded-[2px] space-y-5 overflow-hidden"
          >
            {/* Top gold accent */}
            <span
              aria-hidden
              className="absolute top-0 left-0 right-0 h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, var(--gold) 50%, transparent 100%)",
              }}
            />

            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div
                  key="sent"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.6, ease: EASE }}
                  className="py-12 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      delay: 0.1,
                      duration: 0.5,
                      ease: EASE,
                    }}
                    className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-leaf/15 text-leaf mb-6"
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </motion.div>
                  <h3 className="font-display text-2xl text-ink">
                    Request sent.
                  </h3>
                  <p className="mt-3 text-sm text-ink-soft max-w-sm mx-auto leading-relaxed">
                    A Crown Jewels rep will be in touch shortly. (This form is
                    a placeholder — not yet connected to a backend.)
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={false}
                  exit={{ opacity: 0 }}
                  className="space-y-5"
                >
                  <FieldRow delay={0.3} inView={inView}>
                    <Field label="Your name" name="name" />
                    <Field label="Company" name="company" />
                  </FieldRow>
                  <FieldRow delay={0.38} inView={inView}>
                    <Field label="Email" name="email" type="email" />
                    <Field label="Phone" name="phone" type="tel" />
                  </FieldRow>
                  <FormField
                    delay={0.46}
                    inView={inView}
                    label="I'm buying for"
                    htmlFor="segment"
                  >
                    <select
                      id="segment"
                      name="segment"
                      className="form-input"
                    >
                      <option>Retail chain</option>
                      <option>Foodservice</option>
                      <option>Wholesale</option>
                      <option>Export</option>
                      <option>Other</option>
                    </select>
                  </FormField>
                  <FormField
                    delay={0.54}
                    inView={inView}
                    label="What you're looking for"
                    htmlFor="message"
                  >
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      placeholder="Commodities, volume, timing…"
                      className="form-input resize-none"
                    />
                  </FormField>
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{
                      delay: 0.62,
                      duration: 0.6,
                      ease: EASE,
                    }}
                  >
                    <button
                      type="submit"
                      disabled={submitting}
                      className="group relative inline-flex items-center justify-center gap-2.5 rounded-full bg-brand text-paper px-7 py-3.5 text-sm font-medium hover:bg-brand-deep transition-colors overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      <span
                        aria-hidden
                        className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                        style={{
                          background:
                            "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
                        }}
                      />
                      <span className="relative">
                        {submitting ? "Sending…" : "Send request"}
                      </span>
                      {!submitting && (
                        <span
                          aria-hidden
                          className="relative transition-transform duration-300 group-hover:translate-x-1"
                        >
                          →
                        </span>
                      )}
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </motion.div>
      </div>
    </section>
  );
}

function ContactRow({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  const Tag = href ? "a" : "div";
  return (
    <div className="flex items-baseline gap-6 border-b border-line/60 py-4 group">
      <span className="eyebrow w-20 shrink-0">{label}</span>
      <Tag
        {...(href ? { href } : {})}
        className={`text-ink ${href ? "hover:text-brand transition-colors" : ""}`}
      >
        {value}
      </Tag>
      {href && (
        <span
          aria-hidden
          className="ml-auto text-ink/30 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-brand transition-all duration-300"
        >
          →
        </span>
      )}
    </div>
  );
}

function FieldRow({
  children,
  delay,
  inView,
}: {
  children: React.ReactNode;
  delay: number;
  inView: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.6, ease: EASE }}
      className="grid sm:grid-cols-2 gap-5"
    >
      {children}
    </motion.div>
  );
}

function FormField({
  children,
  delay,
  inView,
  label,
  htmlFor,
}: {
  children: React.ReactNode;
  delay: number;
  inView: boolean;
  label: string;
  htmlFor: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.6, ease: EASE }}
    >
      <label className="eyebrow block mb-2" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </motion.div>
  );
}

function Field({
  label,
  name,
  type = "text",
}: {
  label: string;
  name: string;
  type?: string;
}) {
  return (
    <div>
      <label className="eyebrow block mb-2" htmlFor={name}>
        {label}
      </label>
      <input id={name} name={name} type={type} className="form-input" />
    </div>
  );
}
