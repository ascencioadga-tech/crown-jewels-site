"use client";

/* ============================================================
   Crown Jewels — Straight Bill of Lading.

   The freight document. Renders entirely from a ShipmentDoc the
   Shipping app assembles when an order ships. Each ShipmentDocLine
   becomes one Packages / Description / Weight row; the grower LOT
   travels on every line so the load ties back to the exact lot.

   Presented as a full-screen modal: dimmed backdrop + a centered,
   scrollable white sheet, with a top action bar (Close · Print).
   Print isolates only the .cj-bol sheet (see bill-of-lading.css).

   Pure CSS — no motion library (preview pauses rAF).
   ============================================================ */

import type { ShipmentDoc, ShipmentDocLine } from "./shipmentDoc";
import "./bill-of-lading.css";

/* round + thousands-separate, tolerant of NaN/undefined */
const num = (n: number) => Math.round(Number(n) || 0).toLocaleString("en-US");

/* "—" placeholder so empty fields still read like a real form */
const txt = (s: string | undefined | null) => {
  const v = (s ?? "").toString().trim();
  return v.length ? v : "—";
};

/* Build the uppercase carton description for a line, e.g.
   "CUCUMBERS SLICERS CARTON · SELECT · LOT GR-1182 · MEXICO".
   Uses the line's own description (which already carries grade /
   origin) and folds in size + lot without duplicating tokens. */
function cartonDescription(line: ShipmentDocLine): string {
  const parts: string[] = [];
  const base = (line.description ?? "").trim();
  if (base) parts.push(base.replace(/\s*[—–-]\s*/g, " · "));

  const size = (line.size ?? "").trim();
  if (size && !base.toUpperCase().includes(size.toUpperCase())) {
    parts.push(size);
  }

  const lot = (line.lot ?? "").trim();
  if (lot) parts.push(`LOT ${lot}`);

  if (!parts.length) return "PRODUCE";
  return parts.join(" · ").toUpperCase();
}

export default function BillOfLading({
  doc,
  onClose,
}: {
  doc: ShipmentDoc;
  onClose: () => void;
}) {
  const lines = Array.isArray(doc?.lines) ? doc.lines : [];
  const shipTo = Array.isArray(doc?.shipTo) ? doc.shipTo.filter(Boolean) : [];

  return (
    <div
      className="cj-bol-back"
      role="dialog"
      aria-modal="true"
      aria-label="Straight Bill of Lading"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="cj-bol-wrap">
        {/* ---------------- top action bar (hidden on print) ---------------- */}
        <div className="cj-bol-actions">
          <button type="button" className="cj-bol-btn ghost" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="cj-bol-btn primary"
            onClick={() => window.print()}
          >
            Print / Save PDF
          </button>
        </div>

        {/* ============================ the sheet ============================ */}
        <div className="cj-bol">
          {/* title bar */}
          <div className="cj-bol-titlebar">
            Straight Bill of Lading for Exempt Commodities
            <span className="neg">Original · Non-Negotiable</span>
          </div>

          {/* masthead */}
          <div className="cj-bol-masthead">
            <div className="cj-bol-brand">
              <div className="cj-bol-crest">CJ</div>
              <div>
                <div className="cj-bol-name">
                  Crown Jewels Produce
                  <small>Year-Round · Grower-Direct</small>
                </div>
              </div>
            </div>
            <div className="cj-bol-addr">
              <b>Crown Jewels Produce Sales</b>
              <br />
              P.O. Box 977
              <br />
              Fresno, CA 93729
              <br />
              <span className="ph">Phone (559) 436-2555</span>
              <br />
              <span className="ph">Fax (559) 436-2341</span>
            </div>
          </div>

          {/* order / salesperson / cust PO + dates */}
          <div className="cj-bol-block">
            <div className="cj-bol-row">
              <div className="cj-bol-cell">
                <span className="cj-bol-lab">Order Number</span>
                <span className="cj-bol-val tnum">
                  {txt(doc?.orderNumber)}
                </span>
              </div>
              <div className="cj-bol-cell">
                <span className="cj-bol-lab">Salesperson</span>
                <span className="cj-bol-val">{txt(doc?.salesperson)}</span>
              </div>
              <div className="cj-bol-cell">
                <span className="cj-bol-lab">Customer P.O.</span>
                <span className="cj-bol-val">{txt(doc?.customerPO)}</span>
              </div>
              <div className="cj-bol-cell">
                <span className="cj-bol-lab">Order Date</span>
                <span className="cj-bol-val tnum">{txt(doc?.orderDate)}</span>
              </div>
              <div className="cj-bol-cell">
                <span className="cj-bol-lab">Ship Date</span>
                <span className="cj-bol-val tnum">{txt(doc?.shipDate)}</span>
              </div>
            </div>
          </div>

          {/* consignee + ship-to */}
          <div className="cj-bol-block">
            <div className="cj-bol-grid2">
              <div className="cj-bol-party">
                <span className="cj-bol-lab">Consignee</span>
                <b>{txt(doc?.customer)}</b>
              </div>
              <div className="cj-bol-party">
                <span className="cj-bol-lab">Destination — Ship To</span>
                <b>{shipTo.length ? shipTo[0] : txt(doc?.customer)}</b>
                {shipTo.length > 1 && <p>{shipTo.slice(1).join("\n")}</p>}
                {!!doc?.destination && shipTo.length <= 1 && (
                  <p>{doc.destination}</p>
                )}
              </div>
            </div>
          </div>

          {/* carrier / trailer / FOB-destination */}
          <div className="cj-bol-block">
            <div className="cj-bol-row">
              <div className="cj-bol-cell">
                <span className="cj-bol-lab">Carrier</span>
                <span className="cj-bol-val">{txt(doc?.carrier)}</span>
              </div>
              <div className="cj-bol-cell">
                <span className="cj-bol-lab">Trailer / Seal</span>
                <span className="cj-bol-val">{txt(doc?.trailer)}</span>
              </div>
              <div className="cj-bol-cell">
                <span className="cj-bol-lab">F.O.B. / Destination</span>
                <span className="cj-bol-val">{txt(doc?.destination)}</span>
              </div>
              <div className="cj-bol-cell">
                <span className="cj-bol-lab">Pallets</span>
                <span className="cj-bol-val tnum">{num(doc?.pallets)}</span>
              </div>
            </div>
          </div>

          {/* articles table */}
          <div className="cj-bol-tabwrap">
            <table className="cj-bol-table">
              <thead>
                <tr>
                  <th className="c">Packages</th>
                  <th className="c">Shipped</th>
                  <th>
                    Description of Articles, Special Marks &amp; Exceptions
                  </th>
                  <th className="r">Weight (lb)</th>
                </tr>
              </thead>
              <tbody>
                {lines.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="cj-bol-empty">
                      No commodities on this load.
                    </td>
                  </tr>
                ) : (
                  lines.map((line, i) => (
                    <tr key={`${line.commodityId || "line"}-${i}`}>
                      <td className="c">{num(line.cases)}</td>
                      <td className="c">{num(line.cases)}</td>
                      <td className="cj-bol-desc">{cartonDescription(line)}</td>
                      <td className="r">{num(line.weightLb)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td className="lab" colSpan={2}>
                    Total Packages
                  </td>
                  <td>{num(doc?.totalCases)}</td>
                  <td className="r">{num(doc?.totalWeightLb)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* temperature + recording / delivery instructions */}
          <div className="cj-bol-instr">
            <div className="panel">
              <div className="cj-bol-sectitle">Temperature Instructions</div>
              <div className="cj-bol-temp">
                <div>
                  <span className="cj-bol-lab">Low °F</span>
                  <div className="t">{txt(doc?.reeferTemp)}</div>
                </div>
                <div>
                  <span className="cj-bol-lab">High °F</span>
                  <div className="t">{txt(doc?.reeferTemp)}</div>
                </div>
              </div>
              <p>
                Carrier to maintain continuous refrigeration and recording at
                the set point above. Pre-cool trailer before loading.
              </p>
            </div>
            <div className="panel">
              <div className="cj-bol-sectitle">Delivery Instructions</div>
              <div className="cj-bol-callout">
                Driver must call consignee collect every 24 hours.
              </div>
              <p>
                Recorder placed at rear of load. Do not break seal except by
                consignee or government authority. Note any exceptions on
                delivery.
              </p>
            </div>
          </div>

          {/* freight terms + carrier / TRU compliance */}
          <div className="cj-bol-freight">
            <div className="big">
              This shipment is freight collect (unless otherwise stated).
            </div>
            <p>
              Carrier represents that the transport refrigeration unit (TRU)
              used to haul this load is compliant with California Air Resources
              Board (CARB) regulations and is registered in the ARB Equipment
              Registration (ARBER) system, as required for produce moving in or
              through California.
            </p>
          </div>

          {/* legal receipt text */}
          <div className="cj-bol-legal">
            I have received the above-described property in good shipping
            condition, except as noted, and have verified the count. The
            property described above is in apparent good order, except as noted
            (contents and condition of contents of packages unknown), marked,
            consigned and destined as indicated above, which said carrier agrees
            to carry to destination and to deliver to the consignee. Every
            service to be performed hereunder shall be subject to all the
            conditions, whether printed or written, herein contained, including
            the conditions on the back hereof, which are hereby agreed to by the
            shipper and accepted for himself and his assigns. These commodities
            are exempt under 49 U.S.C. §13506.
          </div>

          {/* signatures */}
          <div className="cj-bol-sigs">
            <div className="cj-bol-sig">
              <div className="cj-bol-sig-line">
                <span className="rule" />
                <small>Driver Signature</small>
              </div>
              <div className="cj-bol-sig-line cj-bol-sig-date">
                <span className="rule" />
                <small>Date</small>
              </div>
            </div>
            <div className="cj-bol-sig">
              <div className="cj-bol-sig-line">
                <span className="rule" />
                <small>Owner / Agent Signature</small>
              </div>
              <div className="cj-bol-sig-line cj-bol-sig-date">
                <span className="rule" />
                <small>Date</small>
              </div>
            </div>
          </div>

          {/* footer — colored-copy distribution + page */}
          <div className="cj-bol-foot">
            <div className="copies">
              <span className="w">White — Original</span>
              <span className="y">Yellow — Office</span>
              <span className="w">White — Driver</span>
            </div>
            <div className="pg">Page 1 of 1</div>
          </div>
        </div>
      </div>
    </div>
  );
}
