import { z } from "zod";

import { parseEventNote } from "@/server/ai/parse-event";
import { syncDemoSessionBundle } from "@/server/auth/session";
import { fail, formatError, ok, readJson } from "@/server/http";
import { replan } from "@/server/pipeline";
import { resolveVenue } from "@/server/queries";

function optionalNumber(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : undefined;
}

const bodySchema = z.object({
  venueId: z.string().uuid(),
  title: z.string().min(2).max(120).optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  partySize: z.number().int().positive().max(500).optional(),
  impactMultiplier: z.preprocess(optionalNumber, z.number().min(0.5).max(2.5).optional()),
  note: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await readJson(request));
    const { store, venue, account } = await resolveVenue(body.venueId);
    if (venue.id !== body.venueId) return fail("Venue not found", 404);
    const parsed = body.note ? await parseEventNote(body.note, venue.timezone) : null;
    const title = body.title ?? parsed?.title;
    const startsAt = body.startsAt ?? parsed?.startsAt;
    if (!title || !startsAt) return fail("Add a title and a start time, or a note to parse", 422);
    const starts = new Date(startsAt);
    const ends = new Date(body.endsAt ?? parsed?.endsAt ?? new Date(starts.getTime() + 3 * 3_600_000));
    const signal = await store.addSignal({
      id: crypto.randomUUID(),
      venueId: venue.id,
      kind: "event",
      startsAt: starts.toISOString(),
      endsAt: ends.toISOString(),
      label: title,
      impactMultiplier: body.impactMultiplier ?? parsed?.impactMultiplier ?? 1.2,
      payload: { partySize: body.partySize ?? parsed?.partySize ?? "" },
    });
    await replan(store, venue);
    await syncDemoSessionBundle(store, account, venue);
    return ok(signal, "Event added and the floor plan recalculated");
  } catch (error) {
    return fail(formatError(error), 400);
  }
}
