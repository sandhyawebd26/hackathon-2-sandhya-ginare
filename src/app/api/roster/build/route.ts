import { z } from "zod";

import { fail, ok, readJson } from "@/server/http";
import { resolveVenue } from "@/server/queries";
import { buildWeeklyRoster } from "@/server/roster/assign";

const bodySchema = z.object({ venueId: z.string().uuid() });

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await readJson(request));
    const { store, venue } = await resolveVenue(body.venueId);
    const count = await buildWeeklyRoster(store, venue);
    return ok({ shifts: count }, "Weekly roster rebuilt");
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Could not build the roster", 400);
  }
}
