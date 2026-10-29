import type { Alert, Venue } from "@/lib/domain";
import { geminiText } from "./gemini";

export type BriefingInput = {
  peak: { label: string; covers: number } | null;
  under: number;
  over: number;
  extraCost: number;
  currency: string;
  daily: { day: string; predicted: number }[];
  alerts: Alert[];
  signals: { kind: string; label: string; impactMultiplier: number; when: string }[];
};

function templateBriefing(venue: Venue, input: BriefingInput) {
  const peak = input.peak ? `${input.peak.covers} covers around ${input.peak.label}` : "no clear peak yet";
  const gaps =
    input.under + input.over === 0
      ? "Staffing matches the forecast across the week."
      : `${input.under} role-hours run short and ${input.over} run heavy versus the draft roster.`;
  const external =
    input.signals.length > 0
      ? `External drivers include ${input.signals.slice(0, 4).map((s) => s.label).join(", ")}.`
      : "No holidays or rain windows are flagged in the next seven days.";
  return `${venue.name} in ${venue.city}: expect ${peak}. ${gaps} ${external}`;
}

export async function weeklyBriefing(venue: Venue, input: BriefingInput) {
  const fallback = templateBriefing(venue, input);
  const prompt = [
    "You are ShiftSense, a hospitality workforce assistant.",
    "Write 3 short sentences for a restaurant floor manager about the next seven days.",
    "Use only the JSON facts. Do not invent covers, costs, or headcount.",
    "Mention peak demand, roster gaps, and any holidays/events/weather if present.",
    JSON.stringify({
      venue: venue.name,
      city: venue.city,
      currency: input.currency,
      peak: input.peak,
      underHours: input.under,
      overHours: input.over,
      extraCostIfFilled: input.extraCost,
      dailyCovers: input.daily,
      topAlerts: input.alerts.slice(0, 5).map((a) => a.message),
      externalSignals: input.signals,
    }),
  ].join("\n");
  const text = await geminiText(prompt);
  if (!text) return { text: fallback, source: "template" as const };
  return { text, source: "gemini" as const };
}

export async function signalsBriefing(
  venue: Venue,
  signals: { kind: string; label: string; impactMultiplier: number; when: string }[],
) {
  const fallback =
    signals.length === 0
      ? "No public holidays or rain hours are on the calendar for the next two weeks. Add private events below when the room changes."
      : `On the calendar: ${signals.map((s) => `${s.label} (${s.kind}, ×${s.impactMultiplier})`).join("; ")}. Each applies a multiplier before headcount is calculated.`;
  const prompt = [
    "Summarize how these external signals should affect restaurant staffing for a floor manager.",
    "Two or three sentences. Use only the list below.",
    JSON.stringify({ venue: venue.name, city: venue.city, signals }),
  ].join("\n");
  const text = await geminiText(prompt);
  if (!text) return { text: fallback, source: "template" as const };
  return { text, source: "gemini" as const };
}
