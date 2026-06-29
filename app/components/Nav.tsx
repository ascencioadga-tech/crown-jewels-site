"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";

const links = [
  { href: "#commodities", label: "Commodities" },
  { href: "#programs", label: "Programs" },
  { href: "#growers", label: "Growers" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={clsx(
        "fixed inset-x-0 top-0 z-40 transition-colors duration-300",
        scrolled
          ? "backdrop-blur-md bg-bg/80 border-b border-line/60"
          : "bg-transparent border-b border-transparent"
      )}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10 h-20 grid grid-cols-[1fr_auto_1fr] items-center">
        <Link
          href="/"
          aria-label="Crown Jewels Produce — home"
          className="flex items-center gap-3 group justify-self-start"
        >
          {/* Full logo (with white wordmark) over the dark hero video */}
          <Image
            src="/crown-jewels-logo.png"
            alt="Crown Jewels Produce"
            width={580}
            height={260}
            priority
            className={clsx(
              "h-14 w-auto transition-all duration-300",
              scrolled
                ? "opacity-0 absolute pointer-events-none"
                : "opacity-100"
            )}
          />
          {/* Cropped crown emblem only — used once the nav becomes opaque */}
          <span
            className={clsx(
              "relative block h-10 w-[88px] shrink-0 overflow-hidden transition-opacity duration-300",
              scrolled ? "opacity-100" : "opacity-0 absolute pointer-events-none"
            )}
          >
            <Image
              src="/crown-jewels-logo.png"
              alt=""
              width={580}
              height={260}
              className="absolute left-1/2 top-0 -translate-x-1/2 h-[80px] w-auto max-w-none"
            />
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8 justify-self-center">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={clsx(
                "group relative py-1 text-[15px] font-medium tracking-wide transition-colors duration-300",
                scrolled
                  ? "text-ink-soft hover:text-ink"
                  : "text-paper hover:text-paper [text-shadow:0_1px_4px_rgba(8,12,10,0.6)]"
              )}
            >
              {l.label}
              {/* Gold underline that grows in on hover */}
              <span
                aria-hidden
                className="pointer-events-none absolute -bottom-0.5 left-0 h-px w-0 bg-gold transition-all duration-300 ease-out group-hover:w-full"
              />
            </a>
          ))}
        </nav>

        <Link
          href="/admin"
          className={clsx(
            "group relative inline-flex items-center justify-self-end overflow-hidden rounded-full border px-5 py-2 text-sm backdrop-blur-md transition-colors duration-300",
            scrolled
              ? "border-ink/15 bg-ink/5 text-ink"
              : "border-paper/40 bg-paper/10 text-paper"
          )}
        >
          {/* Crimson fill slides up on hover — bleeds in from the design */}
          <span
            aria-hidden
            className="absolute inset-0 bg-brand translate-y-[101%] transition-transform duration-300 ease-out group-hover:translate-y-0"
          />
          <span className="relative z-10 inline-flex items-center gap-2 transition-colors duration-300 group-hover:text-paper">
            Login
            <span
              aria-hidden
              className="transition-transform duration-300 ease-out group-hover:translate-x-1"
            >
              →
            </span>
          </span>
        </Link>
      </div>
    </header>
  );
}
