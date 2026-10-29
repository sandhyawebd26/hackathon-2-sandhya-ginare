import { z } from "zod";

import { zonedTimeToUtc } from "@/lib/time";
import { geminiText } from "./gemini";

export const eventSchema = z.object({
  title: z.string().min(2).max(120),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
  partySize: z.number().int().positive().max(500).optional(),
  impactMultiplier: z.number().min(0.5).max(2.5).default(1.2),
});

export type ParsedEvent = z.infer<typeof eventSchema>;

export async function parseEventNote(note: string, timeZone: string, now = new Date()): Promise<ParsedEvent> {
  const prompt = [
    "Extract a hospitality staffing event as JSON.",
    `Timezone: ${timeZone}. Now: ${now.toISOString()}.`,
    "Fields: title, startsAt (ISO-8601 UTC), endsAt (optional ISO-8601 UTC), partySize (optional integer), impactMultiplier (0.5 to 2.5).",
    "If the note has no time, use the next evening at 19:00 local.",
    `Note: ${note.slice(0, 500)}`,
  ].join("\n");
  const raw = await geminiText(prompt, true);
  if (raw) {
    try {
      const parsed = eventSchema.parse(JSON.parse(raw));
      return parsed;
    } catch {
      // Fall through to the manual parser.
    }
  }
  return fallbackParse(note, timeZone, now);
}

function fallbackParse(note: string, timeZone: string, now: Date): ParsedEvent {
  const party = note.match(/(\d{1,3})/);
  const partySize = party ? Number(party[1]) : undefined;
  const hourMatch = note.match(/(\d{1,2})\s*(?::(\d{2}))?\s*(am|pm)?/i);
  let hour = 19;
  if (hourMatch) {
    hour = Number(hourMatch[1]);
    const meridiem = hourMatch[3]?.toLowerCase();
    if (meridiem === "pm" && hour < 12) hour += 12;
    if (meridiem === "am" && hour === 12) hour = 0;
  }
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = Object.fromEntries(formatter.formatToParts(now).map((part) => [part.type, part.value]));
  const start = zonedTimeToUtc(Number(parts.year), Number(parts.month), Number(parts.day), hour, 0, timeZone);
  if (start.getTime() < now.getTime()) start.setTime(start.getTime() + 86_400_000);
  const end = new Date(start.getTime() + 3 * 3_600_000);
  const title = note.trim().slice(0, 120) || "Manager event";
  return eventSchema.parse({
    title,
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
    partySize: partySize && partySize <= 500 ? partySize : undefined,
    impactMultiplier: partySize && partySize >= 40 ? 1.35 : 1.2,
  });
}
