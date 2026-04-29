import Nav from "./components/Nav";
import Hero from "./components/Hero";
import StatStrip from "./components/StatStrip";
import CommodityGrid from "./components/CommodityGrid";
import YearRoundCalendar from "./components/YearRoundCalendar";
import GrowerMap from "./components/GrowerMap";
import FamilyCarousel from "./components/FamilyCarousel";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import {
  COUNTRY_PATHS,
  PROJECTED_REGIONS,
  VIEW,
  LAT_LINES,
  LNG_LINES,
} from "@/lib/americas-map";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <Hero />
        <StatStrip />
        <CommodityGrid />
        <GrowerMap
          countries={COUNTRY_PATHS}
          regions={PROJECTED_REGIONS}
          view={VIEW}
          latLines={LAT_LINES}
          lngLines={LNG_LINES}
        />
        <YearRoundCalendar />
        <FamilyCarousel />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
