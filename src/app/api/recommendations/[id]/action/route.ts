import { z } from "zod";

import { fail, ok, readJson } from "@/server/http";
import { resolveVenue } from "@/server/queries";

const bodySchema = z.object({
  action: z.enum(["accepted", "edited", "ignored"]),
  editedRequired: z.number().int().min(0).max(80).optional(),
  notes: z.string().max(280).optional(),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = bodySchema.parse(await readJson(request));
    const { store } = await resolveVenue();
    const existing = await store.getRecommendation(id);
    if (!existing) return fail("Recommendation not found", 404);
    await resolveVenue(existing.venueId);
    const recommendation = await store.actOnRecommendation({ id, ...body });
    return ok(recommendation, "Recommendation updated");
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Could not update the recommendation", 400);
  }
}
