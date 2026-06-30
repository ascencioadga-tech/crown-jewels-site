import type { Metadata, Viewport } from "next";
import { Geist, Fraunces, Lora, Caveat } from "next/font/google";
import "./globals.css";

// Geist for all body/UI text, Fraunces for headings — and Lora's warm flowing
// italic reserved for the "Jewels" wordmark (the distinctive cursive J).
const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  // Expose Fraunces' optical-size + softness/wonk axes so we can render
  // refined, smoother display forms (the default locks it to the chunky
  // small-optical-size shapes, which make the "J" read awkward at size).
  axes: ["opsz", "SOFT", "WONK"],
});

// Lora italic — the flowing wordmark "J" in "Crown Jewels" (.cj-j).
const jewelJ = Lora({
  variable: "--font-jewelj",
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["italic"],
});

// Caveat — handwriting, for the grower's handwritten packing list the Ship
// Sheet "scan" feature reads (the Mexican grower scrawls his load in pen).
const caveat = Caveat({
  variable: "--font-hand",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Crown Jewels Produce — Year-round programs, grower-direct",
  description:
    "Year-round produce programs across 16 commodities. Grower-direct from California, Mexico, and Chile. Serving retail, foodservice, wholesale, and export buyers.",
  // Launch as a full-screen standalone app when added to the iOS home screen —
  // no Safari URL bar / search. (An in-app back arrow replaces the browser's.)
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Crown Jewels",
  },
  // Next emits the modern `mobile-web-app-capable` from appleWebApp.capable;
  // add the legacy Apple tag older iOS still reads for standalone launch.
  other: { "apple-mobile-web-app-capable": "yes" },
};

// White browser/iOS status-bar tint — keeps the top of the standalone phone
// apps white instead of the site's cream background.
export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${fraunces.variable} ${jewelJ.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
