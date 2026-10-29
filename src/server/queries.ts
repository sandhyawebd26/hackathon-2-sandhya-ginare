import { connection } from "next/server";

import { gapTone, type Venue } from "@/lib/domain";
import { addDays, dateKey, formatWhen, startOfZonedDay, zonedTimeToUtc } from "@/lib/time";
import { requireAccount } from "@/server/auth/session";
import { ensurePipeline } from "@/server/pipeline";
import { getStore } from "@/server/store/supabase";

export async function resolveVenue(venueId?: string) {
  await connection();
  const account = await requireAccount();
  const store = await getStore();
  const venues = (await store.listVenues()).filter((item) => account.venueIds.includes(item.id));
  if (venueId && !account.venueIds.includes(venueId)) throw new Error("Venue not found");
  const venue = venues.find((item) => item.id === venueId) ?? venues[0];
  if (!venue) throw new Error("No venues are available");
  return { store, venues, venue, account };
}

export async function venueWindow(venue: Venue, date?: string) {
  const start = date
    ? zonedTimeToUtc(
        Number(date.slice(0, 4)),
        Number(date.slice(5, 7)),
        Number(date.slice(8, 10)),
        0,
        0,
        venue.timezone,
      )
    : startOfZonedDay(new Date(), venue.timezone);
  const today = startOfZonedDay(new Date(), venue.timezone);
  return { from: start, to: addDays(start, 1), weekFrom: today, weekTo: addDays(today, 7) };
}

export async function loadDashboard(venueId?: string) {
  const { store, venues, venue } = await resolveVenue(venueId);
  const { from, to } = await ensurePipeline(store, venue);
  const [forecasts, recommendations, alerts] = await Promise.all([
    store.listForecasts(venue.id, from.toISOString(), to.toISOString()),
    store.listRecommendations(venue.id, from.toISOString(), to.toISOString()),
    store.listAlerts(venue.id),
  ]);
  const covers = forecasts.filter((row) => row.metric === "covers");
  const peak = [...covers].sort((a, b) => b.predicted - a.predicted)[0];
  const pending = recommendations.filter((row) => row.status === "pending");
  const under = pending.filter((row) => row.delta > 0).length;
  const over = pending.filter((row) => row.delta < 0).length;
  const extraCost = pending.filter((row) => row.delta > 0).reduce((sum, row) => sum + row.costImpact, 0);
  const daily = new Map<string, number>();
  for (const row of covers) {
    const key = dateKey(new Date(row.hourStart), venue.timezone);
    daily.set(key, (daily.get(key) ?? 0) + row.predicted);
  }
  return {
    venues,
    venue,
    alerts,
    under,
    over,
    extraCost,
    peak: peak
      ? { label: formatWhen(peak.hourStart, venue.timezone), covers: Math.round(peak.predicted) }
      : null,
    daily: [...daily.entries()].map(([day, predicted]) => ({ day, predicted: Math.round(predicted) })),
    hourly: covers.map((row) => ({
      hourStart: row.hourStart,
      label: formatWhen(row.hourStart, venue.timezone, false),
      predicted: Math.round(row.predicted),
      lower: Math.round(row.lower),
      upper: Math.round(row.upper),
    })),
  };
}

export async function loadStaffing(venueId?: string, date?: string) {
  const { store, venues, venue } = await resolveVenue(venueId);
  await ensurePipeline(store, venue);
  const day = await venueWindow(venue, date);
  const recommendations = await store.listRecommendations(
    venue.id,
    day.from.toISOString(),
    day.to.toISOString(),
  );
  const roles = [...new Set(recommendations.map((row) => row.role))];
  const hours = [...new Set(recommendations.map((row) => row.hourStart))].sort();
  return {
    venues,
    venue,
    date: dateKey(day.from, venue.timezone),
    roles,
    hours,
    cells: recommendations.map((row) => ({
      ...row,
      tone: gapTone(row.delta),
      label: formatWhen(row.hourStart, venue.timezone, false),
    })),
  };
}

export async function loadRoster(venueId?: string) {
  const { store, venues, venue } = await resolveVenue(venueId);
  const from = startOfZonedDay(new Date(), venue.timezone);
  const to = addDays(from, 7);
  const [shifts, staff] = await Promise.all([
    store.listShifts(venue.id, from.toISOString(), to.toISOString()),
    store.listStaff(venue.id),
  ]);
  const hours = new Map<string, number>();
  for (const shift of shifts) {
    if (!shift.staffId) continue;
    const span = (new Date(shift.endsAt).getTime() - new Date(shift.startsAt).getTime()) / 3_600_000;
    hours.set(shift.staffId, (hours.get(shift.staffId) ?? 0) + span);
  }
  return {
    venues,
    venue,
    shifts: shifts
      .map((shift) => ({ ...shift, when: formatWhen(shift.startsAt, venue.timezone) }))
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    flags: staff
      .map((person) => ({
        name: person.name,
        role: person.role,
        hours: Math.round(hours.get(person.id) ?? 0),
        max: person.maxWeeklyHours,
      }))
      .filter((person) => person.hours > person.max),
  };
}

export async function loadSettings(venueId?: string) {
  const { store, venues, venue } = await resolveVenue(venueId);
  const [configs, jobs] = await Promise.all([
    store.listRoleConfigs(venue.id),
    store.listImportJobs(venue.id),
  ]);
  return {
    venues,
    venue,
    configs,
    jobs,
    dataSource: process.env.DATA_SOURCE === "supabase" ? "supabase" : "demo",
  };
}
