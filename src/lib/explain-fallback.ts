import type { Reason } from "@/lib/domain";

/** Client-side fallback when /api/ai/explain misses memory on another lambda. */
export function staffingCellExplanation(input: {
  label: string;
  role: string;
  required: number;
  scheduled: number;
  delta: number;
  reasons: Reason[];
}) {
  const drivers = input.reasons.map((reason) => reason.label).join(", ");
  const gap =
    input.delta > 0
      ? `${input.delta} more than scheduled`
      : input.delta < 0
        ? `${Math.abs(input.delta)} fewer than scheduled`
        : "matching the roster";
  return `${input.label}: schedule ${input.required} ${input.role}${input.required === 1 ? "" : "s"} (${gap}). Drivers: ${drivers || "forecast baseline"}.`;
}
