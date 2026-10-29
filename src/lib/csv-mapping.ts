export type ImportKind = "sales" | "reservations";

function norm(header: string) {
  return header.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

const TIMESTAMP_KEYS = [
  "timestamp",
  "date_time",
  "datetime",
  "date",
  "slot_start",
  "slot",
  "booked_at",
  "booking_time",
  "reservation_time",
  "service_time",
  "when",
];

const PARTY_KEYS = ["party_size", "partysize", "party", "guests", "guest_count", "pax", "covers"];

const STATUS_KEYS = ["status", "state", "booking_status"];
const SOURCE_KEYS = ["source", "channel", "origin", "referrer"];

const SALES_COVERS = ["covers", "cover", "guests"];
const SALES_ORDERS = ["orders", "order_count", "ordercount", "tickets"];
const SALES_VALUE = ["value", "amount", "revenue", "total", "order_value"];
const SALES_CHANNEL = ["channel", "type"];

function pick(headers: string[], keys: string[], blocked = new Set<string>()) {
  const normalized = headers.map((h) => ({ raw: h, n: norm(h) }));
  for (const key of keys) {
    const hit = normalized.find((h) => h.n === key && !blocked.has(h.raw));
    if (hit) return hit.raw;
  }
  for (const key of keys) {
    const hit = normalized.find((h) => h.n.includes(key) && !blocked.has(h.raw));
    if (hit) return hit.raw;
  }
  return undefined;
}

/** Guess CSV column mapping from header names (shared by Import UI and tests). */
export function guessCsvMapping(headers: string[], kind: ImportKind): Record<string, string> {
  const party = kind === "reservations" ? pick(headers, PARTY_KEYS) : undefined;
  const blocked = new Set<string>();
  if (party) blocked.add(party);

  const mapping: Record<string, string> = {};
  const timestamp = pick(headers, TIMESTAMP_KEYS, blocked);
  if (timestamp) mapping.timestamp = timestamp;

  if (kind === "sales") {
    const covers = pick(headers, SALES_COVERS, blocked);
    if (covers) mapping.covers = covers;
    const orders = pick(headers, SALES_ORDERS, blocked);
    if (orders) mapping.orders = orders;
    const value = pick(headers, SALES_VALUE, blocked);
    if (value) mapping.value = value;
    const channel = pick(headers, SALES_CHANNEL, blocked);
    if (channel) mapping.channel = channel;
  } else {
    if (party) mapping.partySize = party;
    const status = pick(headers, STATUS_KEYS, blocked);
    if (status) mapping.status = status;
    const source = pick(headers, SOURCE_KEYS, blocked);
    if (source) mapping.source = source;
  }

  return mapping;
}

export function validateImportMapping(kind: ImportKind, mapping: Record<string, string>): string | null {
  if (!mapping.timestamp?.trim()) return "Choose which column holds the date and time (Timestamp).";
  if (kind === "reservations" && !mapping.partySize?.trim()) {
    return "Reservations need a Party size column — do not leave it on Skip.";
  }
  if (mapping.partySize && mapping.timestamp === mapping.partySize) {
    return "Timestamp and Party size cannot be the same column.";
  }
  return null;
}
