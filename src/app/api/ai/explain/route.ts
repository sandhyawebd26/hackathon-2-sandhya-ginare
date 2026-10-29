import { z } from "zod";

import { explainRecommendation } from "@/server/ai/explain";
import { fail, ok, readJson } from "@/server/http";
import { resolveVenue } from "@/server/queries";

const bodySchema = z.object({ recommendationId: z.string().uuid() });

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await readJson(request));
    const { store, venues } = await resolveVenue();
    const recommendation = await store.getRecommendation(body.recommendationId);
    if (!recommendation) return fail("Recommendation not found", 404);
    const venue = venues.find((item) => item.id === recommendation.venueId);
    if (!venue) return fail("Venue not found", 404);
    const explanation = await explainRecommendation(venue, recommendation);
    return ok({ ...explanation, reasons: recommendation.reasons, recommendation });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Could not explain this hour", 400);
  }
}
