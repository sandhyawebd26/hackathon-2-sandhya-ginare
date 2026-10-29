import { z } from "zod";

import { syncDemoSessionBundle, warmDemoSessionFromCookies } from "@/server/auth/session";
import { fail, ok, readJson } from "@/server/http";
import { ensurePipeline } from "@/server/pipeline";
import { resolveVenue } from "@/server/queries";
import { buildWeeklyRoster } from "@/server/roster/assign";

const bodySchema = z.object({ venueId: z.string().uuid() });

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await readJson(request));
    await warmDemoSessionFromCookies();
    const { store, venue, account } = await resolveVenue(body.venueId);
    await ensurePipeline(store, venue);
    const count = await buildWeeklyRoster(store, venue);
    try {
      await syncDemoSessionBundle(store, account, venue);
    } catch (syncError) {
      console.error("syncDemoSessionBundle failed after roster build", syncError);
    }
    return ok({ shifts: count }, "Weekly roster rebuilt");
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Could not build the roster", 400);
  }
}
