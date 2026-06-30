"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CURRENT_USER } from "../user";
import "./messages.css";

/* ---- people (current Crown Jewels roster) ---- */
type Person = { n: string; c: string; bot?: boolean };
const PEOPLE: Record<string, Person> = {
  al: { n: "Alejandro Bours", c: "#7a1f2b" },
  ca: { n: "Carlos Encinas", c: "#a8404e" },
  rb: { n: "Robbie Mathias", c: "#6a5577" },
  sa: { n: "Santiago Martinez", c: "#3f5d6b" },
  ro: { n: "Rosa Delgado", c: "#4f5e36" },
  bot: { n: "Crown Bot", c: "#511319", bot: true },
};
const ME = "al";
const ini = (n: string) => n.split(" ").map((w) => w[0]).join("").slice(0, 2);

/* ---- conversations: channels + DMs ---- */
type ChatMsg = { p: string; t: string; x: string; reacts?: [string, number][] };
type Convo = {
  type: "ch" | "dm";
  name?: string;
  topic?: string;
  members?: number;
  who?: string;
  on?: boolean;
  unread?: number;
  msgs: ChatMsg[];
};

const SEED: Record<string, Convo> = {
  "sales-desk": {
    type: "ch", name: "sales-desk", topic: "Daily book, availability & orders", members: 5,
    msgs: [
      { p: "bot", t: "6:55 AM", x: "Inbound truck CJ-TRK-0612 confirmed for tomorrow — +900 cs table grapes, +540 cs cucumbers, +320 cs honeydew." },
      { p: "ca", t: "8:02 AM", x: "Heads up — Calixtro wants to bump cucumbers 36s to 2,000 cs next week. Do we have room after the inbound?" },
      { p: "sa", t: "8:06 AM", x: "Board shows 1,450 available after commitments. With tomorrow's truck we clear it comfortably." },
      { p: "bot", t: "8:35 AM", x: "New order 348315 — Calixtro Dist., $20,979 (Alejandro). Availability updated.", reacts: [["✓ nice", 3]] },
      { p: "rb", t: "9:01 AM", x: "@Alejandro the Fresh Direct PO came in — N44974, one line of large cukes. Confirmed back already." },
      { p: "al", t: "9:04 AM", x: "Good. Keep honeydew 6s above 300 cs for Calixtro's standing order — don't let the board run dry before Friday." },
      { p: "ca", t: "9:12 AM", x: "Second PO of the week from Fresh Direct just hit the inbox. Entering it on the Sales Desk now.", reacts: [["🍈 2", 2]] },
    ],
  },
  pricing: {
    type: "ch", name: "pricing", topic: "Daily quote & market moves", members: 4, unread: 3,
    msgs: [
      { p: "bot", t: "6:30 AM", x: "Daily quote sheet sent to 32 customer contacts." },
      { p: "sa", t: "7:42 AM", x: "Market firming on table grapes — two Fresno houses quoting $28 on XLG 18s. We're at $26." },
      { p: "rb", t: "7:48 AM", x: "Hold $26 through Wednesday, then revisit. Volume matters more than the last dollar this week." },
      { p: "sa", t: "7:50 AM", x: "Agreed. Flagging it on tomorrow's sheet." },
    ],
  },
  logistics: {
    type: "ch", name: "logistics", topic: "Trucks, cold-chain & crossings", members: 5,
    msgs: [
      { p: "sa", t: "7:15 AM", x: "CJ-TRK-0612 crossed at Mariposa 6:30 AM, dock ETA 11:00. Pulp temps 48–50°F at inspection." },
      { p: "bot", t: "7:16 AM", x: "Crossing logged — manifest matched to inbound lots RT-114, ROBLE M-7811." },
      { p: "ca", t: "8:00 AM", x: "Calixtro wants Monday 6 AM delivery window on 348304 — confirmed with their receiver." },
    ],
  },
  growers: {
    type: "ch", name: "growers", topic: "Settlements, lots & field notes", members: 4, unread: 2,
    msgs: [
      { p: "bot", t: "Yesterday", x: "Settlement published to the Growers Portal — Rancho Thomas, season 2026: gross $660,236 across 95 lots." },
      { p: "ro", t: "Yesterday", x: "Agrícola del Valle's advance cleared. Their balance shows on the settlement register." },
      { p: "al", t: "Yesterday", x: "Hortícola San Luis wants their statement before Thursday's call — Rosa, can we publish from the Settlement Sheet today?" },
      { p: "ro", t: "8:50 AM", x: "Registered and published this morning. They can see the full lot detail in their portal now." },
    ],
  },
  accounting: {
    type: "ch", name: "accounting", topic: "AR, collections & invoices", members: 3, unread: 1,
    msgs: [
      { p: "ro", t: "Yesterday", x: "Calixtro is past terms on the May blue sheets — second notice goes out this morning, then I'm calling their AP desk." },
      { p: "bot", t: "8:18 AM", x: "Payment received — Fresh Direct, $963.90 check against INV-2026-5001. Invoice closed." },
      { p: "ro", t: "8:20 AM", x: "That clears their book. Calixtro is the only open balance left." },
    ],
  },
  general: {
    type: "ch", name: "general", topic: "Company-wide", members: 9,
    msgs: [
      { p: "al", t: "Monday", x: "Strong week — the grape program is fully booked through Friday and the new workspace is live for everyone. Use it, break it, tell me what's missing." },
      { p: "ca", t: "Monday", x: "The availability board alone is saving me an hour a day.", reacts: [["✓ 4", 4]] },
      { p: "rb", t: "Tuesday", x: "Same — no more radio calls to the warehouse to check counts." },
    ],
  },
  "dm-ca": {
    type: "dm", who: "ca", on: true,
    msgs: [
      { p: "ca", t: "8:31 AM", x: "Do we have a floor on grapes for Calixtro? They're pushing for $24 on the XLG 18s." },
      { p: "al", t: "8:34 AM", x: "$25 is the floor while the market's firming. If they commit 800+ cs weekly we can talk." },
      { p: "ca", t: "8:35 AM", x: "Perfect — taking that back to them." },
    ],
  },
  "dm-ro": {
    type: "dm", who: "ro", on: true, unread: 1,
    msgs: [
      { p: "ro", t: "9:18 AM", x: "AR snapshot for your 10 AM: $50,488 invoiced this week, one balance open (Calixtro). Grower net is current across all three settlements." },
    ],
  },
  "dm-rb": {
    type: "dm", who: "rb", on: false,
    msgs: [
      { p: "rb", t: "Friday", x: "Calixtro's receiver flagged two short pallets on the last honeydew load — credited and rebilled, all square." },
    ],
  },
};

const SECTIONS: { label: string; items: string[] }[] = [
  { label: "Sales", items: ["sales-desk", "pricing"] },
  { label: "Operations", items: ["logistics", "growers"] },
  { label: "Finance", items: ["accounting"] },
  { label: "Company", items: ["general"] },
];
const DMS = ["dm-ca", "dm-ro", "dm-rb"];

/* canned one-shot replies for DMs after you send */
const REPLIES: Record<string, string> = {
  "dm-ca": "On it — I'll have their answer before lunch.",
  "dm-ro": "Noted — I'll bring the full register printout to the 10 AM.",
  "dm-rb": "Copy. I'll confirm with the carrier this afternoon.",
};

const nowTime = () => new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

/* Render @mentions highlighted; everything else as plain text. */
function MsgText({ text }: { text: string }) {
  const parts = text.split(/(@[\w][\w ]*?)(?=\b)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("@") ? (
          <span className="mention" key={i}>{p}</span>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

export default function MessagesPage() {
  const [convos, setConvos] = useState<Record<string, Convo>>(() => JSON.parse(JSON.stringify(SEED)));
  const [current, setCurrent] = useState("sales-desk");
  const [input, setInput] = useState("");
  const [typingWho, setTypingWho] = useState<string | null>(null);
  // Phone master→detail: "list" shows the conversation list, "convo" the
  // open thread. Only consulted in the standalone /chat phone layout (CSS
  // gates it to .standalone @ ≤760px); the dashboard two-pane ignores it.
  const [mobileView, setMobileView] = useState<"list" | "convo">("list");
  const repliedRef = useRef<Record<string, boolean>>({});
  const streamRef = useRef<HTMLDivElement>(null);

  // Standalone public route (/chat) renders as a REAL full-screen phone chat
  // app on phones; /dashboard/messages keeps the desktop two-pane workspace.
  const pathname = usePathname();
  const standalone = (pathname || "").replace(/\/+$/, "") === "/chat";

  const c = convos[current];

  useEffect(() => {
    const el = streamRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [current, convos, typingWho, mobileView]);

  const open = (id: string) => {
    setCurrent(id);
    setConvos((m) => ({ ...m, [id]: { ...m[id], unread: 0 } }));
    setMobileView("convo"); // phone: tapping a conversation opens the thread
  };

  const send = () => {
    const x = input.trim();
    if (!x) return;
    setInput("");
    const id = current;
    setConvos((m) => ({
      ...m,
      [id]: { ...m[id], msgs: [...m[id].msgs, { p: ME, t: nowTime(), x }] },
    }));
    const convo = convos[id];
    if (convo.type === "dm" && !repliedRef.current[id]) {
      repliedRef.current[id] = true;
      const p = PEOPLE[convo.who!];
      setTimeout(() => setTypingWho(p.n), 700);
      setTimeout(() => {
        setTypingWho(null);
        setConvos((m) => ({
          ...m,
          [id]: {
            ...m[id],
            msgs: [...m[id].msgs, { p: convo.who!, t: nowTime(), x: REPLIES[id] || "Got it — thanks Alejandro." }],
          },
        }));
      }, 2400);
    }
  };

  return (
    <div className={`cj-msg${standalone ? " standalone" : ""}`} data-mview={standalone ? mobileView : undefined}>
      {/* Phone app bar — only the standalone /chat route, only on phones (CSS).
          List view: workspace name + back-to-/apps. Convo view: back-to-list
          chevron + the active conversation's title. */}
      {standalone && (
        <div className="msg-appbar">
          {mobileView === "list" ? (
            <>
              <Link href="/apps" className="msg-back" aria-label="Back to apps">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" style={{ width: 18, height: 18 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </Link>
              <span className="msg-ab-title">
                <b>Crown <span className="cj-j cj-joya">Jewels</span></b>
                <span className="sub">Workspace chat</span>
              </span>
            </>
          ) : (
            <>
              <button type="button" className="msg-back" aria-label="Back to conversations" onClick={() => setMobileView("list")}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" style={{ width: 18, height: 18 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <span className="msg-ab-title">
                <b>{c.type === "ch" ? `# ${c.name}` : PEOPLE[c.who!].n}</b>
                <span className="sub">
                  {c.type === "ch" ? c.topic : c.on ? "Active now" : "Away"}
                </span>
              </span>
            </>
          )}
        </div>
      )}
      <main>
        <div className="chat-card">
          <aside className="ch-rail">
            <div className="ch-workspace">
              <div className="ch-ws-name">
                <b>Crown <span className="cj-j cj-joya">Jewels</span></b>
                <span className="me">
                  <span className="on" />
                  {CURRENT_USER.name}
                </span>
              </div>
              <button type="button" className="ch-compose" aria-label="New message">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                </svg>
              </button>
            </div>
            <nav className="ch-nav">
              {SECTIONS.map((sec) => (
                <div key={sec.label}>
                  <div className="ch-sec">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                    {sec.label}
                  </div>
                  {sec.items.map((id) => {
                    const ch = convos[id];
                    const cls = `ch-item${id === current ? " active" : ch.unread ? " unread" : ""}`;
                    return (
                      <button key={id} type="button" className={cls} onClick={() => open(id)}>
                        <span className="hash">#</span>
                        <span className="nm">{ch.name}</span>
                        {!!ch.unread && id !== current && <span className="unread-badge">{ch.unread}</span>}
                      </button>
                    );
                  })}
                </div>
              ))}
              <div className="ch-sec">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
                Direct messages
              </div>
              {DMS.map((id) => {
                const dm = convos[id];
                const p = PEOPLE[dm.who!];
                const cls = `ch-item${id === current ? " active" : dm.unread ? " unread" : ""}`;
                return (
                  <button key={id} type="button" className={cls} onClick={() => open(id)}>
                    <span className={`pres ${dm.on ? "on" : "off"}`} />
                    <span className="nm">{p.n}</span>
                    {!!dm.unread && id !== current && <span className="unread-badge">{dm.unread}</span>}
                  </button>
                );
              })}
            </nav>
          </aside>

          <section className="ch-main">
            <div className="ch-head">
              {c.type === "ch" ? (
                <>
                  <span className="ch-title">
                    <span className="h">#</span>
                    {c.name}
                  </span>
                  <button type="button" className="ch-star" aria-label="Star">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                  </button>
                  <span className="topic">{c.topic}</span>
                  <div className="head-actions">
                    <button type="button" className="ha-btn">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                      </svg>
                      {c.members}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="ch-title">{PEOPLE[c.who!].n}</span>
                  <span className="ha-pres" style={{ background: c.on ? "#4f5e36" : "#c4c6cb" }} />
                  <span className="topic">{c.on ? "Active now" : "Away"}</span>
                </>
              )}
            </div>

            <div className="ch-stream" ref={streamRef}>
              <div className="day-div">
                <span className="l" />
                <span className="c">Today</span>
                <span className="l" />
              </div>
              {c.msgs.map((m, i) => {
                const p = PEOPLE[m.p];
                // Slack-style grouping: consecutive messages from the same
                // author collapse — only the first shows avatar + name + time.
                const head = i === 0 || c.msgs[i - 1].p !== m.p;
                return (
                  <div className={`msg-row${head ? " head" : ""}`} key={i}>
                    {head ? (
                      <span className="msg-av" style={{ background: p.c }}>{ini(p.n)}</span>
                    ) : (
                      <span className="msg-gutter">{m.t.replace(/\s?[AP]M$/, "")}</span>
                    )}
                    <div className="msg-body">
                      {head && (
                        <div className="msg-top">
                          <b>{p.n}</b>
                          {p.bot && <span className="bot-tag">App</span>}
                          <span className="t">{m.t}</span>
                        </div>
                      )}
                      <div className="msg-tx"><MsgText text={m.x} /></div>
                      {m.reacts && (
                        <div className="reacts">
                          {m.reacts.map(([l], j) => (
                            <span className="react" key={j}>{l}</span>
                          ))}
                          <span className="react-add" aria-label="Add reaction">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                            </svg>
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="msg-actions">
                      <button type="button" aria-label="React">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm5.25 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75z" />
                        </svg>
                      </button>
                      <button type="button" aria-label="Reply in thread">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                        </svg>
                      </button>
                      <button type="button" aria-label="Share">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                        </svg>
                      </button>
                      <button type="button" aria-label="More">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {typingWho && (
              <div className="typing">
                <div className="dots"><span /><span /><span /></div>
                <span>{typingWho} is typing…</span>
              </div>
            )}

            <div className="composer-wrap">
              <div className="composer">
                <div className="composer-toolbar">
                  <button type="button" className="ctb" title="Bold">B</button>
                  <button type="button" className="ctb" title="Italic" style={{ fontStyle: "italic", fontWeight: 500 }}>i</button>
                  <button type="button" className="ctb" title="Strikethrough" style={{ textDecoration: "line-through", fontWeight: 500 }}>S</button>
                  <span className="ctb-div" />
                  <button type="button" className="ctb" title="Link">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                    </svg>
                  </button>
                  <button type="button" className="ctb" title="Ordered list">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.242 5.992h12m-12 6.003H20.24m-12 5.999h12M4.117 7.495v-3.75H2.99m1.125 3.75H2.99m1.125 0H5.24m-1.92 7.5h1.876c.621 0 1.125.504 1.125 1.125v.375a1.125 1.125 0 01-1.125 1.125H3.32m1.876-3.75H3.32m1.876 0a1.125 1.125 0 011.125 1.125M3.32 19.495h2.626" />
                    </svg>
                  </button>
                  <button type="button" className="ctb" title="Bulleted list">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  </button>
                  <span className="ctb-div" />
                  <button type="button" className="ctb" title="Code">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                    </svg>
                  </button>
                </div>
                <textarea
                  rows={1}
                  placeholder={c.type === "ch" ? `Message #${c.name}` : `Message ${PEOPLE[c.who!].n}`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                />
                <div className="composer-bottom">
                  <div className="cb-left">
                    <button type="button" className="cb-icon" title="Attach">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    <button type="button" className="cb-icon" title="Emoji">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm5.25 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75z" />
                      </svg>
                    </button>
                    <button type="button" className="cb-icon" title="Mention">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 10-2.636 6.364M16.5 12V8.25" />
                      </svg>
                    </button>
                  </div>
                  <button
                    className={`cb-send${input.trim() ? " ready" : ""}`}
                    onClick={send}
                    disabled={!input.trim()}
                    aria-label="Send"
                  >
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.9">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
