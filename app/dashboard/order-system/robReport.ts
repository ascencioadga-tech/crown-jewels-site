"use client";

// Rob's Report — generates the per-commodity availability workbook (.xlsx),
// formatted to mirror the real AGRIPACKING / Nogales sheets, from the board
// definitions + seeded inventory + live Joya orders. ExcelJS is loaded lazily.

import {
  BOARDS,
  boardCells,
  SEED_LOTS,
  type BoardDef,
  type InventoryLot,
} from "./boards";
import type { Order } from "./useOrders";

const GREEN_DARK = "FF548235";
const GREEN = "FF70AD47";
const GREEN_LT = "FFE2EFDA";
const YELLOW = "FFFFF2CC";
const GREY = "FFF2F2F2";

const norm = (s: string) =>
  String(s).toUpperCase().replace(/[^A-Z0-9]/g, "");
const ALIAS: Record<string, string> = {
  LG: "LARGE",
  LRG: "LARGE",
  JBO: "JUMBO",
  XL: "XLARGE",
  XLG: "XLARGE",
  MED: "MEDIUM",
  SEL: "SELECT",
  SS: "SS",
  FCY: "FANCY",
  XFCY: "XFCY",
  SM: "SMALL",
  SML: "SMALL",
  CHC: "CHOICE",
};

/** Map an order line's size string to a board column id. */
function columnMatcher(cells: ReturnType<typeof boardCells>) {
  const map: Record<string, string> = {};
  cells.forEach((cell) => {
    const ln = norm(cell.col.label);
    const kn = norm(cell.col.key);
    if (!(ln in map)) map[ln] = cell.id;
    if (!(kn in map)) map[kn] = cell.id;
  });
  return (size: string): string | null => {
    const n = norm(size);
    if (map[n]) return map[n];
    const a = ALIAS[n];
    if (a && map[norm(a)]) return map[norm(a)];
    return null;
  };
}

type AnyCell = {
  value: unknown;
  font?: unknown;
  alignment?: unknown;
  fill?: unknown;
  border?: unknown;
};

function paint(cell: AnyCell, argb: string) {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb } };
}

/** Build one commodity worksheet, returns a small summary for verification. */
function buildSheet(
  wb: { addWorksheet: (n: string, o?: unknown) => any },
  board: BoardDef,
  lots: InventoryLot[],
  orders: Order[]
) {
  const ws = wb.addWorksheet(board.name, {
    views: [{ state: "frozen", xSplit: 5, ySplit: 3 }],
  });
  const cells = boardCells(board);
  const N = cells.length;
  const LEFT = 5;
  const totalCols = LEFT + N;

  ws.getColumn(1).width = 11;
  ws.getColumn(2).width = 22;
  ws.getColumn(3).width = 13;
  ws.getColumn(4).width = 12;
  ws.getColumn(5).width = 13;
  for (let i = 0; i < N; i++) ws.getColumn(LEFT + 1 + i).width = 8.5;

  let r = 1;

  // Page header
  ws.mergeCells(r, 1, r, totalCols);
  const ph = ws.getCell(r, 1);
  ph.value = "AGRIPACKING, NOGALES, AZ";
  ph.alignment = { horizontal: "center" };
  ph.font = { bold: true, size: 12 };
  r++;

  // Group header row
  const groupRow = r;
  ws.mergeCells(groupRow, 1, groupRow, LEFT);
  const tt = ws.getCell(groupRow, 1);
  tt.value = board.title;
  tt.font = { bold: true, color: { argb: "FFFFFFFF" } };
  tt.alignment = { horizontal: "left", vertical: "middle" };
  paint(tt, GREEN_DARK);
  let col = LEFT + 1;
  const drawGroups = (rowIdx: number) => {
    let cc = LEFT + 1;
    board.groups.forEach((grp) => {
      const span = grp.columns.length;
      if (span > 1) ws.mergeCells(rowIdx, cc, rowIdx, cc + span - 1);
      const gc = ws.getCell(rowIdx, cc);
      gc.value = grp.title;
      gc.alignment = { horizontal: "center", vertical: "middle" };
      gc.font = { bold: true, size: 9, color: { argb: "FFFFFFFF" } };
      paint(gc, grp.organic ? GREEN : GREEN_DARK);
      cc += span;
    });
  };
  drawGroups(groupRow);
  col = LEFT + 1;
  r++;

  // Column label row
  const labelRow = r;
  ["", "GROWER", "ARRIVAL", "MANIFEST", "PACK"].forEach((t, i) => {
    const cc = ws.getCell(labelRow, i + 1);
    cc.value = t;
    cc.font = { bold: true, size: 9 };
    cc.alignment = { horizontal: "center" };
    paint(cc, GREEN_LT);
  });
  cells.forEach((cell, i) => {
    const cc = ws.getCell(labelRow, LEFT + 1 + i);
    cc.value = cell.col.label;
    cc.font = { bold: true, size: 9 };
    cc.alignment = { horizontal: "center" };
    paint(cc, GREEN_LT);
  });
  r++;

  // Inventory rows
  const startTotals: Record<string, number> = {};
  cells.forEach((c) => (startTotals[c.id] = 0));

  const writeLots = (rows: InventoryLot[], label: string) => {
    if (rows.length === 0) return;
    const first = r;
    rows.forEach((l) => {
      ws.getCell(r, 2).value = l.grower;
      ws.getCell(r, 3).value = l.arrivalDate || "";
      ws.getCell(r, 4).value = l.manifest || "";
      ws.getCell(r, 5).value = l.pack || "";
      cells.forEach((cell, i) => {
        const q = l.qty[cell.id] || 0;
        if (q) {
          ws.getCell(r, LEFT + 1 + i).value = q;
          startTotals[cell.id] += q;
        }
      });
      r++;
    });
    ws.mergeCells(first, 1, r - 1, 1);
    const kc = ws.getCell(first, 1);
    kc.value = label;
    kc.font = { bold: true };
    kc.alignment = { horizontal: "center", vertical: "middle" };
    paint(kc, GREY);
  };
  writeLots(lots.filter((l) => l.kind === "holdover"), "HOLDOVER");
  writeLots(lots.filter((l) => l.kind === "incoming"), "INCOMING");

  // Starting inventory
  ws.mergeCells(r, 1, r, LEFT);
  const si = ws.getCell(r, 1);
  si.value = "STARTING INVENTORY";
  si.font = { bold: true };
  si.alignment = { horizontal: "right" };
  paint(si, GREEN_LT);
  cells.forEach((cell, i) => {
    const cc = ws.getCell(r, LEFT + 1 + i);
    cc.value = startTotals[cell.id];
    cc.font = { bold: true };
    cc.alignment = { horizontal: "center" };
    paint(cc, GREEN_LT);
  });
  r += 2; // gap

  // Today's orders band + repeated group headers
  ws.mergeCells(r, 1, r, LEFT);
  const ob = ws.getCell(r, 1);
  ob.value = "TODAY'S ORDERS";
  ob.font = { bold: true, color: { argb: "FFFFFFFF" } };
  ob.alignment = { horizontal: "left", vertical: "middle" };
  paint(ob, GREEN_DARK);
  drawGroups(r);
  r++;

  // Order column headers
  ["ORDER #", "CUSTOMER", "DESTINATION", "PO #", "SHIP DATE"].forEach((t, i) => {
    const cc = ws.getCell(r, i + 1);
    cc.value = t;
    cc.font = { bold: true, size: 9 };
    cc.alignment = { horizontal: "center" };
    paint(cc, GREEN_LT);
  });
  cells.forEach((cell, i) => {
    const cc = ws.getCell(r, LEFT + 1 + i);
    cc.value = cell.col.label;
    cc.font = { bold: true, size: 9 };
    cc.alignment = { horizontal: "center" };
    paint(cc, GREEN_LT);
  });
  r++;

  // Order rows
  const orderedTotals: Record<string, number> = {};
  cells.forEach((c) => (orderedTotals[c.id] = 0));
  const match = columnMatcher(cells);
  const comOrders = orders.filter(
    (o) => o.status !== "cancelled" && o.lines.some((l) => l.commodityId === board.id)
  );
  comOrders.forEach((o) => {
    ws.getCell(r, 1).value = o.orderNumber;
    ws.getCell(r, 2).value = o.customerName;
    ws.getCell(r, 3).value = o.destination || "";
    ws.getCell(r, 4).value = o.customerPO || "";
    ws.getCell(r, 5).value = o.shipDate || "";
    o.lines
      .filter((l) => l.commodityId === board.id)
      .forEach((l) => {
        const id = match(l.size);
        if (!id) return;
        const idx = cells.findIndex((c) => c.id === id);
        if (idx < 0) return;
        const cc = ws.getCell(r, LEFT + 1 + idx);
        cc.value = (Number(cc.value) || 0) + l.quantity;
        orderedTotals[id] += l.quantity;
      });
    r++;
  });

  // Today's order total
  ws.mergeCells(r, 1, r, LEFT);
  const otc = ws.getCell(r, 1);
  otc.value = "TODAY'S ORDER TOTAL";
  otc.font = { bold: true };
  otc.alignment = { horizontal: "right" };
  paint(otc, GREEN_LT);
  cells.forEach((cell, i) => {
    const cc = ws.getCell(r, LEFT + 1 + i);
    cc.value = orderedTotals[cell.id];
    cc.font = { bold: true };
    cc.alignment = { horizontal: "center" };
    paint(cc, GREEN_LT);
  });
  r++;

  // Today's available
  ws.mergeCells(r, 1, r, LEFT);
  const ac = ws.getCell(r, 1);
  ac.value = "TODAY'S AVAILABLE";
  ac.font = { bold: true };
  ac.alignment = { horizontal: "right" };
  paint(ac, YELLOW);
  cells.forEach((cell, i) => {
    const a = (startTotals[cell.id] || 0) - (orderedTotals[cell.id] || 0);
    const cc = ws.getCell(r, LEFT + 1 + i);
    cc.value = a;
    cc.font = { bold: true, color: { argb: a < 0 ? "FFC00000" : "FF375623" } };
    cc.alignment = { horizontal: "center" };
    paint(cc, YELLOW);
  });
  const lastRow = r;

  // Thin borders across the whole used range
  for (let rr = 1; rr <= lastRow; rr++) {
    for (let ccx = 1; ccx <= totalCols; ccx++) {
      const cell = ws.getCell(rr, ccx);
      cell.border = {
        top: { style: "thin", color: { argb: "FFBFBFBF" } },
        left: { style: "thin", color: { argb: "FFBFBFBF" } },
        bottom: { style: "thin", color: { argb: "FFBFBFBF" } },
        right: { style: "thin", color: { argb: "FFBFBFBF" } },
      };
    }
  }

  return {
    name: board.name,
    columns: N,
    startingTotal: Object.values(startTotals).reduce((s, n) => s + n, 0),
    orderedTotal: Object.values(orderedTotals).reduce((s, n) => s + n, 0),
  };
}

export async function buildWorkbook(orders: Order[], lots: InventoryLot[] = SEED_LOTS) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "Sales Desk — Crown Jewels";
  wb.created = new Date();
  const summary = BOARDS.map((b) =>
    buildSheet(
      wb as unknown as { addWorksheet: (n: string, o?: unknown) => any },
      b,
      lots.filter((l) => l.commodityId === b.id),
      orders
    )
  );
  return { wb, summary };
}

/** Build + download the workbook. Stashes a summary on window for inspection. */
export async function downloadRobReport(orders: Order[], lots: InventoryLot[] = SEED_LOTS) {
  const { wb, summary } = await buildWorkbook(orders, lots);
  try {
    (window as unknown as { __robReport?: unknown }).__robReport = {
      sheets: wb.worksheets.map((w) => w.name),
      summary,
    };
  } catch {}
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `crown-jewels-availability-${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
