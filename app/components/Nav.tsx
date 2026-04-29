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
      <div className="mx-auto max-w-7xl px-6 lg:px-10 h-20 flex items-center justify-between">
        <Link
          href="/"
          aria-label="Crown Jewels Produce — home"
          className="flex items-center gap-3 group"
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

        <nav className="hidden lg:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={clsx(
                "text-sm transition-colors",
                scrolled
                  ? "text-ink-soft hover:text-brand"
                  : "text-paper/85 hover:text-paper"
              )}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <Link
          href="/admin"
          className={clsx(
            "inline-flex items-center gap-2 rounded-full text-sm px-5 py-2 transition-colors",
            scrolled
              ? "bg-ink text-paper hover:bg-brand"
              : "bg-paper text-ink hover:bg-brand hover:text-paper"
          )}
        >
          Login
          <span aria-hidden>→</span>
        </Link>
      </div>
    </header>
  );
}
