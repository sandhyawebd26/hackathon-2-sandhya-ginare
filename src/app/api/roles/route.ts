import { z } from "zod";

import { fail, ok, readJson } from "@/server/http";
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
    const { store, venue } = await resolveVenue(body.venueId);
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
    return ok(saved, "Role saved");
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Could not save the role", 400);
  }
}
