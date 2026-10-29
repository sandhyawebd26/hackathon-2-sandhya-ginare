import Holidays from "date-holidays";

import type { ExternalSignal, Venue } from "@/lib/domain";
import { dateKey, zonedParts, zonedTimeToUtc } from "@/lib/time";
import type { DataStore } from "@/server/store/types";

export async function syncHolidays(store: DataStore, venue: Venue, from: Date, to: Date) {
  const holidays = new Holidays(venue.countryCode, { languages: "en" });
  const rows: ExternalSignal[] = [];
  const cursor = new Date(from);
  const seen = new Set<string>();
  while (cursor < to) {
    const parts = zonedParts(cursor, venue.timezone);
    const key = dateKey(cursor, venue.timezone);
    if (!seen.has(key)) {
      seen.add(key);
      const noon = zonedTimeToUtc(parts.year, parts.month, parts.day, 12, 0, venue.timezone);
      const found = holidays.isHoliday(noon);
      const publicHoliday = Array.isArray(found)
        ? found.find((holiday) => holiday.type === "public")
        : null;
      if (publicHoliday) {
        const start = zonedTimeToUtc(parts.year, parts.month, parts.day, 0, 0, venue.timezone);
        const end = zonedTimeToUtc(parts.year, parts.month, parts.day, 23, 59, venue.timezone);
        rows.push({
          id: crypto.randomUUID(),
          venueId: venue.id,
          kind: "holiday",
          startsAt: start.toISOString(),
          endsAt: end.toISOString(),
          label: publicHoliday.name,
          impactMultiplier: 1.22,
          payload: { country: venue.countryCode },
        });
      }
    }
    cursor.setTime(cursor.getTime() + 86_400_000);
  }
  await store.replaceSignals(venue.id, "holiday", from.toISOString(), to.toISOString(), rows);
  return rows;
}

function weatherLabel(precipitation: number, code: number) {
  if (precipitation >= 1.5 || code >= 61) return { multiplier: 0.84, label: "Rain" };
  if (precipitation > 0 || code >= 51) return { multiplier: 0.93, label: "Light rain" };
  return null;
}

export async function syncWeather(store: DataStore, venue: Venue, from: Date, to: Date) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(venue.latitude));
  url.searchParams.set("longitude", String(venue.longitude));
  url.searchParams.set("hourly", "temperature_2m,precipitation,weather_code");
  url.searchParams.set("timezone", venue.timezone);
  url.searchParams.set("forecast_days", "7");
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(3500) });
    if (!response.ok) return;
    const body = (await response.json()) as {
      hourly?: {
        time?: string[];
        precipitation?: number[];
        weather_code?: number[];
        temperature_2m?: number[];
      };
    };
    const times = body.hourly?.time ?? [];
    const rows: ExternalSignal[] = [];
    times.forEach((stamp, index) => {
      const precipitation = body.hourly?.precipitation?.[index] ?? 0;
      const code = body.hourly?.weather_code?.[index] ?? 0;
      const impact = weatherLabel(precipitation, code);
      if (!impact) return;
      const [date, time] = stamp.split("T");
      const [year, month, day] = date.split("-").map(Number);
      const [hour, minute] = (time ?? "0:0").split(":").map(Number);
      const start = zonedTimeToUtc(year, month, day, hour, minute ?? 0, venue.timezone);
      if (start < from || start >= to) return;
      rows.push({
        id: crypto.randomUUID(),
        venueId: venue.id,
        kind: "weather",
        startsAt: start.toISOString(),
        endsAt: new Date(start.getTime() + 3_600_000).toISOString(),
        label: impact.label,
        impactMultiplier: impact.multiplier,
        payload: {
          precipitation,
          code,
          temperature: Math.round(body.hourly?.temperature_2m?.[index] ?? 0),
        },
      });
    });
    await store.replaceSignals(venue.id, "weather", from.toISOString(), to.toISOString(), rows);
  } catch {
    // Keep the seeded or previously stored weather snapshot.
  }
}

export function activeSignals(signals: ExternalSignal[], hour: Date) {
  const ts = hour.toISOString();
  return signals.filter((signal) => signal.startsAt <= ts && signal.endsAt > ts);
}
