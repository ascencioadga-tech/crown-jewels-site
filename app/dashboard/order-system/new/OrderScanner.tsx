"use client";

import { useEffect, useRef, useState } from "react";
import "./order-scanner.css";

/** Render a PDF's first page to a PNG data URL (so an email/WhatsApp order PDF
    shows as it's scanned). pdf.js is imported lazily, browser-only (its module
    touches DOMMatrix at load, which would break server rendering). Returns null
    if it can't be rendered. */
async function pdfFirstPageDataURL(file: File): Promise<string | null> {
  try {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    return canvas.toDataURL("image/png");
  } catch (e) {
    console.warn("[pdf scan] render failed:", e);
    return null;
  }
}

// What a "read" returns — the parent maps sizes to live board columns + prices.
export type ScanLine = {
  commodityId: string;
  size: string; // human size label, e.g. "LGE", "6's"
  qty: number;
  unitPrice: number;
};
export type ScanResult = {
  customer: string;
  destination: string;
  po: string;
  lines: ScanLine[];
};

// Demo extraction profiles — routed by the uploaded file's name so each demo
// asset "reads" as its own order. In production a vision model returns this same
// shape from the actual photo, and speech-to-text from the voicemail, both
// mapped against the Crown Jewels catalog and the daily price book.
const PROFILES: Record<"photo" | "email" | "whatsapp" | "voice", ScanResult> = {
  // email-order.pdf — Marcus Webb @ Fresh Direct
  email: {
    customer: "Fresh Direct",
    destination: "Compton, CA",
    po: "FD-44981",
    lines: [
      { commodityId: "cucumbers", size: "Super Select", qty: 480, unitPrice: 16.5 },
      { commodityId: "cucumbers", size: "36", qty: 360, unitPrice: 13.0 },
      { commodityId: "tomatoes", size: "XLG", qty: 540, unitPrice: 14.25 },
      { commodityId: "bell-peppers", size: "JBO", qty: 300, unitPrice: 19.5 },
    ],
  },
  // whatsapp-order.pdf — Rosa @ Calixtro Dist.
  whatsapp: {
    customer: "Calixtro Dist.",
    destination: "Nogales, AZ",
    po: "88123",
    lines: [
      { commodityId: "cucumbers", size: "Super Select", qty: 600, unitPrice: 16.5 },
      { commodityId: "cucumbers", size: "36", qty: 420, unitPrice: 13.0 },
      { commodityId: "melons", size: "6's", qty: 320, unitPrice: 9.0 },
      { commodityId: "onions", size: "50#", qty: 200, unitPrice: 11.0 },
    ],
  },
  photo: {
    customer: "Calixtro Dist.",
    destination: "Nogales, AZ",
    po: "158762",
    lines: [
      { commodityId: "cucumbers", size: "LGE", qty: 1620, unitPrice: 16.5 },
      { commodityId: "melons", size: "6's", qty: 540, unitPrice: 9.0 },
      { commodityId: "tomatoes", size: "XLG", qty: 320, unitPrice: 14.25 },
    ],
  },
  voice: {
    customer: "US Foods — Phoenix",
    destination: "Phoenix, AZ",
    po: "USF-77310",
    lines: [
      { commodityId: "tomatoes", size: "LGE", qty: 200, unitPrice: 13.5 },
      { commodityId: "cucumbers", size: "SEL", qty: 150, unitPrice: 15.0 },
      { commodityId: "bell-peppers", size: "JBO", qty: 100, unitPrice: 20.0 },
    ],
  },
};

const VOICE_TRANSCRIPT =
  "“Hey Alejandro, it’s Mike over at US Foods Phoenix. For Monday’s truck, set us up with two hundred cartons of large roma tomatoes, one-fifty select cucumbers, and a hundred jumbo green bell peppers. PO is U-S-F seven-seven-three-one-zero. Price off today’s sheet — thanks!”";

const SCAN_STEPS = [
  "Reading the photo",
  "Detecting customer & P.O.",
  "Matching products to the catalog",
  "Pricing from today’s book",
  "Building the order",
];
const VOICE_STEPS = [
  "Transcribing the audio",
  "Detecting customer & P.O.",
  "Matching products to the catalog",
  "Pricing from today’s book",
  "Building the order",
];

type StepState = "idle" | "doing" | "done";

export default function OrderScanner({ onExtract }: { onExtract: (r: ScanResult) => void }) {
  const [stage, setStage] = useState<"entry" | "scan">("entry");
  const [recording, setRecording] = useState(false);
  const [recTime, setRecTime] = useState("0:00");
  const [bars, setBars] = useState<number[]>(Array(16).fill(14));
  const [thumb, setThumb] = useState<string | null>(null); // photo/pdf image URL, else null
  const [docName, setDocName] = useState<string | null>(null); // pdf/doc tile name (no image yet)
  const [steps, setSteps] = useState<string[]>(SCAN_STEPS);
  const [stepStates, setStepStates] = useState<StepState[]>([]);
  const [stepsDone, setStepsDone] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [transcriptTx, setTranscriptTx] = useState("");
  const [drag, setDrag] = useState(false);
  const [doneResult, setDoneResult] = useState<ScanResult | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const recRef = useRef<{ stream?: MediaStream; ctx?: AudioContext; timer?: ReturnType<typeof setInterval>; raf?: number }>({});

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(
    () => () => {
      clearTimers();
      stopMic();
    },
    []
  );

  // ---- animated step runner ----
  const runSteps = (theSteps: string[], done: () => void) => {
    setSteps(theSteps);
    setStepsDone(false);
    setStepStates(theSteps.map(() => "idle"));
    const STEP = 620;
    theSteps.forEach((_, i) => {
      timers.current.push(setTimeout(() => setStepStates((s) => s.map((v, j) => (j === i ? "doing" : v))), i * STEP));
      timers.current.push(
        setTimeout(() => setStepStates((s) => s.map((v, j) => (j === i ? "done" : v))), i * STEP + STEP - 40)
      );
    });
    timers.current.push(setTimeout(done, theSteps.length * STEP + 250));
  };

  // ---- photo path ----
  const startScan = (file: File) => {
    setTranscript(null);
    setStage("scan");
    const name = file.name.toLowerCase();
    // Route the demo asset → its order. WhatsApp screenshots, email PDFs, else photo.
    const key: keyof typeof PROFILES = /whats|chat|sms/.test(name)
      ? "whatsapp"
      : /email|mail|gmail|\.eml|inbox/.test(name)
      ? "email"
      : "photo";
    // Preview: images show directly; PDFs render their first page (else a doc tile).
    if (file.type.startsWith("image/")) {
      setThumb(URL.createObjectURL(file));
      setDocName(null);
    } else {
      setThumb(null);
      setDocName(file.name);
      pdfFirstPageDataURL(file).then((url) => {
        if (url) setThumb(url);
      });
    }
    runSteps(SCAN_STEPS, () => {
      setStepsDone(true);
      finish(PROFILES[key]);
    });
  };

  // ---- voice path ----
  const typeTranscript = (text: string) => {
    setTranscript(text);
    setTranscriptTx("");
    let i = 0;
    const tick = () => {
      if (i <= text.length) {
        setTranscriptTx(text.slice(0, i));
        i += 3;
        timers.current.push(setTimeout(tick, 26));
      }
    };
    tick();
  };
  const processVoice = () => {
    setThumb(null); // audio tile
    setStage("scan");
    timers.current.push(setTimeout(() => typeTranscript(VOICE_TRANSCRIPT), 700));
    runSteps(VOICE_STEPS, () => {
      setStepsDone(true);
      finish(PROFILES.voice);
    });
  };

  const finish = (r: ScanResult) => {
    setDoneResult(r);
    onExtract(r);
  };

  // ---- mic recording (falls back to demo voicemail if blocked) ----
  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const src = ctx.createMediaStreamSource(stream);
      const an = ctx.createAnalyser();
      an.fftSize = 64;
      src.connect(an);
      recRef.current = { stream, ctx };
      setRecording(true);
      const t0 = Date.now();
      recRef.current.timer = setInterval(() => {
        const s = Math.floor((Date.now() - t0) / 1000);
        setRecTime(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`);
        if (s >= 20) stopRec();
      }, 250);
      const data = new Uint8Array(an.frequencyBinCount);
      const loop = () => {
        recRef.current.raf = requestAnimationFrame(loop);
        an.getByteFrequencyData(data);
        setBars(Array.from({ length: 16 }, (_, i) => Math.max(12, ((data[i * 2] || 0) / 255) * 100)));
      };
      loop();
    } catch {
      // Mic unavailable (e.g. preview iframe) — run the demo voicemail.
      processVoice();
    }
  };
  const stopMic = () => {
    const r = recRef.current;
    if (r.timer) clearInterval(r.timer);
    if (r.raf) cancelAnimationFrame(r.raf);
    if (r.stream) r.stream.getTracks().forEach((t) => t.stop());
    if (r.ctx) r.ctx.close();
    recRef.current = {};
  };
  const stopRec = () => {
    stopMic();
    setRecording(false);
    processVoice();
  };

  const reset = () => {
    clearTimers();
    stopMic();
    setRecording(false);
    setStage("entry");
    setStepStates([]);
    setStepsDone(false);
    setTranscript(null);
    setTranscriptTx("");
    setThumb(null);
    setDocName(null);
    setDoneResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="scan-card">
      <div className="scan-head">
        <h2>Generate from a photo or voice</h2>
        <span className="ai-badge">AI Scan</span>
      </div>
      <p className="scan-sub">
        Take a photo of the customer&apos;s P.O., email, or WhatsApp message — or upload it, or record by voice.
        Crown Jewels reads it and builds the order below.
      </p>

      {stage === "entry" && (
        <>
          <div
            className={`dropzone${drag ? " drag" : ""}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragEnter={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={(e) => { e.preventDefault(); setDrag(false); }}
            onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) startScan(f); }}
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
            <span>Drop a photo, email or WhatsApp order (image or PDF), or <b>&nbsp;click to upload</b></span>
            <input ref={fileRef} type="file" accept="image/*,application/pdf,.pdf" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) startScan(f); }} />
          </div>
          {/* camera input — opens the rear camera on phones to photograph the order */}
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) startScan(f); }} />

          {!recording ? (
            <>
              <div className="scan-or"><span />or<span /></div>
              <div className="audio-row">
                <button type="button" className="rec-btn" onClick={() => cameraRef.current?.click()}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                  Take a photo
                </button>
                <button type="button" className="rec-btn" onClick={startRec}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </svg>
                  Record the order
                </button>
              </div>
            </>
          ) : (
            <div className="rec-live on">
              <span className="rec-dot" />
              <span className="rec-time">{recTime}</span>
              <div className="rec-bars">
                {bars.map((h, i) => (
                  <span key={i} style={{ height: `${h}%` }} />
                ))}
              </div>
              <button type="button" className="rec-stop" onClick={stopRec}>Stop</button>
            </div>
          )}
        </>
      )}

      {stage === "scan" && (
        <div className="scan-stage on">
          {thumb ? (
            <div className={`scan-thumb${stepsDone ? " done" : ""}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumb} alt="Order document" />
              {!stepsDone && <div className="scan-beam" />}
            </div>
          ) : docName ? (
            <div className={`scan-thumb scan-doc${stepsDone ? " done" : ""}`}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 9l2.25 2.25L15 12.75m-3-7.5H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <span className="scan-doc-name">{docName}</span>
              {!stepsDone && <div className="scan-beam" />}
            </div>
          ) : (
            <div className="audio-tile on">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
              <div className="aw">
                {Array.from({ length: 12 }, (_, i) => (
                  <span key={i} />
                ))}
              </div>
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div className="scan-steps">
              {stepStates.map((st, i) => (
                <div key={i} className={`scan-step ${st}`}>
                  <span className="si">{st === "done" ? "✓" : ""}</span>
                  {steps[i]}
                </div>
              ))}
            </div>
            {transcript && (
              <div className="transcript on">
                <b>Transcript</b>
                <span>{transcriptTx}</span>
              </div>
            )}
            {stepsDone && doneResult && (
              <div className="scan-result">
                ✓ Order built below — <b>{doneResult.customer}</b>
                {`, ${doneResult.lines.length} ${doneResult.lines.length === 1 ? "line" : "lines"} extracted. Review & save.`}
              </div>
            )}
            <button type="button" className="scan-reset" onClick={reset}>↺ Scan another order</button>
          </div>
        </div>
      )}

      <p className="scan-note">
        Demo extraction — in production the photo goes to a vision model and the audio to speech-to-text,
        both mapped against your catalog and price book.
      </p>
    </div>
  );
}
