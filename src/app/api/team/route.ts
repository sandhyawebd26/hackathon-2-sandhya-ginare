import { z } from "zod";

import { syncDemoSessionBundle } from "@/server/auth/session";
import { fail, formatError, ok, readJson } from "@/server/http";
import { resolveVenue } from "@/server/queries";

const bodySchema = z.object({
  venueId: z.string().uuid(),
  name: z.string().trim().min(2).max(80),
  role: z.string().trim().min(2).max(60),
  maxWeeklyHours: z.number().min(4).max(60),
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await readJson(request));
    const { store, venue, account } = await resolveVenue(body.venueId);
    const config = (await store.listRoleConfigs(venue.id)).find((row) => row.role === body.role && row.enabled);
    if (!config) return fail("Choose an active role", 422);
    const member = await store.saveStaff({
      id: crypto.randomUUID(),
      venueId: venue.id,
      name: body.name,
      role: body.role,
      hourlyCost: config.hourlyCost,
      maxWeeklyHours: body.maxWeeklyHours,
      skills: [body.role],
    });
    await syncDemoSessionBundle(store, account, venue);
    return ok(member, "Team member added");
  } catch (error) {
    return fail(formatError(error), 400);
  }
}
