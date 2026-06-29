"use client";

// Custom "jewel" produce marks — hand-drawn inline SVG, one per commodity,
// set in a gold-ringed medallion. Live code (no photos): recolors, scales
// crisp at any size, and adds ~0 load. Drops in wherever a product image
// shows today (availability rail + board head, new-order picker, quote sheet).

import { useId, type ReactNode } from "react";

type Props = {
  /** Commodity id (daily-quote/data ids, or board ids — aliased below). */
  id: string;
  /** Rendered px (the medallion scales to fit). Default 32. */
  size?: number;
  className?: string;
  /** Accessible label; omit to mark decorative (aria-hidden). */
  title?: string;
};

// Board ids → commodity art that already exists.
const ALIAS: Record<string, string> = {
  honeydew: "melons",
  "roma-tomatoes": "tomatoes",
  "red-bell-peppers": "bell-peppers",
};

// Each entry draws the produce centered in a 100×100 viewBox.
const ART: Record<string, ReactNode> = {
  cucumbers: (
    <g transform="rotate(-30 50 50)">
      <rect x="37" y="20" width="26" height="60" rx="13" fill="#4f7a32" />
      <rect x="40" y="24" width="9" height="52" rx="4.5" fill="#76a849" opacity=".55" />
      <ellipse cx="50" cy="50" rx="13" ry="30" fill="#000" opacity=".1" />
      <g fill="#39591f" opacity=".85">
        <circle cx="46" cy="34" r="1.3" />
        <circle cx="55" cy="40" r="1.3" />
        <circle cx="47" cy="48" r="1.3" />
        <circle cx="56" cy="55" r="1.3" />
        <circle cx="46" cy="63" r="1.3" />
        <circle cx="55" cy="69" r="1.3" />
      </g>
    </g>
  ),
  "persian-cucumber": (
    <g transform="rotate(-18 50 50)">
      <rect x="40" y="30" width="20" height="42" rx="10" fill="#5a8a39" />
      <rect x="43" y="33" width="6.5" height="36" rx="3.2" fill="#84b556" opacity=".55" />
      <g fill="#3f6526" opacity=".85">
        <circle cx="48" cy="40" r="1.1" />
        <circle cx="53" cy="48" r="1.1" />
        <circle cx="48" cy="56" r="1.1" />
        <circle cx="53" cy="64" r="1.1" />
      </g>
      <rect x="47.5" y="25" width="5" height="7" rx="2.5" fill="#46662b" />
    </g>
  ),
  squash: (
    <g transform="rotate(-22 50 50)">
      <path d="M50 18c6 0 9 7 9 17 0 12 5 20 5 28 0 9-7 13-14 13s-14-4-14-13c0-8 5-16 5-28 0-10 3-17 9-17Z" fill="#e7b12c" />
      <path d="M44 26c-3 9-1 22-3 33" stroke="#f6cf6a" strokeWidth="4.5" strokeLinecap="round" fill="none" opacity=".7" />
      <ellipse cx="50" cy="58" rx="9" ry="18" fill="#000" opacity=".08" />
      <path d="M50 18c-1-4 1-7 4-8" stroke="#7c5a1e" strokeWidth="3.4" strokeLinecap="round" fill="none" />
    </g>
  ),
  melons: (
    <>
      <circle cx="50" cy="52" r="31" fill="#cdd884" />
      <circle cx="50" cy="52" r="31" fill="#000" opacity=".05" />
      <g stroke="#a9b866" strokeWidth=".9" fill="none" opacity=".65">
        <path d="M28 44c14 6 30 6 44 0" />
        <path d="M26 54c15 7 33 7 48 0" />
        <path d="M30 64c12 5 28 5 40 0" />
        <path d="M44 23c-7 18-7 40 0 58" />
        <path d="M56 23c7 18 7 40 0 58" />
      </g>
      <ellipse cx="40" cy="40" rx="9" ry="6" fill="#fff" opacity=".4" />
    </>
  ),
  "bell-peppers": (
    <>
      <path d="M28 43c0-12 11-15 17-11 2-2 8-2 10 0 6-4 17-1 17 12 1 19-9 35-22 35S27 62 28 43Z" fill="#cf3a23" />
      <path d="M50 33c0-6 2-11 6-13" stroke="#4f7a34" strokeWidth="4.5" strokeLinecap="round" fill="none" />
      <circle cx="50" cy="33" r="4" fill="#4f7a34" />
      <path d="M37 40c-3 10-2 22 4 31" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" fill="none" opacity=".32" />
      <path d="M50 50c0 12-1 22-1 28" stroke="#9b2414" strokeWidth="2" fill="none" opacity=".5" />
    </>
  ),
  "green-bell-peppers": (
    <>
      <path d="M28 43c0-12 11-15 17-11 2-2 8-2 10 0 6-4 17-1 17 12 1 19-9 35-22 35S27 62 28 43Z" fill="#4f8a39" />
      <path d="M50 33c0-6 2-11 6-13" stroke="#3c5e27" strokeWidth="4.5" strokeLinecap="round" fill="none" />
      <circle cx="50" cy="33" r="4" fill="#3c5e27" />
      <path d="M37 40c-3 10-2 22 4 31" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" fill="none" opacity=".3" />
      <path d="M50 50c0 12-1 22-1 28" stroke="#356023" strokeWidth="2" fill="none" opacity=".5" />
    </>
  ),
  eggplant: (
    <>
      <path d="M65 26c9 9 6 28-5 39-9 9-23 10-31 2-7-8-3-23 9-31 9-6 20-16 27-10Z" fill="#3b1f43" />
      <path d="M41 45c-5 8-4 18 3 26" stroke="#7a5a86" strokeWidth="5" strokeLinecap="round" fill="none" opacity=".55" />
      <path d="M57 23c4 1 8-1 12 1-2 6-6 9-11 9-3-3-4-7-1-10Z" fill="#4f7a34" />
      <path d="M65 21c2-4 5-5 8-4" stroke="#46662b" strokeWidth="3.4" strokeLinecap="round" fill="none" />
    </>
  ),
  "green-beans": (
    <g strokeLinecap="round" fill="none">
      <path d="M30 32c14 4 24 22 30 40" stroke="#4f8a36" strokeWidth="9" />
      <path d="M30 32c14 4 24 22 30 40" stroke="#71a64f" strokeWidth="3" opacity=".6" />
      <path d="M40 28c13 6 22 24 26 42" stroke="#5c9a3f" strokeWidth="9" />
      <path d="M40 28c13 6 22 24 26 42" stroke="#80b65b" strokeWidth="3" opacity=".6" />
      <path d="M52 27c10 8 16 26 18 44" stroke="#477f30" strokeWidth="9" />
    </g>
  ),
  tomatoes: (
    <>
      <ellipse cx="50" cy="57" rx="27" ry="25" fill="#c43b2c" />
      <ellipse cx="50" cy="57" rx="27" ry="25" fill="#000" opacity=".06" />
      <ellipse cx="41" cy="47" rx="8" ry="5.5" fill="#fff" opacity=".4" />
      <path d="M50 37c-3-5-8-6-11-9 4 4 6 3 11-2 5 5 7 6 11 2-3 3-8 4-11 9Z" fill="#4f7a34" />
      <rect x="48.5" y="23" width="3" height="9" rx="1.5" fill="#5c7a30" />
    </>
  ),
  "table-grapes": (
    <>
      <path d="M50 28c0-5 3-9 8-10" stroke="#4f7a34" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M58 18c5 0 8 3 9 7-5 1-9-1-11-4" fill="#4f7a34" />
      <g fill="#6a2148">
        <circle cx="50" cy="36" r="8" />
        <circle cx="40" cy="46" r="8" />
        <circle cx="60" cy="46" r="8" />
        <circle cx="50" cy="52" r="8" />
        <circle cx="43" cy="60" r="8" />
        <circle cx="57" cy="60" r="8" />
        <circle cx="50" cy="68" r="8" />
      </g>
      <g fill="#9a4a72" opacity=".55">
        <circle cx="47" cy="33" r="2.4" />
        <circle cx="37" cy="43" r="2.4" />
        <circle cx="47" cy="49" r="2.4" />
        <circle cx="40" cy="57" r="2.4" />
      </g>
    </>
  ),
  citrus: (
    <>
      <circle cx="50" cy="54" r="28" fill="#ef9d2b" />
      <circle cx="50" cy="54" r="28" fill="#000" opacity=".05" />
      <g fill="#d98521" opacity=".5">
        <circle cx="40" cy="48" r="1" />
        <circle cx="58" cy="46" r="1" />
        <circle cx="52" cy="60" r="1" />
        <circle cx="44" cy="64" r="1" />
        <circle cx="62" cy="58" r="1" />
      </g>
      <ellipse cx="41" cy="45" rx="8" ry="5" fill="#fff" opacity=".38" />
      <path d="M50 26c4-6 12-8 18-6-1 7-7 11-14 10" fill="#4f7a34" />
      <path d="M50 26c0-3-1-5-3-7" stroke="#5c7a30" strokeWidth="3" strokeLinecap="round" fill="none" />
    </>
  ),
  pomegranates: (
    <>
      <circle cx="50" cy="56" r="27" fill="#9c2330" />
      <circle cx="50" cy="56" r="27" fill="#000" opacity=".05" />
      <ellipse cx="42" cy="47" rx="7" ry="4.5" fill="#fff" opacity=".22" />
      <polygon points="43,33 45,24 47,30 50,22 53,30 55,24 57,33" fill="#6e1622" />
    </>
  ),
  cherries: (
    <>
      <path d="M50 26C44 34 40 42 38 50" stroke="#4f7a34" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M50 26C55 32 60 40 63 46" stroke="#4f7a34" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M50 26c2-4 6-7 11-7" stroke="#4f7a34" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M59 18c4-1 8 0 10 3-3 3-7 3-10 1Z" fill="#4f7a34" />
      <circle cx="38" cy="62" r="13" fill="#9c1f2e" />
      <circle cx="63" cy="58" r="12" fill="#86182a" />
      <ellipse cx="34" cy="57" rx="4" ry="2.6" fill="#fff" opacity=".35" />
      <ellipse cx="59" cy="53" rx="3.6" ry="2.4" fill="#fff" opacity=".3" />
    </>
  ),
  pears: (
    <>
      <path d="M50 26c3 0 5 3 4 7 7 3 11 12 11 23 0 14-7 22-15 22s-15-8-15-22c0-11 4-20 11-23-1-4 1-7 4-7Z" fill="#bcc24a" />
      <path d="M40 50c-2 8-1 16 4 22" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" opacity=".3" />
      <path d="M50 26c0-3 0-6 2-8" stroke="#7c5a1e" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M52 19c3-2 7-2 10 0-2 4-6 5-10 3Z" fill="#4f7a34" />
    </>
  ),
  asparagus: (
    <g transform="rotate(6 50 50)">
      <g strokeLinecap="round">
        <line x1="42" y1="80" x2="44" y2="32" stroke="#5f8a3a" strokeWidth="6" />
        <line x1="50" y1="82" x2="50" y2="28" stroke="#6f9b45" strokeWidth="6" />
        <line x1="58" y1="80" x2="56" y2="32" stroke="#557f33" strokeWidth="6" />
      </g>
      <g fill="#456b2c">
        <ellipse cx="44" cy="29" rx="3" ry="5" />
        <ellipse cx="50" cy="26" rx="3.2" ry="5.5" />
        <ellipse cx="56" cy="29" rx="3" ry="5" />
      </g>
      <rect x="36" y="56" width="28" height="7" rx="3.5" fill="#b8853e" />
      <rect x="36" y="56" width="28" height="7" rx="3.5" fill="#000" opacity=".06" />
    </g>
  ),
  "brussels-sprouts": (
    <>
      <circle cx="42" cy="56" r="14" fill="#4a6a2e" />
      <circle cx="61" cy="51" r="12.5" fill="#3f5e27" />
      <g stroke="#6f9447" strokeWidth="1.3" fill="none" opacity=".7" strokeLinecap="round">
        <path d="M42 43c-6 5-8 16-3 24" />
        <path d="M42 43c6 5 8 16 3 24" />
        <path d="M34 56h16" />
        <path d="M61 39c-5 4-7 14-2 22" />
        <path d="M61 39c5 4 7 14 2 22" />
      </g>
      <ellipse cx="37" cy="50" rx="4" ry="2.6" fill="#fff" opacity=".18" />
    </>
  ),
  "chili-peppers": (
    <g transform="rotate(14 50 50)">
      <path d="M44 26c3-2 7 1 8 7 5 8 6 22 1 33-4 9-11 8-12 1 4-10 4-22 0-31-2-5-1-9 3-10Z" fill="#c62b1c" />
      <path d="M46 34c-2 9-2 22 1 31" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" opacity=".3" />
      <path d="M44 26c-1-4 1-7 4-9" stroke="#4f7a34" strokeWidth="3.4" strokeLinecap="round" fill="none" />
      <path d="M48 17c4-2 8-1 10 2-3 3-7 3-10 1Z" fill="#4f7a34" />
    </g>
  ),
  onions: (
    <>
      <path d="M50 30c13 0 20 13 16 28-3 12-9 20-16 20s-13-8-16-20c-4-15 3-28 16-28Z" fill="#c89a58" />
      <g stroke="#9c7438" strokeWidth="1.3" fill="none" opacity=".6" strokeLinecap="round">
        <path d="M50 32c-6 14-6 30 0 44" />
        <path d="M50 32c6 14 6 30 0 44" />
        <path d="M40 38c-4 12-4 24 0 36" />
        <path d="M60 38c4 12 4 24 0 36" />
      </g>
      <ellipse cx="42" cy="44" rx="5" ry="3" fill="#fff" opacity=".25" />
      <path d="M50 30c-1-4 0-7 1-10" stroke="#b89a6a" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M50 30c1-4 3-6 5-8" stroke="#b89a6a" strokeWidth="2" strokeLinecap="round" fill="none" />
    </>
  ),
  __fallback: (
    <>
      <circle cx="50" cy="54" r="26" fill="#7e9b5a" />
      <ellipse cx="42" cy="46" rx="7" ry="4.5" fill="#fff" opacity=".3" />
      <path d="M50 30c4-6 12-7 18-5-1 7-7 11-14 10Z" fill="#4f7a34" />
    </>
  ),
};

function resolve(id: string): ReactNode {
  if (ART[id]) return ART[id];
  const a = ALIAS[id];
  if (a && ART[a]) return ART[a];
  return ART.__fallback;
}

export default function ProduceGlyph({ id, size = 32, className, title }: Props) {
  const ringId = `pg-ring-${useId().replace(/:/g, "")}`;
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role={title ? "img" : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <linearGradient id={ringId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e0b96b" />
          <stop offset=".55" stopColor="#b8853e" />
          <stop offset="1" stopColor="#8a5f24" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="47" fill="#fbf7ee" stroke={`url(#${ringId})`} strokeWidth="2.6" />
      <circle cx="50" cy="50" r="43" fill="none" stroke="#b8853e" strokeOpacity=".22" strokeWidth="1" />
      {resolve(id)}
      <ellipse cx="38" cy="33" rx="26" ry="17" fill="#ffffff" opacity=".12" />
    </svg>
  );
}
