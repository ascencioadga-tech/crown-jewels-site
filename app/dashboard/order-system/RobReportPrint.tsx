"use client";

// Rob's Report — print view. Renders every commodity board as an HTML table
// styled to mirror the real AGRIPACKING / Nogales availability sheets, one
// commodity per printed page (landscape, auto-scaled to fit a single page).
// Portaled to <body> so it can be isolated from the app shell during print.

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  BOARDS,
  boardCells,
  SEED_LOTS,
  type BoardDef,
  type InventoryLot,
} from "./boards";
import type { Order } from "./useOrders";

// ---- size <-> column matching (mirrors robReport.ts) ----
const norm = (s: string) => String(s).toUpperCase().replace(/[^A-Z0-9]/g, "");
const ALIAS: Record<string, string> = {
  LG: "LARGE", LRG: "LARGE", JBO: "JUMBO", XL: "XLARGE", XLG: "XLARGE",
  MED: "MEDIUM", SEL: "SELECT", SS: "SS", FCY: "FANCY", XFCY: "XFCY",
  SM: "SMALL", SML: "SMALL", CHC: "CHOICE",
};
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

// ---- page geometry (Letter landscape @96dpi, ~0.375in margins) ----
const USABLE_W = 984;
const USABLE_H = 744;
const LEFT_W = 390; // sum of the five left columns below
const COL_W = 40;
const LEFT_COLS = [64, 132, 64, 60, 70];

type Computed = {
  board: BoardDef;
  cells: ReturnType<typeof boardCells>;
  holdover: InventoryLot[];
  incoming: InventoryLot[];
  startTotals: Record<string, number>;
  orderRows: { o: Order; qty: Record<string, number> }[];
  orderedTotals: Record<string, number>;
  scale: number;
};

function computeBoard(board: BoardDef, lots: InventoryLot[], orders: Order[]): Computed {
  const cells = boardCells(board);
  const mine = lots.filter((l) => l.commodityId === board.id);
  const holdover = mine.filter((l) => l.kind === "holdover");
  const incoming = mine.filter((l) => l.kind === "incoming");

  const startTotals: Record<string, number> = {};
  cells.forEach((c) => (startTotals[c.id] = 0));
  mine.forEach((l) =>
    cells.forEach((c) => {
      startTotals[c.id] += l.qty[c.id] || 0;
    })
  );

  const match = columnMatcher(cells);
  const orderedTotals: Record<string, number> = {};
  cells.forEach((c) => (orderedTotals[c.id] = 0));
  const comOrders = orders.filter(
    (o) => o.status !== "cancelled" && o.lines.some((l) => l.commodityId === board.id)
  );
  const orderRows = comOrders.map((o) => {
    const qty: Record<string, number> = {};
    o.lines
      .filter((l) => l.commodityId === board.id)
      .forEach((l) => {
        const id = match(l.size);
        if (!id) return;
        qty[id] = (qty[id] || 0) + l.quantity;
        orderedTotals[id] += l.quantity;
      });
    return { o, qty };
  });

  // Auto-fit scale: shrink (never enlarge) so the sheet fits one landscape page.
  const N = cells.length;
  const contentW = LEFT_W + N * COL_W;
  const rowCount = holdover.length + incoming.length + orderRows.length + 7;
  const contentH = 60 + rowCount * 15;
  const scale = Math.min(1, USABLE_W / contentW, USABLE_H / contentH);

  return { board, cells, holdover, incoming, startTotals, orderRows, orderedTotals, scale };
}

function GroupCells({ board }: { board: BoardDef }) {
  return (
    <>
      {board.groups.map((grp) => (
        <td
          key={grp.key}
          colSpan={grp.columns.length}
          className={`rr-grp ${grp.organic ? "org" : "dark"}`}
        >
          {grp.title}
        </td>
      ))}
    </>
  );
}

function LotRows({
  lots,
  label,
  cells,
}: {
  lots: InventoryLot[];
  label: string;
  cells: Computed["cells"];
}) {
  if (lots.length === 0) return null;
  return (
    <>
      {lots.map((l, i) => (
        <tr key={l.id}>
          {i === 0 && (
            <td className="rr-kind" rowSpan={lots.length}>
              {label}
            </td>
          )}
          <td className="rr-grower">{l.grower}</td>
          <td className="rr-num">{l.arrivalDate || ""}</td>
          <td className="rr-num">{l.manifest || ""}</td>
          <td className="rr-num">{l.pack || ""}</td>
          {cells.map((c) => {
            const q = l.qty[c.id] || 0;
            return (
              <td key={c.id} className="rr-num">
                {q || ""}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}

function Sheet({ data }: { data: Computed }) {
  const { board, cells, holdover, incoming, startTotals, orderRows, orderedTotals, scale } = data;
  const totalCols = 5 + cells.length;
  return (
    <div className="rr-page">
      <div className="rr-scale" style={{ zoom: scale }}>
        <table className="rr-table">
          <colgroup>
            {LEFT_COLS.map((w, i) => (
              <col key={i} style={{ width: w }} />
            ))}
            {cells.map((c) => (
              <col key={c.id} style={{ width: COL_W }} />
            ))}
          </colgroup>
          <tbody>
            {/* Page header */}
            <tr>
              <td className="rr-pagehdr" colSpan={totalCols}>
                AGRIPACKING, NOGALES, AZ
              </td>
            </tr>
            {/* Group header */}
            <tr>
              <td className="rr-title" colSpan={5}>
                {board.title}
              </td>
              <GroupCells board={board} />
            </tr>
            {/* Column labels */}
            <tr>
              {["", "GROWER", "ARRIVAL", "MANIFEST", "PACK"].map((t, i) => (
                <td key={i} className="rr-col">
                  {t}
                </td>
              ))}
              {cells.map((c) => (
                <td key={c.id} className="rr-col">
                  {c.col.label}
                </td>
              ))}
            </tr>
            {/* Inventory */}
            <LotRows lots={holdover} label="HOLDOVER" cells={cells} />
            <LotRows lots={incoming} label="INCOMING" cells={cells} />
            {/* Starting inventory */}
            <tr>
              <td className="rr-sum lbl" colSpan={5}>
                STARTING INVENTORY
              </td>
              {cells.map((c) => (
                <td key={c.id} className="rr-sum">
                  {startTotals[c.id]}
                </td>
              ))}
            </tr>
            {/* Spacer */}
            <tr className="rr-spacer">
              <td colSpan={totalCols} />
            </tr>
            {/* Today's orders band */}
            <tr>
              <td className="rr-band" colSpan={5}>
                TODAY&apos;S ORDERS
              </td>
              <GroupCells board={board} />
            </tr>
            {/* Order column header */}
            <tr>
              {["ORDER #", "CUSTOMER", "DESTINATION", "PO #", "SHIP DATE"].map((t, i) => (
                <td key={i} className="rr-col">
                  {t}
                </td>
              ))}
              {cells.map((c) => (
                <td key={c.id} className="rr-col">
                  {c.col.label}
                </td>
              ))}
            </tr>
            {/* Order rows */}
            {orderRows.map(({ o, qty }) => (
              <tr key={o.id}>
                <td className="rr-num">{o.orderNumber}</td>
                <td className="rr-grower">{o.customerName}</td>
                <td>{o.destination || ""}</td>
                <td className="rr-num">{o.customerPO || ""}</td>
                <td className="rr-num">{o.shipDate || ""}</td>
                {cells.map((c) => (
                  <td key={c.id} className="rr-num">
                    {qty[c.id] || ""}
                  </td>
                ))}
              </tr>
            ))}
            {/* Order total */}
            <tr>
              <td className="rr-sum lbl" colSpan={5}>
                TODAY&apos;S ORDER TOTAL
              </td>
              {cells.map((c) => (
                <td key={c.id} className="rr-sum">
                  {orderedTotals[c.id]}
                </td>
              ))}
            </tr>
            {/* Available */}
            <tr>
              <td className="rr-avail lbl" colSpan={5}>
                TODAY&apos;S AVAILABLE
              </td>
              {cells.map((c) => {
                const a = (startTotals[c.id] || 0) - (orderedTotals[c.id] || 0);
                return (
                  <td key={c.id} className={`rr-avail ${a < 0 ? "rr-neg" : "rr-pos"}`}>
                    {a}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Hidden on screen; revealed only during print (see order-system.css,
 * `body.rr-printing`). Renders one auto-scaled landscape sheet per commodity.
 */
export default function RobReportPrint({
  orders,
  lots = SEED_LOTS,
}: {
  orders: Order[];
  lots?: InventoryLot[];
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const sheets = BOARDS.map((b) => computeBoard(b, lots, orders));

  return createPortal(
    <div className="rr-print-root" aria-hidden>
      {sheets.map((s) => (
        <Sheet key={s.board.id} data={s} />
      ))}
    </div>,
    document.body
  );
}
