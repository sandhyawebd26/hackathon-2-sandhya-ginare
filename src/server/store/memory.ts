import type { Account } from "@/lib/domain";
import type { ActionInput, DataStore } from "./types";
import { STORE_VERSION, createSeed } from "./seed";

type MemoryGlobal = typeof globalThis & { __shiftsense?: ReturnType<typeof createSeed> };

function db() {
  const holder = globalThis as MemoryGlobal;
  if (!holder.__shiftsense || holder.__shiftsense.version !== STORE_VERSION) {
    holder.__shiftsense = createSeed();
  }
  return holder.__shiftsense;
}

export function findAccount(id: string) {
  return db().users.find((user) => user.id === id) ?? null;
}

export function findAccountByEmail(email: string) {
  const key = email.trim().toLowerCase();
  return db().users.find((user) => user.email === key) ?? null;
}

export function insertAccount(account: Account) {
  db().users.push(account);
  return account;
}

export function insertVenue(venue: import("@/lib/domain").Venue) {
  db().venues.push(venue);
  return venue;
}

function inWindow(ts: string, from?: string, to?: string) {
  if (from && ts < from) return false;
  if (to && ts >= to) return false;
  return true;
}

function overlaps(startsAt: string, endsAt: string, from: string, to: string) {
  return startsAt < to && endsAt > from;
}

export const memoryStore: DataStore = {
  kind: "demo",
  async listVenues() {
    return db().venues;
  },
  async getVenue(id) {
    return db().venues.find((venue) => venue.id === id) ?? null;
  },
  async listRoleConfigs(venueId) {
    return db().roleConfigs.filter((row) => row.venueId === venueId);
  },
  async listStaff(venueId) {
    return db().staff.filter((row) => row.venueId === venueId);
  },
  async listShifts(venueId, from, to) {
    return db().shifts.filter(
      (row) => row.venueId === venueId && overlaps(row.startsAt, row.endsAt, from, to),
    );
  },
  async listSales(venueId, from, to) {
    return db().sales.filter((row) => row.venueId === venueId && inWindow(row.ts, from, to));
  },
  async insertSales(rows) {
    db().sales.push(...rows);
    return rows.length;
  },
  async listReservations(venueId, from, to) {
    return db().reservations.filter(
      (row) => row.venueId === venueId && inWindow(row.slotStart, from, to),
    );
  },
  async insertReservations(rows) {
    db().reservations.push(...rows);
    return rows.length;
  },
  async listSignals(venueId, from, to) {
    return db().signals.filter(
      (row) => row.venueId === venueId && overlaps(row.startsAt, row.endsAt, from, to),
    );
  },
  async replaceSignals(venueId, kind, from, to, rows) {
    const state = db();
    state.signals = state.signals.filter(
      (row) =>
        !(
          row.venueId === venueId &&
          row.kind === kind &&
          overlaps(row.startsAt, row.endsAt, from, to)
        ),
    );
    state.signals.push(...rows);
  },
  async addSignal(signal) {
    db().signals.push(signal);
    return signal;
  },
  async listForecasts(venueId, from, to) {
    return db().forecasts.filter(
      (row) => row.venueId === venueId && inWindow(row.hourStart, from, to),
    );
  },
  async replaceForecasts(venueId, from, to, rows) {
    const state = db();
    state.forecasts = state.forecasts.filter(
      (row) => !(row.venueId === venueId && inWindow(row.hourStart, from, to)),
    );
    state.forecasts.push(...rows);
  },
  async listRecommendations(venueId, from, to) {
    return db().recommendations.filter(
      (row) => row.venueId === venueId && inWindow(row.hourStart, from, to),
    );
  },
  async replaceRecommendations(venueId, from, to, rows) {
    const state = db();
    state.recommendations = state.recommendations.filter(
      (row) => !(row.venueId === venueId && inWindow(row.hourStart, from, to)),
    );
    state.recommendations.push(...rows);
  },
  async getRecommendation(id) {
    return db().recommendations.find((row) => row.id === id) ?? null;
  },
  async actOnRecommendation(input: ActionInput) {
    const row = db().recommendations.find((item) => item.id === input.id);
    if (!row) throw new Error("Recommendation not found");
    if (input.action === "edited") {
      if (input.editedRequired == null || input.editedRequired < 0) {
        throw new Error("An edited headcount is required");
      }
      row.required = input.editedRequired;
      row.delta = input.editedRequired - row.scheduled;
      row.costImpact = row.delta * row.hourlyCost;
    }
    row.status = input.action;
    db().actions.push({
      id: crypto.randomUUID(),
      recommendationId: row.id,
      action: input.action,
      editedRequired: input.editedRequired ?? null,
      notes: input.notes ?? null,
      createdAt: new Date().toISOString(),
    });
    return row;
  },
  async listAlerts(venueId) {
    return db()
      .alerts.filter((row) => row.venueId === venueId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async replaceUnreadAlerts(venueId, rows) {
    const state = db();
    state.alerts = state.alerts.filter((row) => !(row.venueId === venueId && !row.readAt));
    state.alerts.push(...rows);
  },
  async markAlertRead(id) {
    const row = db().alerts.find((alert) => alert.id === id);
    if (row) row.readAt = new Date().toISOString();
  },
  async saveRole(config) {
    const rows = db().roleConfigs;
    const index = rows.findIndex((row) => row.id === config.id);
    if (index >= 0) rows[index] = config;
    else rows.push(config);
    return config;
  },
  async saveStaff(member) {
    const rows = db().staff;
    const index = rows.findIndex((row) => row.id === member.id);
    if (index >= 0) rows[index] = member;
    else rows.push(member);
    return member;
  },
  async replaceDraftShifts(venueId, from, to, rows) {
    const state = db();
    state.shifts = state.shifts.filter(
      (row) => !(row.venueId === venueId && row.status === "draft" && overlaps(row.startsAt, row.endsAt, from, to)),
    );
    state.shifts.push(...rows);
  },
  async listImportJobs(venueId) {
    return db().imports.filter((row) => row.venueId === venueId);
  },
  async createImportJob(job) {
    db().imports.push(job);
    return job;
  },
};
