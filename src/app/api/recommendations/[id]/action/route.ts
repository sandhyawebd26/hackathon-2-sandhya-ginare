import { z } from "zod";

import { syncDemoSessionBundle, warmDemoSessionFromCookies } from "@/server/auth/session";
import { fail, formatError, ok, readJson } from "@/server/http";
import { ensurePipeline, replan } from "@/server/pipeline";
import { resolveVenue } from "@/server/queries";

const bodySchema = z.object({
  venueId: z.string().uuid().optional(),
  action: z.enum(["accepted", "edited", "ignored"]),
  editedRequired: z.number().int().min(0).max(80).optional(),
  notes: z.string().max(280).optional(),
});

function actionMessage(action: z.infer<typeof bodySchema>["action"]) {
  if (action === "accepted") return "Accepted — cleared from your queue.";
  if (action === "ignored") return "Ignored — cleared from your queue.";
  return "Headcount saved — cleared from your queue.";
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = bodySchema.parse(await readJson(request));
    await warmDemoSessionFromCookies();

    const { store, venue, account } = await resolveVenue(body.venueId);
    await ensurePipeline(store, venue);

    let existing = await store.getRecommendation(id);
    if (!existing) {
      await replan(store, venue);
      existing = await store.getRecommendation(id);
    }
    if (!existing) {
      return fail("This gap is no longer in memory. Refresh Approvals and try again.", 404);
    }
    if (!account.venueIds.includes(existing.venueId)) return fail("Venue not found", 404);

    const scoped =
      existing.venueId === venue.id ? { store, venue } : await resolveVenue(existing.venueId);
    await ensurePipeline(scoped.store, scoped.venue);

    const recommendation = await scoped.store.actOnRecommendation({ id, ...body });
    try {
      await syncDemoSessionBundle(scoped.store, account, scoped.venue);
    } catch (syncError) {
      console.error("syncDemoSessionBundle failed after approval", syncError);
    }
    return ok(recommendation, actionMessage(body.action));
  } catch (error) {
    return fail(formatError(error), 400);
  }
}
