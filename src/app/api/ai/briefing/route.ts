import { addDays, formatWhen, startOfZonedDay } from "@/lib/time";
import { weeklyBriefing } from "@/server/ai/briefing";
import { fail, ok } from "@/server/http";
import { ensurePipeline } from "@/server/pipeline";
import { loadDashboard, resolveVenue } from "@/server/queries";

export async function GET(request: Request) {
  try {
    const venueId = new URL(request.url).searchParams.get("venueId") ?? undefined;
    const { store, venue } = await resolveVenue(venueId);
    const data = await loadDashboard(venue.id);
    const from = startOfZonedDay(new Date(), venue.timezone);
    const to = addDays(from, 7);
    await ensurePipeline(store, venue, from);
    const signals = (await store.listSignals(venue.id, from.toISOString(), to.toISOString()))
      .slice(0, 15)
      .map((row) => ({
        kind: row.kind,
        label: row.label,
        impactMultiplier: row.impactMultiplier,
        when: formatWhen(row.startsAt, venue.timezone),
      }));
    const briefing = await weeklyBriefing(venue, {
      peak: data.peak,
      under: data.under,
      over: data.over,
      extraCost: data.extraCost,
      currency: venue.currency,
      daily: data.daily,
      alerts: data.alerts,
      signals,
    });
    return ok(briefing);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Could not build the briefing", 400);
  }
}
