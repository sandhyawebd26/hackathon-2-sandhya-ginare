import { fail, ok } from "@/server/http";
import { loadDashboard } from "@/server/queries";

export async function GET(request: Request) {
  try {
    const venueId = new URL(request.url).searchParams.get("venueId") ?? undefined;
    const data = await loadDashboard(venueId);
    return ok({
      venue: data.venue,
      hourly: data.hourly,
      daily: data.daily,
      peak: data.peak,
    });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Forecast failed", 400);
  }
}
