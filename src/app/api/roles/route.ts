import { z } from "zod";

import { syncDemoSessionBundle, warmDemoSessionFromCookies } from "@/server/auth/session";
import { fail, formatError, ok, readJson } from "@/server/http";
import { replan } from "@/server/pipeline";
import { resolveVenue } from "@/server/queries";

const bodySchema = z.object({
  venueId: z.string().uuid(),
  id: z.string().uuid().optional(),
  role: z.string().trim().min(2).max(60),
  department: z.string().trim().min(2).max(40),
  metric: z.enum(["covers", "orders"]),
  coversPerStaffHour: z.number().positive().max(500),
  hourlyCost: z.number().min(0).max(500),
  enabled: z.boolean(),
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await readJson(request));
    await warmDemoSessionFromCookies();
    const { store, venue, account } = await resolveVenue(body.venueId);
    const existing = (await store.listRoleConfigs(venue.id)).find((row) => row.id === body.id);
    const saved = await store.saveRole({
      id: body.id ?? crypto.randomUUID(),
      venueId: venue.id,
      role: body.role,
      department: body.department,
      metric: body.metric,
      coversPerStaffHour: body.coversPerStaffHour,
      hourlyCost: body.hourlyCost,
      enabled: body.enabled,
      isCustom: existing ? existing.isCustom : true,
    });
    await replan(store, venue);
    await syncDemoSessionBundle(store, account, venue);
    let message: string;
    if (!existing) {
      message = `${body.role} added. Forecast, staffing, and Approvals recalculated.`;
    } else if (existing.enabled !== body.enabled) {
      message = body.enabled
        ? `${body.role} is active again — included in staffing requirements.`
        : `${body.role} turned off — excluded from new requirements.`;
    } else {
      message = `${body.role} saved. Forecast, staffing, and Approvals recalculated.`;
    }
    return ok(saved, message);
  } catch (error) {
    return fail(formatError(error), 400);
  }
}
