import { connection } from "next/server";

import type { Alert, Forecast, Recommendation, Venue } from "@/lib/domain";
import { addDays, eachOpenHour, formatWhen, startOfZonedDay, weekdayName, zonedParts } from "@/lib/time";
import { activeSignals, syncHolidays, syncWeather } from "@/server/features/signals";
import { indexHistory, wcmaAt } from "@/server/forecast/wcma";
import { describeReasons, requiredHeadcount, scheduledAt } from "@/server/staffing/engine";
import type { DataStore } from "@/server/store/types";

const MODEL = "wcma-v1";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export async function runPipeline(store: DataStore, venue: Venue, from: Date, to: Date) {
  await syncHolidays(store, venue, from, to);
  await syncWeather(store, venue, from, to);

  const historyFrom = addDays(from, -70).toISOString();
  const fromIso = from.toISOString();
  const toIso = to.toISOString();
  const [sales, signals, reservations, configs, shifts, existing] = await Promise.all([
    store.listSales(venue.id, historyFrom, fromIso),
    store.listSignals(venue.id, fromIso, toIso),
    store.listReservations(venue.id, fromIso, toIso),
    store.listRoleConfigs(venue.id),
    store.listShifts(venue.id, fromIso, toIso),
    store.listRecommendations(venue.id, fromIso, toIso),
  ]);

  const coverIndex = indexHistory(
    sales.map((row) => ({ ts: row.ts, value: row.covers })),
    venue.timezone,
  );
  const orderIndex = indexHistory(
    sales.map((row) => ({ ts: row.ts, value: row.orderCount })),
    venue.timezone,
  );
  const previous = new Map(existing.map((row) => [`${row.hourStart}|${row.role}`, row]));
  const hours = eachOpenHour(from, to, venue.timezone, venue.openingHour, venue.closingHour);
  const forecasts: Forecast[] = [];
  const recommendations: Recommendation[] = [];

  for (const hour of hours) {
    const hourIso = hour.toISOString();
    const live = activeSignals(signals, hour);
    const holiday = live.find((signal) => signal.kind === "holiday");
    const weather = live.find((signal) => signal.kind === "weather");
    const events = live.filter((signal) => signal.kind === "event");
    const eventMultiplier = events.reduce((max, signal) => Math.max(max, signal.impactMultiplier), 1);
    const multiplier = clamp(
      (weather?.impactMultiplier ?? 1) * (holiday ? holiday.impactMultiplier : 1) * eventMultiplier,
      0.55,
      2,
    );
    const hourEnd = hour.getTime() + 3_600_000;
    const reserved = reservations
      .filter((row) => {
        const slot = new Date(row.slotStart).getTime();
        return slot >= hour.getTime() && slot < hourEnd && row.status !== "cancelled";
      })
      .reduce((sum, row) => sum + row.partySize, 0);
    const parts = zonedParts(hour, venue.timezone);
    const coverStat = wcmaAt(coverIndex, hour, venue.timezone);
    const orderStat = wcmaAt(orderIndex, hour, venue.timezone);
    const predictedCovers = Math.max(coverStat.predicted * multiplier, reserved);
    const predictedOrders = Math.max(orderStat.predicted * multiplier, reserved * 0.9);
    const drivers = {
      baselineCovers: Math.round(coverStat.baseline),
      multiplier: Number(multiplier.toFixed(2)),
      reserved,
      holiday: holiday?.label ?? "",
      weather: weather?.label ?? "",
      event: events.map((signal) => signal.label).join(", "),
    };

    forecasts.push(
      {
        id: crypto.randomUUID(),
        venueId: venue.id,
        hourStart: hourIso,
        metric: "covers",
        predicted: predictedCovers,
        lower: coverStat.lower * multiplier,
        upper: Math.max(coverStat.upper * multiplier, predictedCovers),
        modelVersion: MODEL,
        drivers,
      },
      {
        id: crypto.randomUUID(),
        venueId: venue.id,
        hourStart: hourIso,
        metric: "orders",
        predicted: predictedOrders,
        lower: orderStat.lower * multiplier,
        upper: Math.max(orderStat.upper * multiplier, predictedOrders),
        modelVersion: MODEL,
        drivers,
      },
    );

    for (const config of configs.filter((item) => item.enabled !== false)) {
      const demand = config.metric === "orders" ? predictedOrders : predictedCovers;
      const stat = config.metric === "orders" ? orderStat : coverStat;
      const required = requiredHeadcount(demand, config);
      const scheduled = scheduledAt(shifts, config.role, hour);
      const delta = required - scheduled;
      const kept = previous.get(`${hourIso}|${config.role}`);
      const preserve =
        kept &&
        kept.status !== "pending" &&
        kept.required === required &&
        kept.scheduled === scheduled;
      recommendations.push({
        id: kept?.id ?? crypto.randomUUID(),
        venueId: venue.id,
        hourStart: hourIso,
        role: config.role,
        required,
        scheduled,
        delta,
        hourlyCost: config.hourlyCost,
        costImpact: delta * config.hourlyCost,
        predictedCovers: Math.round(predictedCovers),
        status: preserve ? kept.status : "pending",
        reasons: describeReasons({
          weekday: weekdayName(parts.weekday),
          baseline: stat.baseline,
          predicted: demand,
          holiday: holiday?.label,
          weather: weather?.label,
          event: events[0]?.label,
          reserved,
          metricLabel: config.metric,
        }),
      });
    }
  }

  const alerts: Alert[] = recommendations
    .filter((row) => row.status === "pending" && Math.abs(row.delta) >= 2)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 8)
    .map((row) => ({
      id: crypto.randomUUID(),
      venueId: venue.id,
      severity: Math.abs(row.delta) >= 3 ? "high" : "medium",
      message: `${row.role} ${row.delta > 0 ? "short" : "heavy"} by ${Math.abs(row.delta)} at ${formatWhen(row.hourStart, venue.timezone)}`,
      readAt: null,
      createdAt: new Date().toISOString(),
    }));

  await store.replaceForecasts(venue.id, fromIso, toIso, forecasts);
  await store.replaceRecommendations(venue.id, fromIso, toIso, recommendations);
  await store.replaceUnreadAlerts(venue.id, alerts);
}

export async function ensurePipeline(store: DataStore, venue: Venue, from?: Date) {
  await connection();
  const start = from ?? startOfZonedDay(new Date(), venue.timezone);
  const to = addDays(start, 7);
  const existing = await store.listForecasts(venue.id, start.toISOString(), to.toISOString());
  const expected = eachOpenHour(start, to, venue.timezone, venue.openingHour, venue.closingHour).length;
  if (existing.length < expected) {
    await runPipeline(store, venue, start, to);
  }
  return { from: start, to };
}

export async function replan(store: DataStore, venue: Venue) {
  await connection();
  const from = startOfZonedDay(new Date(), venue.timezone);
  const to = addDays(from, 7);
  await runPipeline(store, venue, from, to);
  return { from, to };
}
