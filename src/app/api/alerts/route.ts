import { fail, ok } from "@/server/http";
import { resolveVenue } from "@/server/queries";

export async function GET(request: Request) {
  try {
    const venueId = new URL(request.url).searchParams.get("venueId") ?? undefined;
    const { store, venue } = await resolveVenue(venueId);
    const alerts = await store.listAlerts(venue.id);
    return ok(alerts);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Could not load alerts", 400);
  }
}
