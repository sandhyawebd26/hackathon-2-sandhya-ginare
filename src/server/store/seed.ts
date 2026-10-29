import type { Database } from "@/lib/domain";

export const STORE_VERSION = 4;

export function createSeed(): Database {
  return {
    version: STORE_VERSION,
    users: [],
    venues: [],
    roleConfigs: [],
    staff: [],
    shifts: [],
    sales: [],
    reservations: [],
    signals: [],
    forecasts: [],
    recommendations: [],
    recommendationOverrides: [],
    actions: [],
    alerts: [],
    imports: [],
  };
}
