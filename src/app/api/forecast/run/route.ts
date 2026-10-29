import { fail, ok, readJson } from "@/server/http";
import { replan } from "@/server/pipeline";
import { resolveVenue } from "@/server/queries";
import { z } from "zod";

const bodySchema = z.object({ venueId: z.string().uuid() });

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await readJson(request));
    const { store, venue } = await resolveVenue(body.venueId);
    if (venue.id !== body.venueId) return fail("Venue not found", 404);
    await replan(store, venue);
    return ok({ venueId: venue.id }, "Forecast updated");
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Could not run the forecast", 400);
  }
}
