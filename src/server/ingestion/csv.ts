import Papa from "papaparse";
import { z } from "zod";

import type { Reservation, SalesFact, Venue } from "@/lib/domain";
import { parseFlexibleTimestamp } from "@/lib/time";

export const importSchema = z.object({
  venueId: z.string().uuid(),
  kind: z.enum(["sales", "reservations"]),
  filename: z.string().min(1).max(180),
  csv: z.string().min(1).max(2_000_000),
  mapping: z.object({
    timestamp: z.string().min(1),
    covers: z.string().optional(),
    orders: z.string().optional(),
    value: z.string().optional(),
    channel: z.string().optional(),
    partySize: z.string().optional(),
    status: z.string().optional(),
    source: z.string().optional(),
  }),
});

export function csvHeaders(csv: string) {
  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    preview: 1,
    skipEmptyLines: true,
  });
  return parsed.meta.fields?.filter(Boolean) ?? [];
}

export function importRows(venue: Venue, input: z.infer<typeof importSchema>) {
  const parsed = Papa.parse<Record<string, string>>(input.csv, {
    header: true,
    skipEmptyLines: true,
  });
  const errors: string[] = [];
  const sales: SalesFact[] = [];
  const reservations: Reservation[] = [];
  parsed.data.forEach((row, index) => {
    if (index > 5000) return;
    const stamp = parseFlexibleTimestamp(row[input.mapping.timestamp] ?? "", venue.timezone);
    if (!stamp) {
      if (errors.length < 20) errors.push(`Row ${index + 2}: could not read a date`);
      return;
    }
    if (input.kind === "sales") {
      sales.push({
        id: crypto.randomUUID(),
        venueId: venue.id,
        ts: stamp,
        channel: (input.mapping.channel ? row[input.mapping.channel] : "dine-in") || "dine-in",
        covers: numberFrom(row, input.mapping.covers),
        orderCount: numberFrom(row, input.mapping.orders),
        orderValue: numberFrom(row, input.mapping.value),
      });
      return;
    }
    const partySize = numberFrom(row, input.mapping.partySize);
    if (partySize <= 0) {
      if (errors.length < 20) errors.push(`Row ${index + 2}: party size is missing`);
      return;
    }
    reservations.push({
      id: crypto.randomUUID(),
      venueId: venue.id,
      slotStart: stamp,
      partySize,
      status: (input.mapping.status ? row[input.mapping.status] : "confirmed") || "confirmed",
      source: (input.mapping.source ? row[input.mapping.source] : "csv") || "csv",
      createdAt: new Date().toISOString(),
    });
  });
  return { sales, reservations, errors };
}

function numberFrom(row: Record<string, string>, column?: string) {
  if (!column) return 0;
  const value = Number(String(row[column] ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(value) ? value : 0;
}
