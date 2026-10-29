import { assertCron, fail, ok } from "@/server/http";
import { replan } from "@/server/pipeline";
import { getSystemStore } from "@/server/store/supabase";

export async function GET(request: Request) {
  const denied = assertCron(request);
  if (denied) return denied;
  try {
    const store = await getSystemStore();
    const venues = await store.listVenues();
    for (const venue of venues) await replan(store, venue);
    return ok({ venues: venues.length });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Nightly forecast failed", 500);
  }
}
