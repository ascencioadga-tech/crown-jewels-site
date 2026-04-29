// SERVER-ONLY map projection helper.
// Imported only by server components — keeps d3-geo + topojson out of the client bundle.

import { feature } from "topojson-client";
import { geoMercator, geoPath } from "d3-geo";
import countriesData from "world-atlas/countries-50m.json";
import { REGIONS } from "@/data/growers";

// Tighter, more landscape viewBox now that we drop Canada — keeps the section compact.
const VIEWBOX_W = 1000;
const VIEWBOX_H = 880;

// Explicit projection params so we own the framing.
const PROJ_CENTER: [number, number] = [-87, 0];
const PROJ_SCALE = 470;
const PROJ_TRANSLATE: [number, number] = [VIEWBOX_W / 2, VIEWBOX_H / 2 + 30];

// USA south through Argentina — Canada and Greenland intentionally excluded.
const AMERICAS_IDS = new Set<number>([
  840, // United States (Alaska will be partly clipped at top — fine)
  484, // Mexico
  84,  // Belize
  320, // Guatemala
  340, // Honduras
  222, // El Salvador
  558, // Nicaragua
  188, // Costa Rica
  591, // Panama
  192, // Cuba
  388, // Jamaica
  332, // Haiti
  214, // Dominican Republic
  44,  // Bahamas
  780, // Trinidad and Tobago
  170, // Colombia
  862, // Venezuela
  328, // Guyana
  740, // Suriname
  254, // French Guiana
  76,  // Brazil
  218, // Ecuador
  604, // Peru
  68,  // Bolivia
  600, // Paraguay
  858, // Uruguay
  152, // Chile
  32,  // Argentina
  630, // Puerto Rico
]);

type AnyFeature = {
  type: "Feature";
  id?: string | number;
  properties?: { name?: string };
  geometry: unknown;
};

const world = feature(
  countriesData as never,
  (countriesData as never as { objects: { countries: unknown } }).objects
    .countries as never
) as unknown as { type: "FeatureCollection"; features: AnyFeature[] };

const americasFeatures = world.features.filter((f) =>
  AMERICAS_IDS.has(Number(f.id))
);

const projection = geoMercator()
  .center(PROJ_CENTER)
  .scale(PROJ_SCALE)
  .translate(PROJ_TRANSLATE);

const pathGen = geoPath(projection);

export type CountryPath = {
  id: number;
  name: string;
  d: string;
};

export const COUNTRY_PATHS: CountryPath[] = americasFeatures
  .map((f) => ({
    id: Number(f.id),
    name: f.properties?.name ?? "",
    d: pathGen(f as never) ?? "",
  }))
  .filter((c) => c.d.length > 0);

export type ProjectedRegion = (typeof REGIONS)[number] & {
  x: number;
  y: number;
};

export const PROJECTED_REGIONS: ProjectedRegion[] = REGIONS.map((r) => {
  const p = projection([r.lng, r.lat]);
  return { ...r, x: p?.[0] ?? 0, y: p?.[1] ?? 0 };
});

export const VIEW = { w: VIEWBOX_W, h: VIEWBOX_H };

// Latitude lines for the atlas grid (no longer above 40°N — keeps the grid clean)
export const LAT_LINES = [-40, -20, 0, 20, 40].map((lat) => {
  const left = projection([-130, lat])!;
  const right = projection([-35, lat])!;
  return { lat, x1: left[0], y1: left[1], x2: right[0], y2: right[1] };
});

// Longitude lines
export const LNG_LINES = [-120, -100, -80, -60, -40].map((lng) => {
  const top = projection([lng, 50])!;
  const bottom = projection([lng, -55])!;
  return { lng, x1: top[0], y1: top[1], x2: bottom[0], y2: bottom[1] };
});
