import { z } from "zod";

import { explainRecommendation } from "@/server/ai/explain";
import { warmDemoSessionFromCookies } from "@/server/auth/session";
import { fail, formatError, ok, readJson } from "@/server/http";
import { ensurePipeline, replan } from "@/server/pipeline";
import { resolveVenue } from "@/server/queries";

const bodySchema = z.object({
  recommendationId: z.string().uuid(),
  venueId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await readJson(request));
    await warmDemoSessionFromCookies();
    const { store, venues, venue } = await resolveVenue(body.venueId);
    await ensurePipeline(store, venue);

    let recommendation = await store.getRecommendation(body.recommendationId);
    if (!recommendation) {
      await replan(store, venue);
      recommendation = await store.getRecommendation(body.recommendationId);
    }
    if (!recommendation) {
      return fail("Recommendation not found. Refresh the staffing page and open the cell again.", 404);
    }

    const scopedVenue = venues.find((item) => item.id === recommendation!.venueId) ?? venue;
    const explanation = await explainRecommendation(scopedVenue, recommendation);
    return ok({ ...explanation, reasons: recommendation.reasons, recommendation });
  } catch (error) {
    return fail(formatError(error), 400);
  }
}
