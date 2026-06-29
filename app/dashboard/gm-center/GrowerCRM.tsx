"use client";

/* ============================================================
   Crown Jewels — Grower Relationship Management

   The relationship side of the grower program: not a finance
   table (those KPIs stay at 0 in the GM Center) but the living
   record of each farmer relationship — who they are, what they
   grow, their food-safety standing, the program & seasons we run
   with them, the state of their contract, the people we talk to,
   our notes, and the relationship timeline. Each card opens into
   a full profile, and from there into the Contract Workspace.

   Seeded with the three canonical CJ growers (Rancho Thomas,
   Agrícola del Valle, Hortícola San Luis). Pure CSS, React state.
   ============================================================ */

import { useState } from "react";
import type { ContractSeed } from "./ContractWorkspace";
import "./grower-crm.css";

/* ---------- contract standing on the relationship record ---------- */
type ContractState = "renewal" | "active" | "draft";

type Contact = { name: string; role: string; line: string };
type Note = { who: string; t: string; x: string };

export type GrowerRecord = {
  id: string;
  name: string;
  initials: string;
  region: string;
  since: string; // relationship start
  primary: Contact;
  contacts: Contact[];
  crops: string[];
  cert: string; // PrimusGFS line
  certUntil: string;
  program: string; // the program/seasons we run
  seasons: string;
  health: "strong" | "steady" | "watch";
  contractState: ContractState;
  contractLabel: string;
  contractMeta: string;
  notes: Note[];
  seed: ContractSeed; // what the Contract Workspace opens with
};

const GROWERS: GrowerRecord[] = [
  {
    id: "RT",
    name: "Rancho Thomas",
    initials: "RT",
    region: "Caborca, Sonora · MX",
    since: "Partner since 2019",
    primary: {
      name: "Tomás Bracamonte",
      role: "Owner / Productor",
      line: "+52 637 372 …",
    },
    contacts: [
      { name: "Tomás Bracamonte", role: "Owner / Productor", line: "+52 637 372 …" },
      { name: "Lupita Bracamonte", role: "Food safety / SQF", line: "Caborca packhouse" },
    ],
    crops: ["Cucumbers", "Roma Tomatoes", "Bell Peppers"],
    cert: "PrimusGFS certified",
    certUntil: "valid through Mar 2027",
    program: "Year-round retail program · grower-direct",
    seasons: "Nov–Jun main season · Mariposa, Nogales AZ",
    health: "strong",
    contractState: "renewal",
    contractLabel: "Renewal — awaiting your signature",
    contractMeta: "Marketing & consignment · 2026 renewal · bilingual",
    notes: [
      {
        who: "Ricardo Duarte",
        t: "Jun 11",
        x: "Walked the 2026–2027 plan with Tomás. He's comfortable with 68,000 cases and the year-round calendar.",
      },
      {
        who: "Marisol Zamora",
        t: "Jun 9",
        x: "Drafted the renewal v2 — cold storage to $0.58/case, commission held at 8%.",
      },
      {
        who: "Alejandro Bours",
        t: "May 30",
        x: "Strong relationship. Cucumber quality has been our most consistent line out of Caborca.",
      },
    ],
    seed: {
      growerName: "Rancho Thomas",
      growerRegion: "Caborca, Sonora · MX",
      growerSigner: "Tomás Bracamonte",
      growerSignerRole: "Owner / Productor · Rancho Thomas",
      growerInitials: "TB",
    },
  },
  {
    id: "DV",
    name: "Agrícola del Valle",
    initials: "AV",
    region: "Culiacán, Sinaloa · MX",
    since: "Partner since 2021",
    primary: {
      name: "Daniela Verdugo",
      role: "Commercial Director",
      line: "+52 667 145 …",
    },
    contacts: [
      { name: "Daniela Verdugo", role: "Commercial Director", line: "+52 667 145 …" },
      { name: "Ing. Omar Payán", role: "Production manager", line: "Culiacán fields" },
    ],
    crops: ["Roma Tomatoes", "Bell Peppers", "Green Beans"],
    cert: "PrimusGFS certified",
    certUntil: "valid through Aug 2026",
    program: "Year-round program · retail + foodservice",
    seasons: "Dec–May main season · Mariposa, Nogales AZ",
    health: "steady",
    contractState: "active",
    contractLabel: "Active — current season",
    contractMeta: "Marketing & consignment · executed Jul 2025",
    notes: [
      {
        who: "Ricardo Duarte",
        t: "Jun 4",
        x: "Daniela flagged stronger Roma volumes for fall. Worth revisiting program allocation in the renewal.",
      },
      {
        who: "Marisol Zamora",
        t: "May 20",
        x: "PrimusGFS renewal due in August — reminder set so it doesn't lapse mid-contract.",
      },
    ],
    seed: {
      growerName: "Agrícola del Valle",
      growerRegion: "Culiacán, Sinaloa · MX",
      growerSigner: "Daniela Verdugo",
      growerSignerRole: "Commercial Director · Agrícola del Valle",
      growerInitials: "DV",
    },
  },
  {
    id: "SL",
    name: "Hortícola San Luis",
    initials: "SL",
    region: "San Luis Río Colorado · MX",
    since: "Partner since 2022",
    primary: {
      name: "Salvador Lugo",
      role: "Owner / Productor",
      line: "+52 653 530 …",
    },
    contacts: [
      { name: "Salvador Lugo", role: "Owner / Productor", line: "+52 653 530 …" },
      { name: "Brenda Lugo", role: "Logistics / crossings", line: "San Luis Río Colorado" },
    ],
    crops: ["Table Grapes", "Honeydew", "Onions"],
    cert: "PrimusGFS certified",
    certUntil: "valid through May 2027",
    program: "Seasonal program · grape & melon relay",
    seasons: "May–Jul grape window · Mariposa, Nogales AZ",
    health: "watch",
    contractState: "draft",
    contractLabel: "Draft — first marketing agreement",
    contractMeta: "Marketing & consignment · in drafting",
    notes: [
      {
        who: "Ricardo Duarte",
        t: "Jun 12",
        x: "Salvador wants to formalize the grape window into a marketing agreement — first real contract with us.",
      },
      {
        who: "Alejandro Bours",
        t: "Jun 2",
        x: "Newer relationship. Onion line is small but the grape window fills a real gap in the calendar.",
      },
    ],
    seed: {
      growerName: "Hortícola San Luis",
      growerRegion: "San Luis Río Colorado · MX",
      growerSigner: "Salvador Lugo",
      growerSignerRole: "Owner / Productor · Hortícola San Luis",
      growerInitials: "SL",
    },
  },
];

export { GROWERS };

const HEALTH: Record<string, { txt: string; cls: string }> = {
  strong: { txt: "Strong", cls: "strong" },
  steady: { txt: "Steady", cls: "steady" },
  watch: { txt: "Watch", cls: "watch" },
};

export default function GrowerCRM({
  onOpenAgreement,
}: {
  /** Open the Contract Workspace for a given grower record. */
  onOpenAgreement: (g: GrowerRecord) => void;
}) {
  const [openId, setOpenId] = useState<string | null>("RT");
  const open = GROWERS.find((g) => g.id === openId) ?? null;

  return (
    <div className="crm">
      <div className="crm-card">
        <div className="crm-card-head">
          <h2>Grower relationships</h2>
          <span className="crm-sub">
            {GROWERS.length} active partners · the farmer relationship, not just a ledger
          </span>
        </div>

        <div className="crm-split">
          {/* ---- list of relationship cards ---- */}
          <div className="crm-list">
            {GROWERS.map((g) => {
              const h = HEALTH[g.health];
              const active = g.id === openId;
              return (
                <button
                  key={g.id}
                  className={`crm-row ${active ? "active" : ""}`}
                  onClick={() => setOpenId(g.id)}
                >
                  <span className="crm-av">{g.initials}</span>
                  <span className="crm-row-tx">
                    <b>{g.name}</b>
                    <span className="crm-row-region">{g.region}</span>
                    <span className="crm-row-crops">{g.crops.join(" · ")}</span>
                  </span>
                  <span className="crm-row-meta">
                    <span className={`crm-health ${h.cls}`}>{h.txt}</span>
                    <span className={`crm-cstate ${g.contractState}`}>
                      <span className="pd" />
                      {g.contractState === "renewal"
                        ? "Renewal"
                        : g.contractState === "active"
                          ? "Active"
                          : "Draft"}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* ---- selected relationship profile ---- */}
          {open && <Profile g={open} onOpenAgreement={onOpenAgreement} />}
        </div>
      </div>
    </div>
  );
}

function Profile({
  g,
  onOpenAgreement,
}: {
  g: GrowerRecord;
  onOpenAgreement: (g: GrowerRecord) => void;
}) {
  const h = HEALTH[g.health];
  return (
    <div className="crm-profile">
      {/* header */}
      <div className="crm-pf-head">
        <span className="crm-pf-av">{g.initials}</span>
        <div className="crm-pf-id">
          <h3>{g.name}</h3>
          <div className="crm-pf-region">{g.region}</div>
          <div className="crm-pf-since">{g.since}</div>
        </div>
        <span className={`crm-health ${h.cls} big`}>{h.txt} relationship</span>
      </div>

      {/* quick facts */}
      <div className="crm-facts">
        <div className="crm-fact">
          <span className="lbl">Crops</span>
          <span className="val">{g.crops.join(" · ")}</span>
        </div>
        <div className="crm-fact">
          <span className="lbl">Food safety</span>
          <span className="val">
            <span className="crm-cert">{g.cert}</span>
            <span className="crm-cert-until"> · {g.certUntil}</span>
          </span>
        </div>
        <div className="crm-fact">
          <span className="lbl">Program</span>
          <span className="val">{g.program}</span>
        </div>
        <div className="crm-fact">
          <span className="lbl">Seasons</span>
          <span className="val">{g.seasons}</span>
        </div>
      </div>

      {/* contract banner + open agreement */}
      <div className={`crm-contract ${g.contractState}`}>
        <div className="crm-contract-tx">
          <span className="crm-contract-lbl">{g.contractLabel}</span>
          <span className="crm-contract-meta">{g.contractMeta}</span>
        </div>
        <button
          className="crm-open-btn"
          onClick={() => onOpenAgreement(g)}
        >
          {g.contractState === "renewal" || g.contractState === "draft"
            ? "Work contract"
            : "Open agreement"}{" "}
          →
        </button>
      </div>

      {/* contacts */}
      <div className="crm-block">
        <div className="crm-block-h">Contacts</div>
        {g.contacts.map((c) => (
          <div className="crm-contact" key={c.name}>
            <span className="crm-c-av">
              {c.name
                .split(" ")
                .slice(0, 2)
                .map((w) => w[0])
                .join("")}
            </span>
            <div className="crm-c-tx">
              <b>{c.name}</b>
              <span>{c.role}</span>
            </div>
            <span className="crm-c-line">{c.line}</span>
          </div>
        ))}
      </div>

      {/* notes / relationship timeline */}
      <div className="crm-block">
        <div className="crm-block-h">Notes &amp; relationship activity</div>
        {g.notes.map((n, i) => (
          <div className="crm-note" key={i}>
            <span className="crm-n-av">
              {n.who
                .split(" ")
                .slice(0, 2)
                .map((w) => w[0])
                .join("")}
            </span>
            <div className="crm-n-tx">
              <div className="crm-n-top">
                <b>{n.who}</b>
                <span className="crm-n-t">{n.t}</span>
              </div>
              <div className="crm-n-x">{n.x}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
