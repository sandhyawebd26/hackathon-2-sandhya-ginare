import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { connection } from "next/server";

import type {
  Alert,
  ExternalSignal,
  Forecast,
  ImportJob,
  Recommendation,
  RecommendationStatus,
  Reservation,
  SalesFact,
  Shift,
  SignalKind,
  StaffMember,
  Venue,
} from "@/lib/domain";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient as createUserClient } from "@/lib/supabase/server";
import type { DataStore } from "./types";

type Row = Record<string, unknown>;

function adminClient() {
  const { url } = getSupabaseEnv();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required when DATA_SOURCE=supabase");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function asVenue(row: Row): Venue {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    name: String(row.name),
    venueType: row.venue_type as Venue["venueType"],
    timezone: String(row.timezone),
    countryCode: String(row.country_code),
    city: String(row.city ?? ""),
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    capacity: Number(row.capacity),
    currency: String(row.currency),
    openingHour: Number(row.opening_hour),
    closingHour: Number(row.closing_hour),
  };
}

function asRecommendation(row: Row): Recommendation {
  return {
    id: String(row.id),
    venueId: String(row.venue_id),
    hourStart: String(row.hour_start),
    role: String(row.role),
    required: Number(row.required),
    scheduled: Number(row.scheduled),
    delta: Number(row.delta),
    costImpact: Number(row.cost_impact),
    hourlyCost: Number(row.hourly_cost),
    predictedCovers: Number(row.predicted_covers),
    reasons: (row.reasons as Recommendation["reasons"]) ?? [],
    status: row.status as RecommendationStatus,
  };
}

export function createSupabaseStore(
  client: SupabaseClient,
  organizationId: string | null,
): DataStore {
  async function venueIds() {
    let query = client.from("venues").select("id");
    if (organizationId) query = query.eq("organization_id", organizationId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => String(row.id));
  }

  async function assertVenue(id: string) {
    const venue = await store.getVenue(id);
    if (!venue) throw new Error("Venue not found");
    return venue;
  }

  const store: DataStore = {
    kind: "supabase",
    async listVenues() {
      let query = client.from("venues").select("*").order("name");
      if (organizationId) query = query.eq("organization_id", organizationId);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => asVenue(row as Row));
    },
    async getVenue(id) {
      let query = client.from("venues").select("*").eq("id", id);
      if (organizationId) query = query.eq("organization_id", organizationId);
      const { data, error } = await query.maybeSingle();
      if (error) throw new Error(error.message);
      return data ? asVenue(data as Row) : null;
    },
    async listRoleConfigs(venueId) {
      await assertVenue(venueId);
      const { data, error } = await client.from("venue_role_config").select("*").eq("venue_id", venueId);
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => ({
        id: String(row.id),
        venueId: String(row.venue_id),
        role: String(row.role),
        department: String(row.department ?? "Floor"),
        metric: row.metric as "covers" | "orders",
        coversPerStaffHour: Number(row.covers_per_staff_hour),
        hourlyCost: Number(row.hourly_cost),
        enabled: row.enabled !== false,
        isCustom: Boolean(row.is_custom),
      }));
    },
    async listStaff(venueId) {
      await assertVenue(venueId);
      const { data, error } = await client.from("staff").select("*").eq("venue_id", venueId);
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => ({
        id: String(row.id),
        venueId,
        name: String(row.name ?? ""),
        role: String(row.role),
        hourlyCost: Number(row.hourly_cost),
        maxWeeklyHours: Number(row.max_weekly_hours),
        skills: (row.skills as string[]) ?? [],
      })) satisfies StaffMember[];
    },
    async listShifts(venueId, from, to) {
      await assertVenue(venueId);
      const { data, error } = await client
        .from("shifts")
        .select("*")
        .eq("venue_id", venueId)
        .lt("starts_at", to)
        .gt("ends_at", from);
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => ({
        id: String(row.id),
        venueId,
        staffId: row.staff_id ? String(row.staff_id) : null,
        staffName: String(row.staff_name ?? row.role),
        role: String(row.role),
        startsAt: String(row.starts_at),
        endsAt: String(row.ends_at),
        status: row.status as Shift["status"],
      }));
    },
    async listSales(venueId, from, to) {
      await assertVenue(venueId);
      let query = client.from("sales_facts").select("*").eq("venue_id", venueId);
      if (from) query = query.gte("ts", from);
      if (to) query = query.lt("ts", to);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => ({
        id: String(row.id),
        venueId,
        ts: String(row.ts),
        channel: String(row.channel),
        covers: Number(row.covers),
        orderCount: Number(row.order_count),
        orderValue: Number(row.order_value),
      })) satisfies SalesFact[];
    },
    async insertSales(rows) {
      if (!rows.length) return 0;
      await assertVenue(rows[0].venueId);
      const { error } = await client.from("sales_facts").insert(
        rows.map((row) => ({
          id: row.id,
          venue_id: row.venueId,
          ts: row.ts,
          channel: row.channel,
          covers: row.covers,
          order_count: row.orderCount,
          order_value: row.orderValue,
        })),
      );
      if (error) throw new Error(error.message);
      return rows.length;
    },
    async listReservations(venueId, from, to) {
      await assertVenue(venueId);
      const { data, error } = await client
        .from("reservations")
        .select("*")
        .eq("venue_id", venueId)
        .gte("slot_start", from)
        .lt("slot_start", to);
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => ({
        id: String(row.id),
        venueId,
        slotStart: String(row.slot_start),
        partySize: Number(row.party_size),
        status: String(row.status),
        source: String(row.source ?? ""),
        createdAt: String(row.created_at),
      })) satisfies Reservation[];
    },
    async insertReservations(rows) {
      if (!rows.length) return 0;
      await assertVenue(rows[0].venueId);
      const { error } = await client.from("reservations").insert(
        rows.map((row) => ({
          id: row.id,
          venue_id: row.venueId,
          slot_start: row.slotStart,
          party_size: row.partySize,
          status: row.status,
          source: row.source,
          created_at: row.createdAt,
        })),
      );
      if (error) throw new Error(error.message);
      return rows.length;
    },
    async listSignals(venueId, from, to) {
      await assertVenue(venueId);
      const { data, error } = await client
        .from("external_signals")
        .select("*")
        .eq("venue_id", venueId)
        .lt("starts_at", to)
        .gt("ends_at", from);
      if (error) throw new Error(error.message);
      return (data ?? []).map(asSignal);
    },
    async replaceSignals(venueId, kind, from, to, rows) {
      await assertVenue(venueId);
      const { error: deleteError } = await client
        .from("external_signals")
        .delete()
        .eq("venue_id", venueId)
        .eq("kind", kind)
        .lt("starts_at", to)
        .gt("ends_at", from);
      if (deleteError) throw new Error(deleteError.message);
      if (!rows.length) return;
      const { error } = await client.from("external_signals").insert(rows.map(signalRow));
      if (error) throw new Error(error.message);
    },
    async addSignal(signal) {
      await assertVenue(signal.venueId);
      const { error } = await client.from("external_signals").insert(signalRow(signal));
      if (error) throw new Error(error.message);
      return signal;
    },
    async listForecasts(venueId, from, to) {
      await assertVenue(venueId);
      const { data, error } = await client
        .from("forecasts")
        .select("*")
        .eq("venue_id", venueId)
        .gte("hour_start", from)
        .lt("hour_start", to);
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => ({
        id: String(row.id),
        venueId,
        hourStart: String(row.hour_start),
        metric: row.metric as Forecast["metric"],
        predicted: Number(row.predicted),
        lower: Number(row.lower),
        upper: Number(row.upper),
        modelVersion: String(row.model_version),
        drivers: (row.drivers as Forecast["drivers"]) ?? {},
      }));
    },
    async replaceForecasts(venueId, from, to, rows) {
      await assertVenue(venueId);
      const { error: deleteError } = await client
        .from("forecasts")
        .delete()
        .eq("venue_id", venueId)
        .gte("hour_start", from)
        .lt("hour_start", to);
      if (deleteError) throw new Error(deleteError.message);
      if (!rows.length) return;
      const { error } = await client.from("forecasts").insert(
        rows.map((row) => ({
          id: row.id,
          venue_id: row.venueId,
          hour_start: row.hourStart,
          metric: row.metric,
          predicted: row.predicted,
          lower: row.lower,
          upper: row.upper,
          model_version: row.modelVersion,
          drivers: row.drivers,
        })),
      );
      if (error) throw new Error(error.message);
    },
    async listRecommendations(venueId, from, to) {
      await assertVenue(venueId);
      const { data, error } = await client
        .from("recommendations")
        .select("*")
        .eq("venue_id", venueId)
        .gte("hour_start", from)
        .lt("hour_start", to);
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => asRecommendation(row as Row));
    },
    async replaceRecommendations(venueId, from, to, rows) {
      await assertVenue(venueId);
      const { error: deleteError } = await client
        .from("recommendations")
        .delete()
        .eq("venue_id", venueId)
        .gte("hour_start", from)
        .lt("hour_start", to);
      if (deleteError) throw new Error(deleteError.message);
      if (!rows.length) return;
      const { error } = await client.from("recommendations").insert(
        rows.map((row) => ({
          id: row.id,
          venue_id: row.venueId,
          hour_start: row.hourStart,
          role: row.role,
          required: row.required,
          scheduled: row.scheduled,
          delta: row.delta,
          cost_impact: row.costImpact,
          hourly_cost: row.hourlyCost,
          predicted_covers: row.predictedCovers,
          reasons: row.reasons,
          status: row.status,
        })),
      );
      if (error) throw new Error(error.message);
    },
    async getRecommendation(id) {
      const ids = await venueIds();
      const { data, error } = await client
        .from("recommendations")
        .select("*")
        .eq("id", id)
        .in("venue_id", ids)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? asRecommendation(data as Row) : null;
    },
    async actOnRecommendation(input) {
      const current = await store.getRecommendation(input.id);
      if (!current) throw new Error("Recommendation not found");
      const next = { ...current, status: input.action };
      if (input.action === "edited") {
        if (input.editedRequired == null || input.editedRequired < 0) {
          throw new Error("An edited headcount is required");
        }
        next.required = input.editedRequired;
        next.delta = input.editedRequired - next.scheduled;
        next.costImpact = next.delta * next.hourlyCost;
      }
      const { error } = await client
        .from("recommendations")
        .update({
          required: next.required,
          delta: next.delta,
          cost_impact: next.costImpact,
          status: next.status,
        })
        .eq("id", next.id);
      if (error) throw new Error(error.message);
      const { error: actionError } = await client.from("recommendation_actions").insert({
        recommendation_id: next.id,
        action: input.action,
        edited_required: input.editedRequired ?? null,
        notes: input.notes ?? null,
      });
      if (actionError) throw new Error(actionError.message);
      return next;
    },
    async listAlerts(venueId) {
      await assertVenue(venueId);
      const { data, error } = await client
        .from("alerts")
        .select("*")
        .eq("venue_id", venueId)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []).map(asAlert);
    },
    async replaceUnreadAlerts(venueId, rows) {
      await assertVenue(venueId);
      const { error: deleteError } = await client
        .from("alerts")
        .delete()
        .eq("venue_id", venueId)
        .is("read_at", null);
      if (deleteError) throw new Error(deleteError.message);
      if (!rows.length) return;
      const { error } = await client.from("alerts").insert(
        rows.map((row) => ({
          id: row.id,
          venue_id: row.venueId,
          severity: row.severity,
          message: row.message,
          read_at: row.readAt,
          created_at: row.createdAt,
        })),
      );
      if (error) throw new Error(error.message);
    },
    async markAlertRead(id) {
      const ids = await venueIds();
      const { error } = await client
        .from("alerts")
        .update({ read_at: new Date().toISOString() })
        .eq("id", id)
        .in("venue_id", ids);
      if (error) throw new Error(error.message);
    },
    async listImportJobs(venueId) {
      await assertVenue(venueId);
      const { data, error } = await client
        .from("import_jobs")
        .select("*")
        .eq("venue_id", venueId)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []).map(asImport);
    },
    async saveRole(config) {
      await assertVenue(config.venueId);
      const { error } = await client.from("venue_role_config").upsert({
        id: config.id,
        venue_id: config.venueId,
        role: config.role,
        department: config.department,
        metric: config.metric,
        covers_per_staff_hour: config.coversPerStaffHour,
        hourly_cost: config.hourlyCost,
        enabled: config.enabled,
        is_custom: config.isCustom,
      });
      if (error) throw new Error(error.message);
      return config;
    },
    async saveStaff(member) {
      await assertVenue(member.venueId);
      const { error } = await client.from("staff").upsert({
        id: member.id,
        venue_id: member.venueId,
        name: member.name,
        role: member.role,
        hourly_cost: member.hourlyCost,
        max_weekly_hours: member.maxWeeklyHours,
        skills: member.skills,
      });
      if (error) throw new Error(error.message);
      return member;
    },
    async replaceDraftShifts(venueId, from, to, rows) {
      await assertVenue(venueId);
      const { error: deleteError } = await client
        .from("shifts")
        .delete()
        .eq("venue_id", venueId)
        .eq("status", "draft")
        .lt("starts_at", to)
        .gt("ends_at", from);
      if (deleteError) throw new Error(deleteError.message);
      if (!rows.length) return;
      const { error } = await client.from("shifts").insert(
        rows.map((row) => ({
          id: row.id,
          venue_id: row.venueId,
          staff_id: row.staffId,
          staff_name: row.staffName,
          role: row.role,
          starts_at: row.startsAt,
          ends_at: row.endsAt,
          status: row.status,
        })),
      );
      if (error) throw new Error(error.message);
    },
    async createImportJob(job) {
      await assertVenue(job.venueId);
      const { error } = await client.from("import_jobs").insert({
        id: job.id,
        venue_id: job.venueId,
        filename: job.filename,
        kind: job.kind,
        mapping: job.mapping,
        status: job.status,
        row_count: job.rowCount,
        errors: job.errors,
        storage_path: job.storagePath ?? null,
        created_at: job.createdAt,
      });
      if (error) throw new Error(error.message);
      return job;
    },
    async saveImportFile(venueId, filename, csv) {
      await assertVenue(venueId);
      const path = `${venueId}/${Date.now()}-${filename.replace(/[^\w.-]+/g, "_")}`;
      const { error } = await client.storage.from("imports").upload(path, Buffer.from(csv), {
        contentType: "text/csv",
        upsert: false,
      });
      if (error) throw new Error(error.message);
      return path;
    },
  };

  return store;
}

function asSignal(row: Row): ExternalSignal {
  return {
    id: String(row.id),
    venueId: String(row.venue_id),
    kind: row.kind as SignalKind,
    startsAt: String(row.starts_at),
    endsAt: String(row.ends_at),
    label: String(row.label),
    impactMultiplier: Number(row.impact_multiplier),
    payload: (row.payload as ExternalSignal["payload"]) ?? {},
  };
}

function signalRow(signal: ExternalSignal) {
  return {
    id: signal.id,
    venue_id: signal.venueId,
    kind: signal.kind,
    starts_at: signal.startsAt,
    ends_at: signal.endsAt,
    label: signal.label,
    impact_multiplier: signal.impactMultiplier,
    payload: signal.payload,
  };
}

function asAlert(row: Row): Alert {
  return {
    id: String(row.id),
    venueId: String(row.venue_id),
    severity: row.severity as Alert["severity"],
    message: String(row.message),
    readAt: row.read_at ? String(row.read_at) : null,
    createdAt: String(row.created_at),
  };
}

function asImport(row: Row): ImportJob {
  return {
    id: String(row.id),
    venueId: String(row.venue_id),
    filename: String(row.filename),
    kind: row.kind as ImportJob["kind"],
    mapping: (row.mapping as Record<string, string>) ?? {},
    status: String(row.status),
    rowCount: Number(row.row_count),
    errors: (row.errors as string[]) ?? [],
    storagePath: row.storage_path ? String(row.storage_path) : undefined,
    createdAt: String(row.created_at),
  };
}

export async function getStore(): Promise<DataStore> {
  await connection();
  const { memoryStore } = await import("./memory");
  if (process.env.DATA_SOURCE !== "supabase") return memoryStore;
  const supabase = await createUserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in required");
  const admin = adminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!profile) throw new Error("This account is not linked to an organization yet");
  return createSupabaseStore(admin, String(profile.organization_id));
}

export async function getSystemStore(): Promise<DataStore> {
  await connection();
  const { memoryStore } = await import("./memory");
  if (process.env.DATA_SOURCE !== "supabase") return memoryStore;
  return createSupabaseStore(adminClient(), null);
}
