import { syncWeather } from "@/server/features/signals";
import { assertCron, fail, ok } from "@/server/http";
import { addDays, startOfZonedDay } from "@/lib/time";
import { getSystemStore } from "@/server/store/supabase";

export async function GET(request: Request) {
  const denied = assertCron(request);
  if (denied) return denied;
  try {
    const store = await getSystemStore();
    const venues = await store.listVenues();
    for (const venue of venues) {
      const from = startOfZonedDay(new Date(), venue.timezone);
      await syncWeather(store, venue, from, addDays(from, 7));
    }
    return ok({ venues: venues.length });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Weather sync failed", 500);
  }
}
