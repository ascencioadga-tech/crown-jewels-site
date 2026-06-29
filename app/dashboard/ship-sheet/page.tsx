"use client";

/* ============================================================
   Crown Jewels — Ship Sheet (grower load declaration)

   Where the whole process starts. Before a truck leaves the
   packhouse in Mexico, the grower declares exactly what's on it
   — once, on his phone, in his language — and it lands at the
   Nogales / Mariposa crossing the moment he hits send.

   Built as the grower's own PHONE APP — modeled 1:1 on Chucho's
   Ship Sheet (status bar, app bar, tabs, hero, AI assist,
   product steppers, truck form, sticky send bar, success screen)
   — rethemed to Crown Jewels (maroon · Fraunces + Geist · CJ
   produce). Bilingual ES / EN. Pure-CSS animation, React state.
   ============================================================ */

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { QRCodeCanvas } from "qrcode.react";
import ProduceGlyph from "../ProduceGlyph";
import { useInboundUploads, loadToQR, type Inbound } from "../inboundUploads";
import "./ship-sheet.css";

/* ---------- Growers (the 3 CJ ranches that ship into Nogales) ---------- */
type Grower = {
  id: string;
  name: string;
  region: string;
  contact: string;
  initials: string;
  phone: string;
  crops: string;
  cropsEs: string;
  cert: string;
  crossing: string;
};

const GROWERS: Grower[] = [
  {
    id: "RT",
    name: "Rancho Thomas",
    region: "Caborca, Sonora · MX",
    contact: "Tomás Bracamonte",
    initials: "TB",
    phone: "+52 637 372 …",
    crops: "Cucumbers · Roma · Bell Peppers",
    cropsEs: "Pepino · Roma · Pimiento",
    cert: "PrimusGFS certified",
    crossing: "Mariposa, Nogales AZ",
  },
  {
    id: "DV",
    name: "Agrícola del Valle",
    region: "Culiacán, Sinaloa · MX",
    contact: "Daniela Verdugo",
    initials: "DV",
    phone: "+52 667 145 …",
    crops: "Roma · Bell Peppers · Green Beans",
    cropsEs: "Roma · Pimiento · Ejote",
    cert: "PrimusGFS certified",
    crossing: "Mariposa, Nogales AZ",
  },
  {
    id: "SL",
    name: "Hortícola San Luis",
    region: "San Luis Río Colorado · MX",
    contact: "Salvador Lugo",
    initials: "SL",
    phone: "+52 653 530 …",
    crops: "Table Grapes · Honeydew · Onions",
    cropsEs: "Uva · Melón · Cebolla",
    cert: "PrimusGFS certified",
    crossing: "Mariposa, Nogales AZ",
  },
];

/* ---------- Packing catalog each grower declares against ----------
   glyph = ProduceGlyph id · cpp = cases per pallet (pallet estimate). */
type CatItem = { glyph: string; name: string; size: string; cpp: number };

const CATALOG: Record<string, CatItem[]> = {
  RT: [
    { glyph: "cucumbers", name: "Cucumbers", size: "Super Select", cpp: 70 },
    { glyph: "cucumbers", name: "Cucumbers", size: "Select", cpp: 70 },
    { glyph: "cucumbers", name: "Cucumbers", size: "36 ct", cpp: 70 },
    { glyph: "tomatoes", name: "Roma Tomatoes", size: "XL · 25# Bulk", cpp: 64 },
    { glyph: "bell-peppers", name: "Bell Peppers", size: "Jumbo · 1⅛ Bu", cpp: 80 },
    { glyph: "bell-peppers", name: "Bell Peppers", size: "XL · 1⅛ Bu", cpp: 80 },
  ],
  DV: [
    { glyph: "tomatoes", name: "Roma Tomatoes", size: "XL · 25# Bulk", cpp: 64 },
    { glyph: "tomatoes", name: "Roma Tomatoes", size: "L · 2-Layer", cpp: 100 },
    { glyph: "bell-peppers", name: "Bell Peppers", size: "XL · 1⅛ Bu", cpp: 80 },
    { glyph: "green-beans", name: "Green Beans", size: "30# Carton", cpp: 90 },
  ],
  SL: [
    { glyph: "table-grapes", name: "Table Grapes", size: "XL 18s", cpp: 56 },
    { glyph: "melons", name: "Honeydew", size: "6 ct", cpp: 40 },
    { glyph: "melons", name: "Honeydew", size: "8 ct", cpp: 40 },
    { glyph: "onions", name: "Onions", size: "50# Sack", cpp: 48 },
  ],
};

/* ---------- Truck ---------- */
type Truck = {
  carrier: string;
  seal: string;
  temp: string;
  driver: string;
  depart: string;
};
const EMPTY_TRUCK: Truck = { carrier: "", seal: "", temp: "", driver: "", depart: "" };

/* ---------- The grower's handwritten packing list (what "scan" reads) ----------
   Each line maps to a catalog index → case count, so scanning the sheet autofills
   the load. Labels are the grower's own Spanish pen-shorthand. */
type ScanLine = { idx: number; label: string; cases: number; lot: string };
type ScanOrder = { lines: ScanLine[]; truck: Truck };
const SCAN_ORDER: Record<string, ScanOrder> = {
  RT: {
    lines: [
      { idx: 0, label: "Pepino Super Sel.", cases: 420, lot: "RT-1042" },
      { idx: 2, label: "Pepino 36", cases: 810, lot: "RT-1043" },
      { idx: 3, label: "Roma XL", cases: 540, lot: "RT-1051" },
      { idx: 4, label: "Pimiento Jumbo", cases: 300, lot: "RT-1062" },
    ],
    truck: { carrier: "CJ-TRK-0440", seal: "SL-88271", temp: "50", driver: "J. Mendoza", depart: "2:30 PM" },
  },
  DV: {
    lines: [
      { idx: 0, label: "Roma XL", cases: 600, lot: "DV-2031" },
      { idx: 1, label: "Roma 2-capas", cases: 320, lot: "DV-2034" },
      { idx: 2, label: "Pimiento XL", cases: 280, lot: "DV-2048" },
      { idx: 3, label: "Ejote 30#", cases: 180, lot: "DV-2055" },
    ],
    truck: { carrier: "CJ-TRK-0517", seal: "SL-90114", temp: "48", driver: "R. Ibarra", depart: "1:15 PM" },
  },
  SL: {
    lines: [
      { idx: 0, label: "Uva XL 18", cases: 540, lot: "SL-3055" },
      { idx: 1, label: "Melón 6", cases: 320, lot: "SL-3061" },
      { idx: 2, label: "Melón 8", cases: 240, lot: "SL-3062" },
      { idx: 3, label: "Cebolla 50#", cases: 200, lot: "SL-3070" },
    ],
    truck: { carrier: "CJ-TRK-0623", seal: "SL-77450", temp: "45", driver: "M. Salas", depart: "3:00 PM" },
  },
};

/* ---------- Prior shipments (History) — blank slate ---------- */
type HistRow = { lot: string; date: string; cases: number; items: string; stage: 1 | 2 | 3 | 4 };
const HISTORY: Record<string, HistRow[]> = { RT: [], DV: [], SL: [] };

/* ---------- bilingual dictionary ---------- */
type Lang = "en" | "es";
const STAGES_T: Record<Lang, [string, string, string, string]> = {
  en: ["Declared", "In transit", "Received", "Settled"],
  es: ["Declarado", "En tránsito", "Recibido", "Liquidado"],
};
const DICT: Record<Lang, Record<string, string>> = {
  en: {
    heroSub: "Build today's shipment",
    stWeek: "this week", stCases: "cases", stLast: "last load", stLastV: "Received", stNone: "No loads yet",
    scan: "Scan sheet", scanS: "packing list", voice: "Say it", voiceS: "by voice",
    products: "Products", truck: "Truck & seal",
    carrier: "Carrier / truck", seal: "Seal", temp: "Reefer temp °F", depart: "Departure", driver: "Driver",
    cases: "cases", line: "line", lines: "lines", pallets: "pallets",
    send: "Send to Nogales", needqty: "Add cases to send",
    tabShip: "Ship", tabHist: "History", tabProfile: "Profile",
    sentH: "Sent to Nogales", sentP: "load is on its way. The Nogales dock will watch it arrive at the crossing and receive it against this lot.",
    rLot: "Lot", rCases: "Cases", rTruck: "Truck", dock: "View at the dock", again: "New shipment",
    qrCap: "Scan this label at the dock", letterBtn: "Shipping letter",
    lotLabel: "Lot", lotPh: "e.g. RT-1042",
    reading: "Reading the packing list…", readingS: "Detecting commodities and case counts",
    listening: "Listening…", listeningS: "is dictating the load",
    histTitle: "shipments", emptyHist: "Nothing yet.",
    pRanch: "Ranch", pContact: "Contact", pCrops: "Crops", pRegion: "Region", pCrossing: "Crossing", pPhone: "Phone",
    loadsWk: "loads / week", casesWk: "cases / week", recentLots: "recent lots",
    cap: "The grower's phone view — declared once, in the field. Toggle ES for Spanish.",
    review: "Packing list read — review the lines and send.",
    reviewVoice: "Dictation captured — review the lines and send.",
  },
  es: {
    heroSub: "Arma tu envío de hoy",
    stWeek: "esta semana", stCases: "cajas", stLast: "último envío", stLastV: "Recibido", stNone: "Sin envíos aún",
    scan: "Escanear", scanS: "hoja de empaque", voice: "Dictar", voiceS: "por voz",
    products: "Productos", truck: "Camión y sello",
    carrier: "Transportista / camión", seal: "Sello", temp: "Temp. reefer °F", depart: "Hora de salida", driver: "Chofer",
    cases: "cajas", line: "línea", lines: "líneas", pallets: "tarimas",
    send: "Enviar a Nogales", needqty: "Agrega cajas para enviar",
    tabShip: "Envío", tabHist: "Historial", tabProfile: "Perfil",
    sentH: "Enviado a Nogales", sentP: "ya va en camino. El muelle de Nogales lo verá llegar al cruce y lo recibirá contra este lote.",
    rLot: "Lote", rCases: "Cajas", rTruck: "Camión", dock: "Ver en el muelle", again: "Nuevo envío",
    qrCap: "Escanea esta etiqueta en el muelle", letterBtn: "Carta de embarque",
    lotLabel: "Lote", lotPh: "ej. RT-1042",
    reading: "Leyendo la hoja de empaque…", readingS: "Detectando productos y número de cajas",
    listening: "Escuchando…", listeningS: "está dictando el envío",
    histTitle: "envíos", emptyHist: "Nada todavía.",
    pRanch: "Rancho", pContact: "Contacto", pCrops: "Cultivos", pRegion: "Región", pCrossing: "Cruce", pPhone: "Teléfono",
    loadsWk: "envíos / sem", casesWk: "cajas / sem", recentLots: "lotes recientes",
    cap: "La vista del teléfono del productor — declarado una vez, en el campo. Cambia a EN para inglés.",
    review: "Hoja leída — revisa las líneas y envía.",
    reviewVoice: "Dictado capturado — revisa las líneas y envía.",
  },
};

/* ---------- icons ---------- */
const IC: Record<string, ReactNode> = {
  bell: <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />,
  pin: <><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></>,
  cam: <><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></>,
  mic: <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />,
  basket: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9l1.412 9.4a2.25 2.25 0 002.226 1.85h12.224a2.25 2.25 0 002.226-1.85L21.75 9M7.5 11.25v5.25M12 11.25v5.25M16.5 11.25v5.25M9 8.25l3-5.25 3 5.25" />,
  truck: <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-6V4.5a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 4.5v12.75" />,
  seal: <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />,
  temp: <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />,
  clock: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />,
  user: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />,
  send: <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />,
  leaf: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />,
  phone: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />,
  check: <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />,
  refresh: <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992V4.356M2.985 19.644v-4.992h4.993M19.235 8.246a8.25 8.25 0 00-14.62-.916M4.766 15.754a8.25 8.25 0 0014.62.916" />,
  doc: <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />,
  tag: <><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></>,
};
const Svg = ({ n, w = 18 }: { n: string; w?: number }) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7" style={{ width: w, height: w }}>
    {IC[n]}
  </svg>
);

/* ---------- helpers ---------- */
const nf = (n: number) => n.toLocaleString("en-US");
function nowClock(): string {
  const d = new Date();
  let h = d.getHours();
  const m = d.getMinutes();
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")}`;
}
function greetWord(lang: Lang): string {
  const h = new Date().getHours();
  if (lang === "es") return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}
const firstName = (full: string) => full.split(" ")[0];

type Tab = "ship" | "history" | "profile";

/* ============================ PAGE ============================ */
export default function ShipSheetPage() {
  const [growerId, setGrowerId] = useState(GROWERS[0].id);
  const [lang, setLang] = useState<Lang>("en");
  const [tab, setTab] = useState<Tab>("ship");

  const [qty, setQty] = useState<Record<number, number>>({});
  const [lotByIdx, setLotByIdx] = useState<Record<number, string>>({});
  const [truck, setTruck] = useState<Truck>(EMPTY_TRUCK);
  const [scanning, setScanning] = useState<null | "scan" | "voice">(null);
  const [submitted, setSubmitted] = useState(false);
  const [sentLot, setSentLot] = useState<string | null>(null);
  const [sentLoad, setSentLoad] = useState<Inbound | null>(null);
  const [showLetter, setShowLetter] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const { addUpload } = useInboundUploads();

  const grower = GROWERS.find((g) => g.id === growerId) || GROWERS[0];
  const catalog = CATALOG[grower.id];
  const t = (k: string) => DICT[lang][k];

  const totalCases = useMemo(() => Object.values(qty).reduce((s, v) => s + (v || 0), 0), [qty]);
  const lineCount = useMemo(() => Object.values(qty).filter((v) => v > 0).length, [qty]);
  const pallets = useMemo(
    () => Object.entries(qty).reduce((s, [i, v]) => s + (v || 0) / (catalog[+i]?.cpp || 64), 0),
    [qty, catalog]
  );

  const switchGrower = (id: string) => {
    setGrowerId(id);
    setQty({});
    setLotByIdx({});
    setTruck(EMPTY_TRUCK);
    setSubmitted(false);
    setSentLot(null);
    setTab("ship");
  };
  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  };
  const bump = (i: number, d: number) => setQty((q) => ({ ...q, [i]: Math.max(0, (q[i] || 0) + d) }));
  const setLine = (i: number, v: number) => setQty((q) => ({ ...q, [i]: Math.max(0, v) }));
  const setLot = (i: number, v: string) => setLotByIdx((m) => ({ ...m, [i]: v }));
  const setTruckField = (f: keyof Truck, v: string) => setTruck((tk) => ({ ...tk, [f]: v }));

  // Scan / voice — reads the grower's handwritten packing list, then OCR-fills
  // the load (quantities + truck). The handwritten sheet shows during the scan.
  const assist = (kind: "scan" | "voice") => {
    setScanning(kind);
    window.setTimeout(
      () => {
        setScanning(null);
        const order = SCAN_ORDER[grower.id];
        if (order) {
          const q: Record<number, number> = {};
          const lm: Record<number, string> = {};
          order.lines.forEach((l) => {
            q[l.idx] = l.cases;
            lm[l.idx] = l.lot;
          });
          setQty(q);
          setLotByIdx(lm);
          setTruck(order.truck);
        }
        flash(kind === "scan" ? t("review") : t("reviewVoice"));
      },
      kind === "scan" ? 2200 : 1500
    );
  };

  const send = () => {
    if (totalCases <= 0) return;
    const rows = HISTORY[grower.id];
    const last = rows.length ? parseInt(rows[0].lot.split("-")[1], 10) : 100;
    const lot = `${grower.id}-${last + 2}`;
    // Per-product lot the farmer entered (scan fills it); falls back to the load lot.
    const lines = catalog
      .map((p, i) => ({
        n: p.name,
        cid: p.glyph,
        sz: p.size,
        lot: (lotByIdx[i] || "").trim() || lot,
        dec: qty[i] || 0,
      }))
      .filter((l) => l.dec > 0);
    // Build the inbound load and push it to the shared store → it shows up
    // in Receiving's 48-hour arrivals window moments later.
    const load: Inbound = {
      id: `IN-${Date.now().toString(36)}`,
      grower: grower.name,
      region: grower.region,
      truck: truck.carrier || "—",
      manifest: `M-${lot}`,
      seal: truck.seal || "—",
      when: "today",
      eta: truck.depart || "Today",
      rel: "En route",
      arrived: false,
      uploaded: "Just now",
      temp: truck.temp ? `${truck.temp}°F` : "—",
      receiver: "",
      door: "",
      lines,
    };
    addUpload(load);
    setSentLoad(load);
    setSentLot(lot);
    setSubmitted(true);
  };
  const reset = () => {
    setQty({});
    setLotByIdx({});
    setTruck(EMPTY_TRUCK);
    setSubmitted(false);
    setSentLot(null);
    setSentLoad(null);
    setShowLetter(false);
    setTab("ship");
  };

  const showActionBar = tab === "ship" && !submitted;

  return (
    <div className="cj-ship">
      <main>
        {/* ---------------- Page head (above the phone) ---------------- */}
        <header className="ship-head">
          <div className="ship-head-copy">
            <div className="eyebrow">
              <span className="rule" />
              <span>Growers · Field declaration</span>
            </div>
            <h1>
              Ship Sheet<span className="accent">.</span>
            </h1>
            <p className="ship-sub">
              Where the whole process starts. Before a truck leaves the packhouse, the grower
              declares exactly what&apos;s on it — once, on his phone, in his language. It lands at the
              Nogales dock the moment he hits send.
            </p>
          </div>
          <div className="ship-switch">
            <span className="ship-switch-label">Grower phone</span>
            <div className="ship-switch-chips">
              {GROWERS.map((g) => (
                <button
                  key={g.id}
                  className={g.id === growerId ? "on" : ""}
                  onClick={() => switchGrower(g.id)}
                  title={g.name}
                >
                  {g.initials}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* ---------------- The phone ---------------- */}
        <div className="ship-stage">
          <div className="ship-phone">
            <div className="ship-screen">
              <span className="ship-island" />

              {/* status bar */}
              <div className="ship-statusbar">
                <span className="clock">{nowClock()}</span>
                <span className="ic">
                  <svg width="17" height="11" viewBox="0 0 18 12"><g fill="#fff"><rect x="0" y="7" width="3" height="5" rx="1" /><rect x="5" y="4.5" width="3" height="7.5" rx="1" /><rect x="10" y="2" width="3" height="10" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" /></g></svg>
                  <svg width="16" height="11" viewBox="0 0 17 12" fill="#fff"><path d="M8.5 2.3c2.6 0 5 1 6.8 2.7l1.3-1.4C14.5 1.5 11.6.3 8.5.3S2.5 1.5.4 3.6l1.3 1.4C3.5 3.3 5.9 2.3 8.5 2.3z" /><circle cx="8.5" cy="10" r="1.7" /></svg>
                  <svg width="25" height="12" viewBox="0 0 27 13"><rect x="1" y="1" width="22" height="11" rx="3" fill="none" stroke="#fff" strokeOpacity=".5" /><rect x="2.5" y="2.5" width="17" height="8" rx="1.5" fill="#fff" /><rect x="24" y="4" width="2" height="5" rx="1" fill="#fff" fillOpacity=".5" /></svg>
                </span>
              </div>

              {/* app bar */}
              <div className="ship-appbar">
                <span className="ship-ab-av">{grower.initials}</span>
                <span className="ship-ab-who">
                  <b>{grower.name}</b>
                  <span>
                    <Svg n="pin" w={11} />
                    {grower.region}
                  </span>
                </span>
                <span className="ship-ab-right">
                  <span className="ship-lang">
                    <button className={lang === "es" ? "on" : ""} onClick={() => setLang("es")}>ES</button>
                    <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>
                  </span>
                  <span className="ship-ab-bell">
                    <Svg n="bell" w={18} />
                    <span className="dot" />
                  </span>
                </span>
              </div>

              {/* scanning overlay */}
              {scanning && (
                <div className="ship-scanning">
                  {scanning === "scan" ? (
                    <div className="ship-scanframe">
                      <ScanSheet grower={grower} order={SCAN_ORDER[grower.id]} />
                      <span className="ship-scanbeam" />
                      <span className="ship-scan-corner tl" />
                      <span className="ship-scan-corner tr" />
                      <span className="ship-scan-corner bl" />
                      <span className="ship-scan-corner br" />
                      <div className="ship-scan-reading">
                        <span className="ship-ring sm" />
                        {t("reading")}
                      </div>
                    </div>
                  ) : (
                    <div className="ship-scanbox">
                      <div className="ship-ring" />
                      <b>{t("listening")}</b>
                      <span>
                        {firstName(grower.contact)} {t("listeningS")}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* body */}
              <div className="ship-body" key={`${grower.id}-${tab}-${submitted}`}>
                {submitted ? (
                  <DoneScreen grower={grower} lang={lang} t={t} lot={sentLot || ""} totalCases={totalCases} lineCount={lineCount} truck={truck} load={sentLoad} onLetter={() => setShowLetter(true)} onAgain={reset} />
                ) : tab === "ship" ? (
                  <ShipBody grower={grower} catalog={catalog} qty={qty} lotByIdx={lotByIdx} truck={truck} lang={lang} t={t} lineCount={lineCount} totalCases={totalCases} onBump={bump} onSetLine={setLine} onLot={setLot} onTruck={setTruckField} onAssist={assist} />
                ) : tab === "history" ? (
                  <HistoryBody grower={grower} lang={lang} t={t} />
                ) : (
                  <ProfileBody grower={grower} lang={lang} t={t} />
                )}
              </div>

              {/* sticky action bar */}
              {showActionBar && (
                <div className="ship-actionbar">
                  <div className="ship-action-tot">
                    <div className="n">{nf(totalCases)}</div>
                    <div className="l">{t("cases")}</div>
                  </div>
                  <button className="ship-send" disabled={totalCases <= 0} onClick={send}>
                    <span>{totalCases > 0 ? t("send") : t("needqty")}</span>
                    <Svg n="send" w={18} />
                  </button>
                </div>
              )}

              {/* tab bar */}
              <div className="ship-tabbar">
                {(
                  [
                    ["ship", "truck", t("tabShip")],
                    ["history", "clock", t("tabHist")],
                    ["profile", "user", t("tabProfile")],
                  ] as [Tab, string, string][]
                ).map(([id, ic, label]) => (
                  <button
                    key={id}
                    className={`ship-tab-b${tab === id ? " on" : ""}`}
                    onClick={() => {
                      setTab(id);
                      if (submitted && id !== "ship") setSubmitted(false);
                    }}
                  >
                    <Svg n={ic} w={23} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="ship-cap">{t("cap")}</p>
      </main>

      {/* toast */}
      {toast && (
        <div className="ship-toast">
          <Svg n="check" w={16} />
          {toast}
        </div>
      )}

      {/* shipping letter */}
      {showLetter && sentLoad && (
        <ShippingLetter
          load={sentLoad}
          grower={grower}
          onClose={() => setShowLetter(false)}
        />
      )}
    </div>
  );
}

/* ============================ HANDWRITTEN PACKING LIST ============================ */
/* The grower's pen-and-paper order — what the "Scan packing list" feature reads. */
function ScanSheet({ grower, order }: { grower: Grower; order: ScanOrder | undefined }) {
  if (!order) return null;
  const today = new Date().toLocaleDateString("es-MX", { day: "numeric", month: "short" });
  return (
    <div className="ship-paper">
      <div className="ship-paper-top">
        <span className="ship-paper-title">Lista de empaque</span>
        <span className="ship-paper-date">{today}</span>
      </div>
      <div className="ship-paper-grower">{grower.name}</div>
      <span className="ship-paper-rule" />
      {order.lines.map((l, i) => (
        <div className="ship-paper-row" key={i}>
          <span className="ship-paper-item">
            {l.label}
            <span className="ship-paper-lot">Lote {l.lot}</span>
          </span>
          <span className="ship-paper-leader" />
          <span className="ship-paper-qty">{l.cases}</span>
        </div>
      ))}
      <span className="ship-paper-rule thin" />
      <div className="ship-paper-truck">
        Camión {order.truck.carrier} · Sello {order.truck.seal} · {order.truck.temp}°F
      </div>
      <div className="ship-paper-sign">— {firstName(grower.contact)}</div>
    </div>
  );
}

/* ============================ SHIP BODY ============================ */
function ShipBody({
  grower,
  catalog,
  qty,
  lotByIdx,
  truck,
  lang,
  t,
  lineCount,
  totalCases,
  onBump,
  onSetLine,
  onLot,
  onTruck,
  onAssist,
}: {
  grower: Grower;
  catalog: CatItem[];
  qty: Record<number, number>;
  lotByIdx: Record<number, string>;
  truck: Truck;
  lang: Lang;
  t: (k: string) => string;
  lineCount: number;
  totalCases: number;
  onBump: (i: number, d: number) => void;
  onSetLine: (i: number, v: number) => void;
  onLot: (i: number, v: string) => void;
  onTruck: (f: keyof Truck, v: string) => void;
  onAssist: (kind: "scan" | "voice") => void;
}) {
  const dateStr = new Date().toLocaleDateString(lang === "es" ? "es-MX" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return (
    <>
      {/* hero */}
      <div className="ship-hero">
        <h2>
          {greetWord(lang)}, {firstName(grower.contact)}
        </h2>
        <div className="ship-hero-dt">{dateStr}</div>
        <div className="ship-hero-stats">
          <div className="ship-hs">
            <div className="n">0</div>
            <div className="l">{t("stWeek")}</div>
          </div>
          <div className="ship-hs">
            <div className="n">0</div>
            <div className="l">{t("stCases")}</div>
          </div>
          <div className="ship-hs">
            <div className="n">—</div>
            <div className="l">{t("stLast")}</div>
          </div>
        </div>
      </div>

      {/* assist */}
      <div className="ship-assist">
        <button onClick={() => onAssist("scan")}>
          <span className="ai">
            <Svg n="cam" w={19} />
          </span>
          <span className="tx">
            {t("scan")}
            <small>{t("scanS")}</small>
          </span>
        </button>
        <button onClick={() => onAssist("voice")}>
          <span className="ai">
            <Svg n="mic" w={19} />
          </span>
          <span className="tx">
            {t("voice")}
            <small>{t("voiceS")}</small>
          </span>
        </button>
      </div>

      {/* products */}
      <div className="ship-sec">
        <span className="si">
          <Svg n="basket" w={15} />
        </span>
        <b>{t("products")}</b>
        <span className="ct">
          {lineCount} · {nf(totalCases)} {t("cases")}
        </span>
      </div>
      {catalog.map((p, i) => {
        const q = qty[i] || 0;
        const pal = q > 0 ? (q / p.cpp).toFixed(1) : "0";
        return (
          <div className={`ship-prod${q > 0 ? " active" : ""}`} key={i}>
            <div className="ship-prod-main">
              <span className="ship-pg">
                <ProduceGlyph id={p.glyph} size={40} />
              </span>
              <span className="ship-pn">
                <b>{p.name}</b>
                <span>{p.size}</span>
                {q > 0 && (
                  <span className="pal">
                    ≈ {pal} {t("pallets")}
                  </span>
                )}
              </span>
              <span className="ship-stepper">
                <button type="button" aria-label="less" onClick={() => onBump(i, -20)} disabled={q <= 0}>
                  −
                </button>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={q || ""}
                  placeholder="0"
                  onChange={(e) => onSetLine(i, parseInt(e.target.value || "0", 10) || 0)}
                />
                <button type="button" aria-label="more" onClick={() => onBump(i, 20)}>
                  +
                </button>
              </span>
            </div>
            <label className={`ship-prod-lot${q > 0 ? " on" : ""}`}>
              <span className="ship-prod-lot-ic">
                <Svg n="tag" w={14} />
              </span>
              <span className="ship-prod-lot-lbl">{t("lotLabel")}</span>
              <input
                value={lotByIdx[i] || ""}
                placeholder={t("lotPh")}
                onChange={(e) => onLot(i, e.target.value)}
              />
            </label>
          </div>
        );
      })}

      {/* truck */}
      <div className="ship-sec">
        <span className="si">
          <Svg n="truck" w={15} />
        </span>
        <b>{t("truck")}</b>
        <span className="ct">{grower.crossing}</span>
      </div>
      <div className="ship-tcard">
        <TruckRow icon="truck" label={t("carrier")} value={truck.carrier} placeholder="CJ-TRK-0000" onChange={(v) => onTruck("carrier", v)} />
        <TruckRow icon="seal" label={t("seal")} value={truck.seal} placeholder="SL-00000" onChange={(v) => onTruck("seal", v)} />
        <TruckRow icon="temp" label={t("temp")} value={truck.temp} placeholder="50" onChange={(v) => onTruck("temp", v)} />
        <TruckRow icon="clock" label={t("depart")} value={truck.depart} placeholder="2:30 PM" onChange={(v) => onTruck("depart", v)} />
        <TruckRow icon="user" label={t("driver")} value={truck.driver} placeholder="—" onChange={(v) => onTruck("driver", v)} />
      </div>
      <div style={{ height: 6 }} />
    </>
  );
}

function TruckRow({
  icon,
  label,
  value,
  placeholder,
  onChange,
}: {
  icon: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="ship-trow">
      <span className="ti">
        <Svg n={icon} w={17} />
      </span>
      <span className="tl">
        <label>{label}</label>
        <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      </span>
    </div>
  );
}

/* ============================ TRACK ============================ */
function Track({ current, lang }: { current: number; lang: Lang }) {
  const stamps = [STAGES_T[lang][0], STAGES_T[lang][2], STAGES_T[lang][3]]; // Declared / Received / Settled
  const n = stamps.length;
  const frac = n > 1 ? current / (n - 1) : 0;
  return (
    <div className="ship-track">
      <div className="ship-track-dots">
        <div className="ship-track-line" />
        <div className="ship-track-fill" style={{ width: `calc((100% - 14px) * ${frac})` }} />
        {stamps.map((_, i) => (
          <span key={i} className={`ship-nd${i < current ? " dn" : i === current ? " cu" : ""}`} />
        ))}
      </div>
      <div className="ship-track-labels">
        {stamps.map((s, i) => (
          <small key={s} className={i <= current ? "on" : ""}>
            {s}
          </small>
        ))}
      </div>
    </div>
  );
}

/* ============================ DONE ============================ */
function DoneScreen({
  grower,
  lang,
  t,
  lot,
  totalCases,
  lineCount,
  truck,
  load,
  onLetter,
  onAgain,
}: {
  grower: Grower;
  lang: Lang;
  t: (k: string) => string;
  lot: string;
  totalCases: number;
  lineCount: number;
  truck: Truck;
  load: Inbound | null;
  onLetter: () => void;
  onAgain: () => void;
}) {
  return (
    <div className="ship-done">
      <div className="ship-done-ck">
        <Svg n="check" w={40} />
      </div>
      <h2>
        {t("sentH")}
        <span className="accent">.</span>
      </h2>
      <p>
        {grower.name}
        {lang === "es" ? " " : "'s "}
        {t("sentP")}
      </p>

      {/* QR — the load's check-in code; the dock scans it */}
      {load && (
        <div className="ship-qr">
          <div className="ship-qr-code">
            <QRCodeCanvas
              value={loadToQR(load)}
              size={132}
              level="M"
              marginSize={2}
              fgColor="#1a0a0c"
              bgColor="#ffffff"
            />
          </div>
          <div className="ship-qr-cap">
            <span className="mono">{lot}</span>
            {t("qrCap")}
          </div>
        </div>
      )}

      <div className="ship-recap">
        <div className="rr">
          <span className="k">{t("rLot")}</span>
          <span className="v mono">{lot}</span>
        </div>
        <div className="rr">
          <span className="k">{t("rCases")}</span>
          <span className="v">
            {nf(totalCases)} {t("cases")} · {lineCount} {lineCount === 1 ? t("line") : t("lines")}
          </span>
        </div>
        <div className="rr">
          <span className="k">{t("rTruck")}</span>
          <span className="v">
            {truck.carrier || "—"} · {truck.seal || "—"}
          </span>
        </div>
      </div>

      <Track current={0} lang={lang} />

      <div className="ship-done-actions">
        <button className="ship-done-btn primary" onClick={onLetter}>
          <Svg n="doc" w={15} /> {t("letterBtn")}
        </button>
        <Link href="/dashboard/receiving" className="ship-done-btn ghost">
          <Svg n="send" w={14} /> {t("dock")}
        </Link>
      </div>
      <button className="ship-done-again" onClick={onAgain}>
        <Svg n="refresh" w={14} /> {t("again")}
      </button>
    </div>
  );
}

/* ============================ SHIPPING LETTER ============================ */
function CrownMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M10 44 L8 22 L21 33 L32 14 L43 33 L56 22 L54 44 Z"
        fill="currentColor"
      />
      <rect x="9" y="47" width="46" height="6" rx="2" fill="currentColor" />
      <circle cx="8" cy="20" r="3.4" fill="currentColor" />
      <circle cx="32" cy="11" r="3.6" fill="currentColor" />
      <circle cx="56" cy="20" r="3.4" fill="currentColor" />
    </svg>
  );
}

function ShippingLetter({
  load,
  grower,
  onClose,
}: {
  load: Inbound;
  grower: Grower;
  onClose: () => void;
}) {
  const lot = load.lines[0]?.lot || "—";
  const total = load.lines.reduce((a, l) => a + l.dec, 0);
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const docNo = `CJ-SL-${(load.manifest || "0000")
    .replace(/[^0-9A-Za-z]/g, "")
    .slice(-6)
    .toUpperCase()
    .padStart(6, "0")}`;
  return (
    <div className="cj-ship-letter-back" onClick={onClose}>
      <div className="cj-ship-letter-wrap" onClick={(e) => e.stopPropagation()}>
        <div className="cj-ship-letter-actions">
          <button className="ship-done-btn ghost" onClick={onClose}>
            Close
          </button>
          <button className="ship-done-btn primary" onClick={() => window.print()}>
            <Svg n="doc" w={14} /> Print / Save PDF
          </button>
        </div>

        <div className="cj-ship-letter">
          <span className="csl-topband" aria-hidden="true" />
          <CrownMark className="csl-watermark" />

          <header className="csl-head">
            <div className="csl-brand">
              <span className="csl-crest">
                <CrownMark className="csl-crest-mark" />
              </span>
              <div className="csl-lockup">
                <span className="csl-eyebrow">Grower-Direct · Nogales, Arizona</span>
                <b>Crown Jewels Produce</b>
                <span className="csl-sub">Shipping Letter · Carta de Embarque</span>
              </div>
            </div>
            <div className="csl-meta">
              <div>
                <span>Document No.</span>
                <b className="mono">{docNo}</b>
              </div>
              <div>
                <span>Lot</span>
                <b className="mono">{lot}</b>
              </div>
              <div>
                <span>Date</span>
                <b>{dateStr}</b>
              </div>
            </div>
          </header>

          <div className="csl-parties">
            <div className="csl-party">
              <span className="csl-label">From · Grower</span>
              <b>{grower.name}</b>
              <p>
                {grower.contact}
                <br />
                {grower.region}
                <br />
                {grower.cert}
              </p>
            </div>
            <div className="csl-party">
              <span className="csl-label">To · Receiving</span>
              <b>Crown Jewels Produce — Receiving</b>
              <p>
                Nogales Cold Dock
                <br />
                {grower.crossing}
                <br />
                Nogales, AZ
              </p>
            </div>
          </div>

          <div className="csl-details">
            <div>
              <span>Manifest</span>
              <b className="mono">{load.manifest}</b>
            </div>
            <div>
              <span>Carrier / truck</span>
              <b>{load.truck}</b>
            </div>
            <div>
              <span>Seal</span>
              <b className="mono">{load.seal}</b>
            </div>
            <div>
              <span>Reefer temp</span>
              <b>{load.temp}</b>
            </div>
            <div>
              <span>Departure</span>
              <b>{load.eta}</b>
            </div>
          </div>

          <table className="csl-table">
            <thead>
              <tr>
                <th>Commodity</th>
                <th>Size / pack</th>
                <th>Lot</th>
                <th className="r">Cases</th>
              </tr>
            </thead>
            <tbody>
              {load.lines.map((l, i) => (
                <tr key={i}>
                  <td>{l.n}</td>
                  <td>{l.sz}</td>
                  <td className="mono">{l.lot}</td>
                  <td className="r">{nf(l.dec)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>Total declared</td>
                <td className="r">
                  {nf(total)} cases · {load.lines.length} lines
                </td>
              </tr>
            </tfoot>
          </table>

          <div className="csl-footrow">
            <div className="csl-qr">
              <QRCodeCanvas
                value={loadToQR(load)}
                size={120}
                level="M"
                marginSize={2}
                fgColor="#1a0a0c"
                bgColor="#ffffff"
              />
              <span>Scan at the Nogales dock to check in this load.</span>
            </div>
            <div className="csl-sign">
              <div className="csl-sign-line">
                <span className="csl-rule" />
                <small>Driver signature · date</small>
              </div>
              <div className="csl-sign-line">
                <span className="csl-rule" />
                <small>Received by · date</small>
              </div>
            </div>
          </div>

          <footer className="csl-foot">
            <span className="csl-foot-mark">
              <CrownMark />
              <b>Crown Jewels Produce</b>
            </span>
            <span className="csl-foot-copy">
              Nogales, Arizona · This letter accompanies the load and is checked
              against what is received at the dock.
            </span>
            <span className="csl-foot-ref mono">{docNo}</span>
          </footer>
        </div>
      </div>
    </div>
  );
}

/* ============================ HISTORY ============================ */
function HistoryBody({ grower, lang, t }: { grower: Grower; lang: Lang; t: (k: string) => string }) {
  const rows = HISTORY[grower.id];
  const stageClass = (s: number) => (s <= 1 ? "s1" : s === 2 ? "s1" : s === 3 ? "s2" : "s3");
  return (
    <>
      <div className="ship-sec" style={{ marginTop: 14 }}>
        <span className="si">
          <Svg n="clock" w={15} />
        </span>
        <b>
          {lang === "es" ? "Tus" : "Your"} {t("histTitle")}
        </b>
        <span className="ct">{rows.length}</span>
      </div>
      {rows.length === 0 && <div className="ship-empty">{t("emptyHist")}</div>}
      {rows.map((h) => (
        <div className="ship-hcard" key={h.lot}>
          <div className="ship-hc-top">
            <span className="ship-hc-lot">{h.lot}</span>
            <span className="ship-hc-cs">
              · {nf(h.cases)} {t("cases")} · {h.date}
            </span>
            <span className={`ship-hc-st ${stageClass(h.stage)}`}>{STAGES_T[lang][h.stage - 1]}</span>
          </div>
          <div className="ship-hc-items">{h.items}</div>
          <Track current={h.stage === 1 ? 0 : h.stage === 2 ? 0 : h.stage === 3 ? 1 : 2} lang={lang} />
        </div>
      ))}
      <div style={{ height: 8 }} />
    </>
  );
}

/* ============================ PROFILE ============================ */
function ProfileBody({ grower, lang, t }: { grower: Grower; lang: Lang; t: (k: string) => string }) {
  const rows: [string, string, string][] = [
    ["truck", t("pRanch"), grower.name],
    ["user", t("pContact"), grower.contact],
    ["basket", t("pCrops"), lang === "es" ? grower.cropsEs : grower.crops],
    ["pin", t("pRegion"), grower.region],
    ["seal", t("pCrossing"), grower.crossing],
    ["phone", t("pPhone"), grower.phone],
  ];
  return (
    <>
      <div className="ship-pcard" style={{ marginTop: 14 }}>
        <div className="ship-pav">{grower.initials}</div>
        <h3>{grower.contact}</h3>
        <div className="ship-pr">
          {grower.name} · {grower.region}
        </div>
        <div className="ship-pcert">
          <Svg n="leaf" w={13} /> {grower.cert}
        </div>
        <div className="ship-pstats">
          <div>
            <span className="n">0</span>
            <span className="l">{t("loadsWk")}</span>
          </div>
          <div>
            <span className="n">0</span>
            <span className="l">{t("casesWk")}</span>
          </div>
          <div>
            <span className="n">{HISTORY[grower.id].length}</span>
            <span className="l">{t("recentLots")}</span>
          </div>
        </div>
      </div>
      <div className="ship-plist">
        {rows.map(([ic, k, v]) => (
          <div className="ship-pli" key={k}>
            <span className="ship-pli-ic">
              <Svg n={ic} w={16} />
            </span>
            {k}
            <span className="ship-pli-v">{v}</span>
          </div>
        ))}
      </div>
      <div style={{ height: 8 }} />
    </>
  );
}
