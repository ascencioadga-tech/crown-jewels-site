export type Availability = "peak" | "available" | "unavailable";

export interface CommoditySize {
  size: string;
  unit: string;
  pallet: string;
}

export interface Commodity {
  id: string;
  name: string;
  group: string;
  /** Accent color used for the placeholder image gradient. */
  accent: string;
  category: "fruit" | "vegetable";
  heat?: 1 | 2 | 3 | 4 | 5;
  sizes: CommoditySize[];
  availability: Availability[];
}

// Availability calendars — built from Crown Jewels' actual region windows.
// [Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec]
const A: Record<string, Availability[]> = {
  tableGrapes:    ["peak","peak","peak","available","available","peak","peak","peak","peak","peak","peak","peak"],
  citrus:         ["peak","peak","peak","peak","available","available","unavailable","unavailable","unavailable","available","peak","peak"],
  pomegranates:   ["peak","available","available","available","available","unavailable","unavailable","unavailable","available","peak","peak","peak"],
  cherries:       ["peak","unavailable","unavailable","unavailable","peak","peak","peak","unavailable","unavailable","unavailable","peak","peak"],
  melons:         ["peak","peak","available","available","peak","peak","peak","peak","peak","peak","peak","peak"],
  pears:          ["peak","peak","peak","peak","unavailable","unavailable","available","peak","peak","peak","peak","peak"],
  asparagus:      ["unavailable","available","peak","peak","peak","available","unavailable","available","available","peak","peak","unavailable"],
  brusselsSprouts:["peak","peak","peak","available","available","unavailable","unavailable","unavailable","available","peak","peak","peak"],
  bellPeppers:    ["peak","peak","peak","peak","peak","peak","peak","peak","peak","peak","peak","peak"],
  chiliPeppers:   ["peak","peak","peak","peak","peak","available","available","available","available","peak","peak","peak"],
  tomatoes:       ["peak","peak","peak","peak","peak","peak","peak","peak","peak","peak","peak","peak"],
  cucumbers:      ["peak","peak","peak","peak","available","available","peak","peak","peak","peak","peak","peak"],
  squash:         ["peak","peak","peak","peak","available","available","peak","peak","peak","peak","peak","peak"],
  eggplant:       ["available","available","peak","peak","peak","peak","peak","peak","peak","peak","available","available"],
  onions:         ["peak","peak","peak","peak","peak","peak","peak","peak","peak","peak","peak","peak"],
  greenBeans:     ["peak","peak","peak","peak","peak","unavailable","unavailable","unavailable","unavailable","peak","peak","peak"],
};

// ---------------- Size templates ----------------

const tableGrapeSizes: CommoditySize[] = [
  { size: "XLG", unit: "18 LBS", pallet: "90" },
  { size: "LGE", unit: "18 LBS", pallet: "90" },
  { size: "MED", unit: "18 LBS", pallet: "90" },
];

const citrusSizes: CommoditySize[] = [
  { size: "72's",  unit: "CARTON", pallet: "56" },
  { size: "88's",  unit: "CARTON", pallet: "56" },
  { size: "113's", unit: "CARTON", pallet: "56" },
  { size: "138's", unit: "CARTON", pallet: "56" },
];

const pomegranateSizes: CommoditySize[] = [
  { size: "JBO", unit: "25 LB", pallet: "60" },
  { size: "LGE", unit: "25 LB", pallet: "60" },
  { size: "MED", unit: "25 LB", pallet: "60" },
];

const cherrySizes: CommoditySize[] = [
  { size: "10.5R", unit: "18 LB", pallet: "100" },
  { size: "10R",   unit: "18 LB", pallet: "100" },
  { size: "9.5R",  unit: "18 LB", pallet: "100" },
  { size: "STA",   unit: "5 LB CLAM", pallet: "120" },
];

const melonSizes: CommoditySize[] = [
  { size: "6's",  unit: "CARTON", pallet: "56" },
  { size: "9's",  unit: "CARTON", pallet: "56" },
  { size: "12's", unit: "CARTON", pallet: "56" },
  { size: "15's", unit: "CARTON", pallet: "56" },
];

const pearSizes: CommoditySize[] = [
  { size: "70's",  unit: "44 LB", pallet: "48" },
  { size: "80's",  unit: "44 LB", pallet: "48" },
  { size: "90's",  unit: "44 LB", pallet: "48" },
  { size: "100's", unit: "44 LB", pallet: "48" },
];

const asparagusSizes: CommoditySize[] = [
  { size: "STA", unit: "11 LB", pallet: "100" },
  { size: "JBO", unit: "11 LB", pallet: "100" },
  { size: "LGE", unit: "11 LB", pallet: "100" },
];

const brusselsSproutsSizes: CommoditySize[] = [
  { size: "STA", unit: "25 LB",       pallet: "60" },
  { size: "STA", unit: "12 X 8 OZ",   pallet: "144" },
];

const bellPepperSizes: CommoditySize[] = [
  { size: "JBO", unit: "11/9 BU", pallet: "56" },
  { size: "XLG", unit: "11/9 BU", pallet: "56" },
  { size: "LGE", unit: "11/9 BU", pallet: "56" },
  { size: "MED", unit: "11/9 BU", pallet: "56" },
  { size: "SML", unit: "11/9 BU", pallet: "56" },
];

const chiliPepperSizes: CommoditySize[] = [
  { size: "STA", unit: "35 LB", pallet: "45" },
];

const romaSizes: CommoditySize[] = [
  { size: "JBO", unit: "11 LB", pallet: "100" },
  { size: "XLG", unit: "11 LB", pallet: "100" },
  { size: "LGE", unit: "11 LB", pallet: "100" },
  { size: "MED", unit: "11 LB", pallet: "100" },
];

const onionSizes: CommoditySize[] = [
  { size: "JBO", unit: "50 LB", pallet: "48" },
  { size: "MED", unit: "50 LB", pallet: "48" },
  { size: "PWT", unit: "50 LB", pallet: "48" },
];

const cucumberSizes: CommoditySize[] = [
  { size: "SSL", unit: "11/9 BU", pallet: "49" },
  { size: "SEL", unit: "11/9 BU", pallet: "49" },
  { size: "LGE", unit: "11/9 BU", pallet: "49" },
  { size: "PLN", unit: "11/9 BU", pallet: "49" },
];

const squashSizes: CommoditySize[] = [
  { size: "XLG", unit: "1 BU", pallet: "56" },
  { size: "LGE", unit: "1 BU", pallet: "56" },
  { size: "MED", unit: "1 BU", pallet: "56" },
  { size: "SML", unit: "1 BU", pallet: "56" },
];

const eggplantSizes: CommoditySize[] = [
  { size: "STA",  unit: "25 LB", pallet: "60" },
  { size: "FNCY", unit: "25 LB", pallet: "60" },
];

const greenBeanSizes: CommoditySize[] = [
  { size: "STA",  unit: "25 LB", pallet: "60" },
  { size: "FNCY", unit: "25 LB", pallet: "60" },
];

// ---------------- Commodities ----------------

export const commodities: Commodity[] = [
  // Fruits
  { id: "table-grapes",     name: "Table Grapes",     group: "Grapes",       accent: "#5b1a3a", category: "fruit",     sizes: tableGrapeSizes,      availability: A.tableGrapes },
  { id: "citrus",           name: "Citrus",           group: "Citrus",       accent: "#d27a1e", category: "fruit",     sizes: citrusSizes,          availability: A.citrus },
  { id: "pomegranates",     name: "Pomegranates",     group: "Pomegranates", accent: "#7a1f2b", category: "fruit",     sizes: pomegranateSizes,     availability: A.pomegranates },
  { id: "cherries",         name: "Cherries",         group: "Cherries",     accent: "#5b0e1a", category: "fruit",     sizes: cherrySizes,          availability: A.cherries },
  { id: "melons",           name: "Melons",           group: "Melons",       accent: "#c89c3e", category: "fruit",     sizes: melonSizes,           availability: A.melons },
  { id: "pears",            name: "Pears",            group: "Pears",        accent: "#9b9457", category: "fruit",     sizes: pearSizes,            availability: A.pears },

  // Vegetables — crossover
  { id: "asparagus",        name: "Asparagus",        group: "Asparagus",    accent: "#6b8a52", category: "vegetable", sizes: asparagusSizes,       availability: A.asparagus },
  { id: "brussels-sprouts", name: "Brussels Sprouts", group: "Greens",       accent: "#3e5028", category: "vegetable", sizes: brusselsSproutsSizes, availability: A.brusselsSprouts },

  // Peppers
  { id: "bell-peppers",     name: "Bell Peppers",     group: "Peppers",      accent: "#c0341c", category: "vegetable", sizes: bellPepperSizes,      availability: A.bellPeppers },
  { id: "chili-peppers",    name: "Chili Peppers",    group: "Peppers",      accent: "#a0291f", category: "vegetable", heat: 3, sizes: chiliPepperSizes, availability: A.chiliPeppers },

  // Warm-season vegetables
  { id: "tomatoes",         name: "Tomatoes",         group: "Tomatoes",     accent: "#b03028", category: "vegetable", sizes: romaSizes,            availability: A.tomatoes },
  { id: "cucumbers",        name: "Cucumbers",        group: "Cucumbers",    accent: "#4f5e36", category: "vegetable", sizes: cucumberSizes,        availability: A.cucumbers },
  { id: "squash",           name: "Squash",           group: "Squash",       accent: "#b88b1d", category: "vegetable", sizes: squashSizes,          availability: A.squash },
  { id: "eggplant",         name: "Eggplant",         group: "Eggplant",     accent: "#3b1f43", category: "vegetable", sizes: eggplantSizes,        availability: A.eggplant },

  // Storage / green beans
  { id: "onions",           name: "Onions",           group: "Roots",        accent: "#a4895a", category: "vegetable", sizes: onionSizes,           availability: A.onions },
  { id: "green-beans",      name: "Green Beans",      group: "Greens",       accent: "#5c7a32", category: "vegetable", sizes: greenBeanSizes,       availability: A.greenBeans },
];

export const customers = [
  { id: "kr-cal",     name: "Kroger — California Division", channel: "Retail" },
  { id: "albertsons", name: "Albertsons / Safeway",         channel: "Retail" },
  { id: "sysco-la",   name: "Sysco Los Angeles",            channel: "Foodservice" },
  { id: "us-foods",   name: "US Foods — Phoenix",           channel: "Foodservice" },
  { id: "frieda",     name: "Frieda's Specialty Produce",   channel: "Wholesale" },
  { id: "fyffes",     name: "Fyffes North America",         channel: "Wholesale" },
  { id: "wm-mex",     name: "Walmart de México",            channel: "Retail · Export" },
  { id: "loblaws",    name: "Loblaws Canada",               channel: "Retail · Export" },
];

export const sizeKey = (commodityId: string, sizeIndex: number) =>
  `${commodityId}__${sizeIndex}`;
