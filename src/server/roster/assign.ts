import type { StaffMember, Venue } from "@/lib/domain";
import { addDays, eachOpenHour, startOfZonedDay, zonedParts, zonedTimeToUtc } from "@/lib/time";
import { ensurePipeline } from "@/server/pipeline";
import type { DataStore } from "@/server/store/types";

export async function buildWeeklyRoster(store: DataStore, venue: Venue) {
  const from = startOfZonedDay(new Date(), venue.timezone);
  const to = addDays(from, 7);
  await ensurePipeline(store, venue, from);
  const [recommendations, staff, configs] = await Promise.all([
    store.listRecommendations(venue.id, from.toISOString(), to.toISOString()),
    store.listStaff(venue.id),
    store.listRoleConfigs(venue.id),
  ]);
  const enabled = new Set(configs.filter((row) => row.enabled).map((row) => row.role));
  const hoursUsed = new Map<string, number>();
  const shifts = [];
  const days = eachOpenHour(from, to, venue.timezone, venue.openingHour, venue.openingHour + 1);

  for (const day of days) {
    const parts = zonedParts(day, venue.timezone);
    const windows = [
      { start: venue.openingHour, end: Math.min(17, venue.closingHour) },
      { start: Math.max(venue.openingHour, 17), end: venue.closingHour },
    ].filter((window) => window.end > window.start);
    for (const window of windows) {
      const windowStart = zonedTimeToUtc(parts.year, parts.month, parts.day, window.start, 0, venue.timezone);
      const windowEnd = window.end === 24
        ? zonedTimeToUtc(parts.year, parts.month, parts.day, 23, 59, venue.timezone)
        : zonedTimeToUtc(parts.year, parts.month, parts.day, window.end, 0, venue.timezone);
      const span = Math.max(1, (windowEnd.getTime() - windowStart.getTime()) / 3_600_000);
      for (const role of enabled) {
        const inWindow = recommendations.filter((row) => {
          const ts = new Date(row.hourStart).getTime();
          return row.role === role && ts >= windowStart.getTime() && ts < windowEnd.getTime();
        });
        const needed = inWindow.reduce((max, row) => Math.max(max, row.required), 0);
        if (needed <= 0) continue;
        const pool = staff
          .filter((person) => person.role === role)
          .sort((a, b) => (hoursUsed.get(a.id) ?? 0) - (hoursUsed.get(b.id) ?? 0));
        let assigned = 0;
        for (const person of pool) {
          if (assigned >= needed) break;
          const used = hoursUsed.get(person.id) ?? 0;
          if (used + span > person.maxWeeklyHours) continue;
          shifts.push(draftShift(venue.id, person, windowStart, windowEnd));
          hoursUsed.set(person.id, used + span);
          assigned += 1;
        }
      }
    }
  }

  await store.replaceDraftShifts(venue.id, from.toISOString(), to.toISOString(), shifts);
  return shifts.length;
}

function draftShift(venueId: string, person: StaffMember, start: Date, end: Date) {
  return {
    id: crypto.randomUUID(),
    venueId,
    staffId: person.id,
    staffName: person.name,
    role: person.role,
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
    status: "draft" as const,
  };
}
