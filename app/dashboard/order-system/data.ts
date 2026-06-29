import { commodities } from "../daily-quote/data";

export { commodities };

export type Customer = {
  id: string;
  name: string;
  channel: string;
  destination: string; // default ship-to city
  terms: string; // default payment terms
  contact: string; // AR contact email
};

// Terms — note PACA default prompt-pay is 10 days after acceptance unless
// otherwise agreed in writing. Reps can override per order.
export const TERMS_OPTIONS = [
  "Net 10 (PACA)",
  "Net 14",
  "Net 21",
  "Net 30",
] as const;

export const SALESPEOPLE = [
  "Alejandro Bours",
  "Marisol",
  "Diego",
  "Rob",
] as const;

export const CUSTOMERS: Customer[] = [
  { id: "calixtro",     name: "Calixtro Dist.",               channel: "Wholesale",        destination: "",                 terms: "Net 21",       contact: "" },
  { id: "fresh-direct", name: "Fresh Direct",                 channel: "Retail",           destination: "",                 terms: "Net 21",       contact: "" },
  { id: "kr-cal",     name: "Kroger — California Division", channel: "Retail",           destination: "Compton, CA",      terms: "Net 21",       contact: "ap@kroger.com" },
  { id: "albertsons", name: "Albertsons / Safeway",         channel: "Retail",           destination: "Tracy, CA",        terms: "Net 21",       contact: "produce.ap@albertsons.com" },
  { id: "sysco-la",   name: "Sysco Los Angeles",            channel: "Foodservice",      destination: "City of Industry, CA", terms: "Net 14",   contact: "ap@sysco.com" },
  { id: "us-foods",   name: "US Foods — Phoenix",           channel: "Foodservice",      destination: "Phoenix, AZ",      terms: "Net 14",       contact: "ap@usfoods.com" },
  { id: "frieda",     name: "Frieda's Specialty Produce",   channel: "Wholesale",        destination: "Los Alamitos, CA", terms: "Net 10 (PACA)", contact: "accounting@friedas.com" },
  { id: "fyffes",     name: "Fyffes North America",         channel: "Wholesale",        destination: "Newark, NJ",       terms: "Net 21",       contact: "ar@fyffes.com" },
  { id: "wm-mex",     name: "Walmart de México",            channel: "Retail · Export",  destination: "Guadalajara, MX",  terms: "Net 30",       contact: "proveedores@walmart.com.mx" },
  { id: "loblaws",    name: "Loblaws Canada",               channel: "Retail · Export",  destination: "Toronto, ON",      terms: "Net 30",       contact: "ap@loblaw.ca" },
];

export const customerById = (id: string) =>
  CUSTOMERS.find((c) => c.id === id);

/** Days implied by a terms label, for due-date math. */
export function termsToDays(terms: string): number {
  const m = terms.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 21;
}

export function money(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}
