import type { Metadata } from "next";
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
