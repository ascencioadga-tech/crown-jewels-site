import type { Region } from "./commodities";

export type FamilyMember = {
  name: string;
  region: string;
  country: Region;
  /** Initials shown in the placeholder until the real logo is dropped in. */
  initials: string;
};

export const FAMILY: FamilyMember[] = [
  { name: "Sun Valley Ranch",      region: "San Joaquin Valley, CA", country: "california", initials: "SV" },
  { name: "Coastal Harvest Co.",   region: "Central Coast, CA",      country: "california", initials: "CH" },
  { name: "Desert Bloom Farms",    region: "Coachella Valley, CA",   country: "california", initials: "DB" },
  { name: "Sonora Pacific",        region: "Hermosillo, Sonora",     country: "mexico",     initials: "SP" },
  { name: "Valle del Mayo",        region: "Culiacán, Sinaloa",      country: "mexico",     initials: "VM" },
  { name: "Rancho La Esperanza",   region: "Guadalajara, Jalisco",   country: "mexico",     initials: "RE" },
  { name: "Tierra Fértil",         region: "Michoacán, MX",          country: "mexico",     initials: "TF" },
  { name: "Pisco Valley Estates",  region: "Ica, Peru",              country: "peru",       initials: "PV" },
  { name: "Casa Andina",           region: "Maipo Valley, Chile",    country: "chile",      initials: "CA" },
  { name: "Heritage Cherries",     region: "Curicó, Chile",          country: "chile",      initials: "HC" },
  { name: "Sierra Pomegranate",    region: "Tulare County, CA",      country: "california", initials: "SP" },
  { name: "El Bosque Berries",     region: "Watsonville, CA",        country: "california", initials: "EB" },
];
