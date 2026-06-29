// Board definitions — mirror the real per-commodity AGRIPACKING / Nogales
// availability sheets (cj-excel): each commodity has column GROUPS (varieties,
// grades, organic, bags, cartons, #2, overage) made of COLUMNS, with inventory
// rows (holdover / incoming) and orders allocated by column.

export type BoardColumn = { key: string; label: string };
export type BoardGroup = {
  key: string;
  title: string;
  organic?: boolean;
  columns: BoardColumn[];
};
export type BoardDef = {
  id: string;
  name: string;
  title: string; // sheet title, e.g. "CUCUMBERS — NOGALES"
  groups: BoardGroup[];
};

export type LotKind = "holdover" | "incoming";
export type InventoryLot = {
  id: string;
  commodityId: string;
  kind: LotKind;
  grower: string;
  pack: string; // pack / label (AV Crown Stock, ENA Crown, Repack, OSP…)
  arrivalDate: string; // YYYY-MM-DD ("" for holdover)
  manifest: string;
  /** Units per column, keyed by colId(groupKey, colKey). */
  qty: Record<string, number>;
  createdAt?: string;
};

/** Stable id for a (group, column) cell across the board. */
export const colId = (groupKey: string, colKey: string) => `${groupKey}::${colKey}`;

const c = (key: string, label: string): BoardColumn => ({ key, label });
const g = (
  key: string,
  title: string,
  columns: BoardColumn[],
  organic = false
): BoardGroup => ({ key, title, columns, organic });

// ---------------- Board structures (mirror the sheets) ----------------
export const BOARDS: BoardDef[] = [
  {
    id: "cucumbers",
    name: "Cucumbers",
    title: "CUCUMBERS — NOGALES",
    groups: [
      g("cuc", "CUCUMBERS", [
        c("ss", "SS"),
        c("sel", "SELECT"),
        c("lge", "LARGE"),
        c("fcy", "FANCY"),
        c("24", "24"),
        c("36", "36"),
      ]),
      g("org", "ORGANIC", [c("fcy", "FANCY")], true),
      g("cuc2", "CUCUMBERS #2", [
        c("ss", "SS"),
        c("sel", "SELECT"),
        c("lge", "LARGE"),
        c("24", "24"),
        c("36", "36"),
      ]),
      g("over", "OVERAGE", [c("over", "OVERAGE")]),
    ],
  },
  {
    id: "persian-cucumber",
    name: "Persian Cucumber",
    title: "PERSIAN CUCUMBER",
    groups: [
      g("per", "PERSIAN CUCUMBERS", [c("xfcy", "XFCY"), c("fcy", "FCY"), c("med", "MED")]),
      g("operg", "ORGANIC PERSIAN", [c("fcy", "FCY")], true),
      g("bags", "PERSIAN CUCUMBERS BAGS", [c("1", "1#"), c("2", "2#")]),
      g("obags", "ORGANIC MINI CUCUMBER BAGS", [c("1", "1#")], true),
    ],
  },
  {
    id: "squash",
    name: "Squash",
    title: "SQUASH",
    groups: [
      g("ital", "ITALIAN SQUASH", [c("xf", "XF"), c("fcy", "FCY"), c("med", "MED")]),
      g("yellow", "YELLOW SQUASH", [c("xf", "XF"), c("fcy", "FCY"), c("med", "MED")]),
      g("gray", "GRAY SQUASH", [c("xf", "XF"), c("fcy", "FCY"), c("med", "MED")]),
      g("org", "ORGANIC", [c("xf", "XF"), c("fcy", "FCY"), c("med", "MED")], true),
      g("obag", "ORGANIC MIXED BAGS 1#", [c("1", "1#")], true),
      g("bulk", "SQUASH CARTONS (BULK)", [c("bulk", "BULK")]),
      g("mp2", "MIXED PACK 2#", [c("2", "2#")]),
    ],
  },
  {
    id: "honeydew",
    name: "Honeydew",
    title: "NOGALES HONEYDEW",
    groups: [
      g("cart", "CARTON", [
        c("jbo", "JBO"),
        c("4", "4"),
        c("5", "5"),
        c("6", "6"),
        c("8", "8"),
        c("9", "9"),
      ]),
      g("cart2", "CARTON #2", [c("jbo", "JBO"), c("5", "5"), c("6", "6"), c("8", "8")]),
      g("nonret", "CARTON NON-RETAIL", [c("5", "5#"), c("6", "6#"), c("8", "8#")]),
    ],
  },
  {
    id: "red-bell-peppers",
    name: "Red Bell Peppers",
    title: "RED BELLS",
    groups: [
      g("r1", "1# RED", [c("jbo", "JUMBO"), c("xl", "X-LARGE"), c("lge", "LARGE"), c("med", "MED")]),
      g("r2", "2# RED", [c("jbo", "JUMBO"), c("xl", "X-LARGE"), c("lge", "LARGE"), c("med", "MED")]),
      g("rus", "1-2# RUSSET (2YR)", [
        c("jbo", "JUMBO"),
        c("xl", "X-LARGE"),
        c("lge", "LARGE"),
        c("medsh", "MED/SHORT"),
        c("sml", "SMALL"),
        c("chc", "CHOICE"),
      ]),
    ],
  },
  {
    id: "green-bell-peppers",
    name: "Green Bell Peppers",
    title: "GREEN BELL PEPPER",
    groups: [
      g("g1", "GREEN BELL PEPPER #1", [
        c("xl", "X-LARGE"),
        c("lge", "LARGE"),
        c("jbo", "JUMBO"),
        c("med", "MEDIUM"),
        c("chc", "CHOICE"),
      ]),
      g("org", "ORGANIC", [c("jbo", "JUMBO"), c("xl", "X-LARGE"), c("med", "MEDIUM"), c("chc", "CHOICE")], true),
      g("g2", "GREEN BELL PEPPER #2", [
        c("xl", "X-LARGE"),
        c("lge", "LARGE"),
        c("med", "MEDIUM"),
        c("chc", "CHOICE"),
      ]),
    ],
  },
  {
    id: "eggplant",
    name: "Eggplant",
    title: "EGGPLANT",
    groups: [
      g("cart", "EGGPLANT CARTON", [c("18", "18"), c("24", "24"), c("32", "32")]),
      g("rpc", "RPC", [c("2024", "20/24")]),
      g("e2", "EGGPLANT #2 CARTON", [c("18", "18"), c("24", "24")]),
    ],
  },
  {
    id: "green-beans",
    name: "Green Beans",
    title: "GREEN BEANS",
    groups: [
      g("p1", "30# PLASTIC", [c("plastic", "PLASTIC")]),
      g("p2", "30# PLASTIC #2", [c("plastic", "PLASTIC")]),
      g("rpc", "RPC 15/14-1.5# BAG", [c("bag", "BAG")]),
    ],
  },
  {
    id: "roma-tomatoes",
    name: "Roma Tomatoes",
    title: "ROMA TOMATOES",
    groups: [
      g("c1", "ROMA 25# CARTON", [
        c("jbo", "JUMBO"),
        c("2x", "2X"),
        c("xl", "X-LARGE"),
        c("xlc", "XL CROWN"),
        c("lge", "LARGE"),
        c("lgec", "LGE CROWN"),
        c("med", "MEDIUM"),
        c("medc", "MED CROWN"),
      ]),
      g("c2", "ROMA #2 CARTON", [
        c("jbo", "JUMBO"),
        c("xl", "X-LARGE"),
        c("lge", "LARGE"),
        c("med", "MEDIUM"),
        c("sml", "SMALL"),
      ]),
    ],
  },
];

export const boardById = (id: string) => BOARDS.find((b) => b.id === id);

/** Flattened ordered list of every column cell on a board. */
export function boardCells(b: BoardDef): { group: BoardGroup; col: BoardColumn; id: string }[] {
  const out: { group: BoardGroup; col: BoardColumn; id: string }[] = [];
  b.groups.forEach((grp) =>
    grp.columns.forEach((col) => out.push({ group: grp, col, id: colId(grp.key, col.key) }))
  );
  return out;
}

// ---------------- Seed inventory (real growers / packs) ----------------
// Quantities are a starting snapshot; the live board fills real figures as
// inventory is received and Joya orders flow in.
const lot = (
  id: string,
  commodityId: string,
  kind: LotKind,
  grower: string,
  pack: string,
  arrivalDate: string,
  manifest: string,
  qty: Record<string, number>
): InventoryLot => ({ id, commodityId, kind, grower, pack, arrivalDate, manifest, qty });

export const SEED_LOTS: InventoryLot[] = [
  // ---- Cucumbers ----
  lot("bl-cuc-h1", "cucumbers", "holdover", "Agrícola Popo", "AV Crown Stock", "", "", {
    "cuc::ss": 300, "cuc::sel": 90, "cuc::lge": 60, "cuc::36": 380,
  }),
  lot("bl-cuc-h2", "cucumbers", "holdover", "Agrícola Orojo", "DA Crown", "", "", {
    "cuc::ss": 180, "cuc::lge": 120, "cuc::36": 260,
  }),
  lot("bl-cuc-h3", "cucumbers", "holdover", "Ana Berrica", "Voice Taste", "", "", {
    "cuc::sel": 140, "cuc::fcy": 80, "cuc::24": 90,
  }),
  lot("bl-cuc-h4", "cucumbers", "holdover", "El Agrícola", "DIA Crown", "", "", {
    "cuc2::ss": 120, "cuc2::36": 215,
  }),
  lot("bl-cuc-i1", "cucumbers", "incoming", "Agrícola Popo", "AV Crown Stock", "2026-05-24", "432", {
    "cuc::ss": 344, "cuc::sel": 180, "cuc::36": 241,
  }),
  lot("bl-cuc-i2", "cucumbers", "incoming", "Agrícola Popo", "AV Crown Stock", "2026-05-24", "436", {
    "cuc::lge": 488, "cuc::fcy": 160,
  }),
  lot("bl-cuc-i3", "cucumbers", "incoming", "Agrícola Orojo", "DA Crown", "2026-05-26", "0945", {
    "cuc::ss": 0, "cuc::sel": 320, "cuc2::lge": 220,
  }),

  // ---- Persian Cucumber ----
  lot("bl-per-h1", "persian-cucumber", "holdover", "Ursomex", "AU Crown", "", "", {
    "per::fcy": 357, "bags::2": 256,
  }),
  lot("bl-per-i1", "persian-cucumber", "incoming", "Ursomex", "AU Crown", "2026-05-25", "10", {
    "per::fcy": 840, "bags::2": 960,
  }),

  // ---- Squash ----
  lot("bl-sq-h1", "squash", "holdover", "Agrícola Orojo", "AV Crown", "", "", {
    "ital::fcy": 110, "yellow::fcy": 95, "gray::fcy": 60,
  }),
  lot("bl-sq-i1", "squash", "incoming", "Bodelle", "Repack", "2026-05-26", "—", {
    "ital::fcy": 243, "obag::1": 130,
  }),

  // ---- Honeydew ----
  lot("bl-hd-h1", "honeydew", "holdover", "Campos del Desierto", "Crown", "", "", {
    "cart::6": 350, "cart::8": 188, "cart::9": 140,
  }),
  lot("bl-hd-i1", "honeydew", "incoming", "Marcelo Vanegas", "AV Stock", "2026-05-26", "1409", {
    "cart::6": 1240, "cart2::jbo": 1260, "cart2::5": 280,
  }),

  // ---- Red Bell Peppers ----
  lot("bl-rb-h1", "red-bell-peppers", "holdover", "SL Produce", "E Farms", "", "", {
    "r1::lge": 198, "r1::med": 60,
  }),

  // ---- Green Bell Peppers ----
  lot("bl-gb-h1", "green-bell-peppers", "holdover", "Agrícola Bay", "SR Crown Stock", "", "", {
    "g1::lge": 200, "g1::med": 124,
  }),
  lot("bl-gb-i1", "green-bell-peppers", "incoming", "Marcelo Vanegas", "Tendelano", "2026-05-26", "—", {
    "g1::lge": 124, "org::jbo": 124,
  }),

  // ---- Eggplant ----
  lot("bl-eg-h1", "eggplant", "holdover", "Ena America", "ENA Crown", "", "", {
    "cart::24": 62, "cart::32": 78,
  }),
  lot("bl-eg-i1", "eggplant", "incoming", "Agrícola Orqui", "Kings Taste", "2026-05-26", "PR#150631", {
    "cart::24": 0, "cart::32": 0,
  }),

  // ---- Green Beans ----
  lot("bl-bn-h1", "green-beans", "holdover", "SL Agrícola", "Tenderland", "", "", {
    "p1::plastic": 32,
  }),
  lot("bl-bn-i1", "green-beans", "incoming", "SL Agrícola", "Tenderland", "2026-05-06", "11289", {
    "p1::plastic": 56,
  }),

  // ---- Roma Tomatoes ----
  lot("bl-rt-h1", "roma-tomatoes", "holdover", "AGR Export", "AV Crown Stock", "", "", {
    "c1::lge": 480,
  }),
  lot("bl-rt-i1", "roma-tomatoes", "incoming", "AGR Export", "AV Crown Stock", "2026-05-26", "—", {
    "c1::lge": 408,
  }),
];
