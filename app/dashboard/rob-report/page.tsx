"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useOrders } from "../order-system/useOrders";
import { downloadRobReport } from "../order-system/robReport";
import RobReportPrint from "../order-system/RobReportPrint";
import { BOARDS } from "../order-system/boards";
import "../order-system/order-system.css";

// Rob's Report — the per-commodity availability workbook, standalone. Built live
// from current inventory + every order on the Sales Desk. (Same view that used
// to live behind the Sales Desk "Rob's Report" tab.)
export default function RobReportPage() {
  const { orders } = useOrders();
  const [exporting, setExporting] = useState(false);

  const exportReport = async () => {
    setExporting(true);
    try {
      await downloadRobReport(orders);
    } catch (e) {
      console.error("Rob's Report export failed", e);
    } finally {
      setTimeout(() => setExporting(false), 700);
    }
  };

  const printReport = () => {
    const prevTitle = document.title;
    document.title = `crown-jewels-availability-${new Date().toISOString().slice(0, 10)}`;
    const cleanup = () => {
      document.body.classList.remove("rr-printing");
      document.title = prevTitle;
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    document.body.classList.add("rr-printing");
    window.print();
  };

  return (
    <div className="cj-os">
      <main className="os-main">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="os-page-head"
        >
          <div>
            <h1>
              Rob&apos;s Report<span className="accent">.</span>
            </h1>
            <p className="os-sub">
              The per-commodity availability workbook — generated live from current
              inventory and every order on the Sales Desk, formatted exactly like the
              Nogales sheets.
            </p>
          </div>
        </motion.div>

        <div className="os-card os-report">
          <div className="os-card-head">
            <h2>Availability workbook</h2>
            <div className="os-card-head-actions">
              <button
                className="os-btn ghost sm os-btn-soon"
                disabled
                title="Coming with the backend — a live workbook in Microsoft Excel Online that every Sales Desk entry flows into automatically."
              >
                Open in Excel
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                <span className="os-soon-tag">Soon</span>
              </button>
              <button className="os-btn ghost sm" onClick={printReport}>
                Print / Save as PDF
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                </svg>
              </button>
              <button className="os-btn primary sm" onClick={exportReport} disabled={exporting}>
                {exporting ? "Building…" : "Export .xlsx"}
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              </button>
            </div>
          </div>
          <div className="os-rob">
            <p className="os-rob-lead">
              Rob&apos;s report is the per-commodity availability workbook — generated
              live, formatted exactly like the Nogales sheets. One tab per commodity,
              with Holdover / Incoming inventory, Starting Inventory, Today&apos;s Orders
              (pulled straight from the Sales Desk), Order Totals, and Today&apos;s
              Available.
            </p>
            <div className="os-rob-tabs">
              {BOARDS.map((b) => (
                <span key={b.id} className="os-rob-tab">
                  {b.name}
                </span>
              ))}
            </div>
            <p className="os-report-note">
              <strong>Print / Save as PDF</strong> produces the sheets exactly as they
              look on paper — landscape, one commodity per page.{" "}
              <strong>Export .xlsx</strong> gives an editable workbook. Both always
              reflect current inventory and every order entered in the Sales Desk.{" "}
              <strong>Open in Excel</strong> <em>(coming with the backend)</em> will be a
              live workbook in Microsoft Excel Online that every Sales Desk entry flows
              into automatically — always current, no manual export.
            </p>
          </div>
          <RobReportPrint orders={orders} />
        </div>
      </main>
    </div>
  );
}
