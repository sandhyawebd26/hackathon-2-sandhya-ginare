import type { Recommendation, Venue } from "@/lib/domain";
import { formatWhen } from "@/lib/time";
import { geminiText } from "./gemini";

export function templateExplanation(venue: Venue, recommendation: Recommendation) {
  const when = formatWhen(recommendation.hourStart, venue.timezone);
  const drivers = recommendation.reasons.map((reason) => reason.label).join(", ");
  const gap =
    recommendation.delta > 0
      ? `${recommendation.delta} more than scheduled`
      : recommendation.delta < 0
        ? `${Math.abs(recommendation.delta)} fewer than scheduled`
        : "matching the roster";
  return `${when}: schedule ${recommendation.required} ${recommendation.role}${recommendation.required === 1 ? "" : "s"} (${gap}). Drivers: ${drivers}.`;
}

export async function explainRecommendation(venue: Venue, recommendation: Recommendation) {
  const fallback = templateExplanation(venue, recommendation);
  const prompt = [
    "You are ShiftSense, a hospitality workforce assistant.",
    "Write 2 or 3 sentences for a floor manager.",
    "Use only the facts below. Do not invent numbers or change the required headcount.",
    JSON.stringify({
      venue: venue.name,
      city: venue.city,
      when: formatWhen(recommendation.hourStart, venue.timezone),
      role: recommendation.role,
      required: recommendation.required,
      scheduled: recommendation.scheduled,
      delta: recommendation.delta,
      reasons: recommendation.reasons,
    }),
  ].join("\n");
  const text = await geminiText(prompt);
  if (!text) return { text: fallback, source: "template" as const };
  return { text, source: "gemini" as const };
}
