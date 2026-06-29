"use client";

/* ============================================================
   Crown Jewels Produce — PASSING sales sheet
   --------------------------------------------------------------
   The transaction document generated when an order ships. Modeled
   on the brokerage "PASSING" sales invoice but Crown Jewels-branded:
   a header, Bill-To / Ship-To blocks, order meta, and a lines table
   that — unlike a plain invoice — carries a LOT column. The lot ties
   each line's sale price back to the exact grower lot, so Accounting
   / Settlement know what every lot's product actually sold for.

   Renders purely from a ShipmentDoc. Opened inside a print modal:
   a top action bar (Close / Print) over the sheet; @media print
   isolates just the sheet (see shipping-sales-sheet.css).
   ============================================================ */

import type { ShipmentDoc } from "./shipmentDoc";
import { firstName } from "../user";
import "./shipping-sales-sheet.css";

const money = (n: number) =>
  (n || 0).toLocaleString("en-US", { style: "currency", currency: "USD" });
const num = (n: number) => Math.round(n || 0).toLocaleString("en-US");

const CJ_ADDRESS = [
  "Crown Jewels Produce Company, LLC",
  "P.O. Box 877",
  "Nogales, AZ 85628-0877",
  "USA · (520) 555-0142",
];

function AddressBlock({
  label,
  lines,
}: {
  label: string;
  lines: string[];
}) {
  const clean = lines.filter(Boolean);
  return (
    <div className="css-party">
      <span className="css-party-label">{label}</span>
      {clean.length > 0 ? (
        clean.map((l, i) => (
          <span key={i} className={i === 0 ? "css-party-name" : "css-party-line"}>
            {l}
          </span>
        ))
      ) : (
        <span className="css-party-line">—</span>
      )}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="css-meta-cell">
      <span className="css-meta-label">{label}</span>
      <b className="css-meta-value">{value || "—"}</b>
    </div>
  );
}

export default function ShippingSalesSheet({
  doc,
  onClose,
}: {
  doc: ShipmentDoc;
  onClose: () => void;
}) {
  const printedAt = new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const billTo = doc.billTo && doc.billTo.length > 0 ? doc.billTo : [doc.customer];
  const shipTo = doc.shipTo && doc.shipTo.length > 0 ? doc.shipTo : [doc.customer];

  return (
    <div className="css-back" onClick={onClose}>
      <div className="css-wrap" onClick={(e) => e.stopPropagation()}>
        {/* action bar — hidden in print */}
        <div className="css-actions">
          <button className="css-btn ghost" onClick={onClose}>
            Close
          </button>
          <button className="css-btn primary" onClick={() => window.print()}>
            <svg
              width="14"
              height="14"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659"
              />
            </svg>
            Print / Save PDF
          </button>
        </div>

        {/* the document */}
        <article className="css-sheet" role="document" aria-label="PASSING sales sheet">
          {/* header */}
          <header className="css-head">
            <div className="css-head-left">
              <h1 className="css-passing">PASSING</h1>
              <div className="css-co">
                <b>CROWN JEWELS PRODUCE</b>
                {CJ_ADDRESS.slice(1).map((l, i) => (
                  <span key={i}>{l}</span>
                ))}
              </div>
            </div>
            <div className="css-head-right">
              <span className="css-crest">CJ</span>
              <div className="css-totbox">
                <div>
                  <span>Cases</span>
                  <b>{num(doc.totalCases)}</b>
                </div>
                <div>
                  <span>Pallets</span>
                  <b>{num(doc.pallets)}</b>
                </div>
                <div>
                  <span>Weight</span>
                  <b>{num(doc.totalWeightLb)} lb</b>
                </div>
              </div>
            </div>
          </header>

          {/* parties */}
          <div className="css-parties">
            <AddressBlock label="Bill To" lines={billTo} />
            <AddressBlock label="Ship To" lines={shipTo} />
          </div>

          {/* order meta */}
          <div className="css-meta">
            <Meta label="Order No." value={doc.orderNumber} />
            <Meta label="Salesperson" value={firstName(doc.salesperson)} />
            <Meta label="Cust PO" value={doc.customerPO} />
            <Meta label="Terms" value={doc.terms || "—"} />
            <Meta label="Order Date" value={doc.orderDate} />
            <Meta label="Ship Date" value={doc.shipDate} />
            <Meta label="Carrier" value={doc.carrier} />
            <Meta label="Trailer / Seal" value={[doc.trailer, doc.seal].filter(Boolean).join(" · ") || "—"} />
          </div>

          {/* lines */}
          <table className="css-table">
            <thead>
              <tr>
                <th className="l">Description</th>
                <th className="l">Size</th>
                <th className="l lot">Lot</th>
                <th className="n">Shipped</th>
                <th className="c">UOM</th>
                <th className="n">Price</th>
                <th className="n">Amount</th>
              </tr>
            </thead>
            <tbody>
              {doc.lines.length === 0 ? (
                <tr>
                  <td colSpan={7} className="css-empty">
                    No lines on this order.
                  </td>
                </tr>
              ) : (
                doc.lines.map((l, i) => (
                  <tr key={`${l.commodityId}-${i}`}>
                    <td className="l">{l.description}</td>
                    <td className="l">{l.size || "—"}</td>
                    <td className="l lot">
                      <span className="css-lot">{l.lot}</span>
                    </td>
                    <td className="n">{num(l.cases)}</td>
                    <td className="c">{l.uom}</td>
                    <td className="n">{money(l.unitPrice)}</td>
                    <td className="n">{money(l.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="css-total">
                <td className="l" colSpan={3}>
                  Total
                </td>
                <td className="n">{num(doc.totalCases)}</td>
                <td className="c" />
                <td className="n" />
                <td className="n">{money(doc.totalAmount)}</td>
              </tr>
            </tfoot>
          </table>

          {/* lot note */}
          <p className="css-lotnote">
            The <b>Lot</b> column records the grower lot each line was filled
            from — tying this sale price back to the lot for Accounting and
            grower settlement.
          </p>

          {/* signatures */}
          <div className="css-sign">
            <div className="css-sign-cell">
              <span className="css-sign-line" />
              <span className="css-sign-label">Received by</span>
            </div>
            <div className="css-sign-cell">
              <span className="css-sign-line" />
              <span className="css-sign-label">Date</span>
            </div>
          </div>

          <footer className="css-foot">
            <span>{printedAt}</span>
            <span>Page 1 of 1</span>
          </footer>
        </article>
      </div>
    </div>
  );
}
