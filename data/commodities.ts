export type Region = "california" | "mexico" | "chile" | "peru";

export type Commodity = {
  name: string;
  slug: string;
  /** Months in season (1-12). Used for the seasonality bar on each card. */
  months: number[];
  /** Region badges for the year-round program calendar. */
  regions: Region[];
  /** Accent color used in the card chip / seasonality fill. */
  accent: string;
};

export const COMMODITIES: Commodity[] = [
  { name: "Table Grapes",     slug: "table-grapes",     months: [5,6,7,8,9,10,11,12,1,2,3,4], regions: ["california","mexico","chile","peru"], accent: "#5b1a3a" },
  { name: "Citrus",           slug: "citrus",           months: [10,11,12,1,2,3,4,5,6],       regions: ["california","mexico"],                accent: "#d27a1e" },
  { name: "Pomegranates",     slug: "pomegranates",     months: [9,10,11,12,1,2,3],           regions: ["california","peru"],                  accent: "#7a1f2b" },
  { name: "Cherries",         slug: "cherries",         months: [5,6,7,11,12,1],              regions: ["california","chile"],                 accent: "#5b0e1a" },
  { name: "Melons",           slug: "melons",           months: [5,6,7,8,9,10,11,12,1,2],     regions: ["california","mexico"],                accent: "#c89c3e" },
  { name: "Pears",            slug: "pears",            months: [7,8,9,10,11,12,1,2,3,4],     regions: ["california"],                         accent: "#9b9457" },
  { name: "Bell Peppers",     slug: "bell-peppers",     months: [1,2,3,4,5,6,7,8,9,10,11,12], regions: ["california","mexico"],                accent: "#c0341c" },
  { name: "Chili Peppers",    slug: "chili-peppers",    months: [1,2,3,4,5,6,7,8,9,10,11,12], regions: ["mexico","california"],                accent: "#a0291f" },
  { name: "Tomatoes",         slug: "tomatoes",         months: [1,2,3,4,5,6,7,8,9,10,11,12], regions: ["california","mexico"],                accent: "#b03028" },
  { name: "Onions",           slug: "onions",           months: [1,2,3,4,5,6,7,8,9,10,11,12], regions: ["california","mexico"],                accent: "#a4895a" },
  { name: "Cucumbers",        slug: "cucumbers",        months: [1,2,3,4,5,6,7,8,9,10,11,12], regions: ["mexico","california"],                accent: "#4f5e36" },
  { name: "Eggplant",         slug: "eggplant",         months: [3,4,5,6,7,8,9,10,11],        regions: ["mexico","california"],                accent: "#3b1f43" },
  { name: "Squash",           slug: "squash",           months: [1,2,3,4,5,6,7,8,9,10,11,12], regions: ["mexico","california"],                accent: "#b88b1d" },
  { name: "Green Beans",      slug: "green-beans",      months: [1,2,3,4,5,6,7,8,9,10,11,12], regions: ["mexico"],                             accent: "#5c7a32" },
  { name: "Asparagus",        slug: "asparagus",        months: [2,3,4,5,6,9,10,11],          regions: ["california","mexico","peru"],         accent: "#6b8a52" },
  { name: "Brussels Sprouts", slug: "brussels-sprouts", months: [9,10,11,12,1,2,3,4,5],       regions: ["california","mexico"],                accent: "#3e5028" },
];

export const REGION_LABEL: Record<Region, string> = {
  california: "California",
  mexico: "Mexico",
  chile: "Chile",
  peru: "Peru",
};

export const REGION_COLOR: Record<Region, string> = {
  california: "#7a1f2b",
  mexico: "#b8853e",
  chile: "#4f5e36",
  peru: "#2a4a5e",
};
