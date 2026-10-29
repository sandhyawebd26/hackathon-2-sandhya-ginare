import { z } from "zod";

import { syncDemoSessionBundle } from "@/server/auth/session";
import { fail, formatError, ok, readJson } from "@/server/http";
import { ensurePipeline } from "@/server/pipeline";
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
    const { store, venue, account } = await resolveVenue();
    await ensurePipeline(store, venue);

    let existing = await store.getRecommendation(id);
    if (!existing) {
      await ensurePipeline(store, venue);
      existing = await store.getRecommendation(id);
    }
    if (!existing) return fail("Recommendation not found", 404);
    if (!account.venueIds.includes(existing.venueId)) return fail("Venue not found", 404);
    if (existing.venueId !== venue.id) {
      const scoped = await resolveVenue(existing.venueId);
      await ensurePipeline(scoped.store, scoped.venue);
    }

    const recommendation = await store.actOnRecommendation({ id, ...body });
    await syncDemoSessionBundle(store, account, venue);
    return ok(recommendation, "Recommendation updated");
  } catch (error) {
    return fail(formatError(error), 400);
  }
}
