import type { Venue, VenueType } from "@/lib/domain";
import { countryByCode } from "@/lib/countries";
import { addDays, startOfZonedDay, zonedParts, zonedTimeToUtc } from "@/lib/time";
import { roleCatalog, serviceHours, starterName } from "@/server/catalogs";
import { insertVenue, memoryStore } from "@/server/store/memory";
import { replan } from "@/server/pipeline";
import { buildWeeklyRoster } from "@/server/roster/assign";

export type SignupInput = {
  name: string;
  email: string;
  businessType: VenueType;
  venueName: string;
  city: string;
  countryCode: string;
};

export async function placeCity(city: string, countryCode: string) {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", city);
  url.searchParams.set("count", "5");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");
  const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
  if (!response.ok) return null;
  const body = (await response.json()) as {
    results?: { latitude: number; longitude: number; timezone?: string; country_code?: string; name: string }[];
  };
  const results = body.results ?? [];
  const match =
    results.find((row) => row.country_code?.toUpperCase() === countryCode.toUpperCase()) ?? results[0];
  if (!match) return null;
  return {
    latitude: match.latitude,
    longitude: match.longitude,
    timezone: match.timezone || "UTC",
    city: match.name,
  };
}

export async function provisionVenue(input: SignupInput): Promise<Venue> {
  const country = countryByCode(input.countryCode);
  if (!country) throw new Error("Choose a country from the list");
  const place = await placeCity(input.city, country.code);
  if (!place) throw new Error("We could not place that city. Try the nearest city name.");
  const hours = serviceHours(input.businessType);
  const venue: Venue = {
    id: crypto.randomUUID(),
    organizationId: crypto.randomUUID(),
    name: input.venueName.trim(),
    venueType: input.businessType,
    timezone: place.timezone,
    countryCode: country.code,
    city: place.city,
    latitude: place.latitude,
    longitude: place.longitude,
    capacity: hours.capacity,
    currency: country.currency,
    openingHour: hours.openingHour,
    closingHour: hours.closingHour,
  };
  await materializeVenue(venue);
  return venue;
}

/** (Re)build roles, staff, sales, forecast, and roster for a venue in demo memory. */
export async function materializeVenue(venue: Venue) {
  const state = memoryStore;
  const existing = await state.getVenue(venue.id);
  if (!existing) insertVenue(venue);
  const roles = await state.listRoleConfigs(venue.id);
  if (roles.length > 0) {
    const historyFrom = addDays(startOfZonedDay(new Date(), venue.timezone), -70).toISOString();
    const sales = await state.listSales(venue.id, historyFrom, new Date().toISOString());
    if (sales.length === 0) await seedBaseline(venue);
    return;
  }

  const catalog = roleCatalog(venue.venueType);
  let nameIndex = 0;
  for (const template of catalog) {
    await state.saveRole({
      id: crypto.randomUUID(),
      venueId: venue.id,
      role: template.role,
      department: template.department,
      metric: template.metric,
      coversPerStaffHour: template.coversPerStaffHour,
      hourlyCost: template.hourlyCost,
      enabled: true,
      isCustom: false,
    });
    for (let i = 0; i < template.starterCount; i += 1) {
      nameIndex += 1;
      await state.saveStaff({
        id: crypto.randomUUID(),
        venueId: venue.id,
        name: `${starterName(nameIndex)} ${nameIndex}`,
        role: template.role,
        hourlyCost: template.hourlyCost,
        maxWeeklyHours: 40,
        skills: [template.role],
      });
    }
  }

  await seedBaseline(venue);
  await replan(state, venue);
  await buildWeeklyRoster(state, venue);
}

export async function seedBaseline(venue: Venue) {
  const today = startOfZonedDay(new Date(), venue.timezone);
  const scale = venue.capacity / 80;
  const rows = [];
  for (let dayOffset = -56; dayOffset < 0; dayOffset += 1) {
    const day = addDays(today, dayOffset);
    const parts = zonedParts(day, venue.timezone);
    for (let hour = venue.openingHour; hour < venue.closingHour; hour += 1) {
      let base = 28 * scale;
      if (parts.weekday === 0 || parts.weekday === 6) base *= 1.7;
      else if (parts.weekday === 5) base *= 1.45;
      else if (parts.weekday === 2) base *= 0.75;
      let mult = 0.7;
      if (hour >= 13 && hour <= 14) mult = 1.2;
      if (hour >= 19 && hour <= 21) mult = 1.7;
      const covers = Math.max(4, Math.round(base * mult));
      rows.push({
        id: crypto.randomUUID(),
        venueId: venue.id,
        ts: zonedTimeToUtc(parts.year, parts.month, parts.day, hour, 0, venue.timezone).toISOString(),
        channel: "dine-in",
        covers,
        orderCount: Math.max(1, Math.round(covers * 0.9)),
        orderValue: Math.round(covers * 32),
      });
    }
  }
  await memoryStore.insertSales(rows);
}
