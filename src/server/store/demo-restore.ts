import type { ExternalSignal, RoleConfig, StaffMember, Venue } from "@/lib/domain";
import { insertVenue, memoryStore } from "@/server/store/memory";

type MemoryGlobal = typeof globalThis & {
  __shiftsense?: {
    venues: Venue[];
    roleConfigs: RoleConfig[];
    staff: StaffMember[];
    signals: ExternalSignal[];
  };
};

function state() {
  return (globalThis as MemoryGlobal).__shiftsense;
}

export function restoreVenueSnapshot(
  venue: Venue,
  roleConfigs: RoleConfig[],
  staff: StaffMember[],
  events: ExternalSignal[],
) {
  void memoryStore.listVenues();
  const db = state();
  if (!db) return;
  if (!db.venues.some((row) => row.id === venue.id)) insertVenue(venue);
  db.roleConfigs = db.roleConfigs.filter((row) => row.venueId !== venue.id).concat(roleConfigs);
  db.staff = db.staff.filter((row) => row.venueId !== venue.id).concat(staff);
  db.signals = db.signals.filter((row) => !(row.venueId === venue.id && row.kind === "event")).concat(events);
}
