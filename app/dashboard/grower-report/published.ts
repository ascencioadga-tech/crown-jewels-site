// Lightweight publish store — La Libreta writes a computed settlement here when
// you "Send to El Rancho"; El Rancho reads it so the grower sees exactly what
// was registered (summary + lot drill-down). localStorage stands in for the
// shared backend until it's wired up.

import type { Grower } from "./data";
import type { Lot } from "./growerLots";

export type Published = { grower: Grower; lots: Lot[]; at: string };

const PREFIX = "cj_pub2_";

export function publish(id: string, data: { grower: Grower; lots: Lot[] }) {
  try {
    localStorage.setItem(PREFIX + id, JSON.stringify({ ...data, at: new Date().toISOString() }));
  } catch {}
}

export function readAllPublished(): Record<string, Published> {
  const out: Record<string, Published> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) {
        const raw = localStorage.getItem(k);
        if (raw) out[k.slice(PREFIX.length)] = JSON.parse(raw);
      }
    }
  } catch {}
  return out;
}
