import { createHash } from "crypto";

/** Stable id so approvals survive demo rehydrate + replan on another lambda. */
export function stableRecommendationId(venueId: string, hourStart: string, role: string) {
  const hex = createHash("sha256").update(`${venueId}\0${hourStart}\0${role}`).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

export function recommendationKey(hourStart: string, role: string) {
  return `${hourStart}|${role}`;
}
