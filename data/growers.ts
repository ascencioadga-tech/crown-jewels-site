import type { Region } from "./commodities";

export type GrowerRegion = {
  id: string;
  name: string;
  country: Region;
  /** Real-world coordinates (longitude, latitude) — projected at build time. */
  lng: number;
  lat: number;
  commodities: string[];
  blurb: string;
};

export const REGIONS: GrowerRegion[] = [
  {
    id: "san-joaquin",
    name: "San Joaquin Valley",
    country: "california",
    lng: -119.7871, lat: 36.7378,
    commodities: ["Table Grapes", "Citrus", "Pomegranates", "Cherries", "Pears"],
    blurb:
      "Our home base. Multi-generational grower partners across Fresno, Tulare, and Kern counties.",
  },
  {
    id: "salinas-central-coast",
    name: "Central Coast",
    country: "california",
    lng: -121.6555, lat: 36.6777,
    commodities: ["Brussels Sprouts", "Asparagus", "Squash"],
    blurb: "Cool-climate vegetable program with a long, steady season.",
  },
  {
    id: "coachella",
    name: "Coachella Valley",
    country: "california",
    lng: -116.1764, lat: 33.6803,
    commodities: ["Table Grapes", "Citrus", "Bell Peppers"],
    blurb:
      "Earliest California grape and pepper deals — bridging spring volume from Mexico.",
  },
  {
    id: "sonora",
    name: "Sonora",
    country: "mexico",
    lng: -110.9559, lat: 29.0729,
    commodities: ["Table Grapes", "Melons", "Asparagus"],
    blurb: "Hand-off to California in May, plus a strong asparagus and melon program.",
  },
  {
    id: "sinaloa",
    name: "Sinaloa",
    country: "mexico",
    lng: -107.387, lat: 24.802,
    commodities: ["Tomatoes", "Bell Peppers", "Cucumbers", "Squash", "Green Beans"],
    blurb:
      "Winter and spring vegetable backbone — protected agriculture and open field.",
  },
  {
    id: "jalisco",
    name: "Jalisco",
    country: "mexico",
    lng: -103.347, lat: 20.6597,
    commodities: ["Chili Peppers", "Tomatoes"],
    blurb: "Specialty chiles and roma programs.",
  },
  {
    id: "michoacan",
    name: "Michoacán",
    country: "mexico",
    lng: -101.9095, lat: 19.5665,
    commodities: ["Citrus", "Berries"],
    blurb: "Year-round citrus complement to the California deal.",
  },
  {
    id: "ica",
    name: "Ica",
    country: "peru",
    lng: -75.7283, lat: -14.0678,
    commodities: ["Table Grapes", "Asparagus", "Pomegranates"],
    blurb: "Counter-seasonal grape and asparagus to extend year-round supply.",
  },
  {
    id: "central-valley-cl",
    name: "Central Valley",
    country: "chile",
    lng: -71.0,
    lat: -34.5,
    commodities: ["Table Grapes", "Cherries"],
    blurb:
      "Premium late-winter grape and cherry program — flagship of the Southern Hemisphere season.",
  },
];
