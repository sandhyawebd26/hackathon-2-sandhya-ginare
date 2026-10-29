import { addDays, formatWhen, startOfZonedDay } from "@/lib/time";
import { signalsBriefing } from "@/server/ai/briefing";
import { fail, ok } from "@/server/http";
import { resolveVenue } from "@/server/queries";

export async function GET(request: Request) {
  try {
    const venueId = new URL(request.url).searchParams.get("venueId") ?? undefined;
    const { store, venue } = await resolveVenue(venueId);
    const from = startOfZonedDay(new Date(), venue.timezone);
    const signals = (await store.listSignals(venue.id, from.toISOString(), addDays(from, 14).toISOString()))
      .filter((row) => row.kind !== "weather")
      .map((row) => ({
        kind: row.kind,
        label: row.label,
        impactMultiplier: row.impactMultiplier,
        when: formatWhen(row.startsAt, venue.timezone),
      }));
    const briefing = await signalsBriefing(venue, signals);
    return ok(briefing);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Could not summarize signals", 400);
  }
}
