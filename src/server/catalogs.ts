import type { Metric, VenueType } from "@/lib/domain";

export type RoleTemplate = {
  role: string;
  department: string;
  metric: Metric;
  coversPerStaffHour: number;
  hourlyCost: number;
  starterCount: number;
};

const restaurant: RoleTemplate[] = [
  { role: "Head chef", department: "Kitchen", metric: "orders", coversPerStaffHour: 80, hourlyCost: 28, starterCount: 1 },
  { role: "Sous chef", department: "Kitchen", metric: "orders", coversPerStaffHour: 60, hourlyCost: 24, starterCount: 1 },
  { role: "Chef de partie", department: "Kitchen", metric: "orders", coversPerStaffHour: 35, hourlyCost: 20, starterCount: 2 },
  { role: "Demi chef de partie", department: "Kitchen", metric: "orders", coversPerStaffHour: 28, hourlyCost: 18, starterCount: 1 },
  { role: "Commis", department: "Kitchen", metric: "orders", coversPerStaffHour: 22, hourlyCost: 15, starterCount: 2 },
  { role: "Pastry chef", department: "Kitchen", metric: "orders", coversPerStaffHour: 40, hourlyCost: 20, starterCount: 1 },
  { role: "Kitchen porter", department: "Kitchen", metric: "covers", coversPerStaffHour: 50, hourlyCost: 14, starterCount: 1 },
  { role: "Restaurant manager", department: "Floor", metric: "covers", coversPerStaffHour: 200, hourlyCost: 26, starterCount: 1 },
  { role: "Head waiter", department: "Floor", metric: "covers", coversPerStaffHour: 40, hourlyCost: 18, starterCount: 1 },
  { role: "Waiter", department: "Floor", metric: "covers", coversPerStaffHour: 18, hourlyCost: 15, starterCount: 6 },
  { role: "Runner", department: "Floor", metric: "covers", coversPerStaffHour: 30, hourlyCost: 14, starterCount: 2 },
  { role: "Host", department: "Floor", metric: "covers", coversPerStaffHour: 60, hourlyCost: 15, starterCount: 1 },
  { role: "Bartender", department: "Bar", metric: "covers", coversPerStaffHour: 70, hourlyCost: 17, starterCount: 2 },
  { role: "Sommelier", department: "Bar", metric: "covers", coversPerStaffHour: 80, hourlyCost: 22, starterCount: 1 },
  { role: "Steward", department: "Back of house", metric: "covers", coversPerStaffHour: 90, hourlyCost: 14, starterCount: 1 },
  { role: "Dishwasher", department: "Back of house", metric: "covers", coversPerStaffHour: 100, hourlyCost: 13, starterCount: 1 },
];

const cafe: RoleTemplate[] = [
  { role: "Cafe manager", department: "Floor", metric: "covers", coversPerStaffHour: 80, hourlyCost: 20, starterCount: 1 },
  { role: "Barista", department: "Bar", metric: "covers", coversPerStaffHour: 25, hourlyCost: 15, starterCount: 3 },
  { role: "Waiter", department: "Floor", metric: "covers", coversPerStaffHour: 20, hourlyCost: 14, starterCount: 3 },
  { role: "Baker", department: "Kitchen", metric: "orders", coversPerStaffHour: 30, hourlyCost: 16, starterCount: 1 },
  { role: "Kitchen hand", department: "Kitchen", metric: "orders", coversPerStaffHour: 25, hourlyCost: 13, starterCount: 1 },
  { role: "Cashier", department: "Floor", metric: "covers", coversPerStaffHour: 40, hourlyCost: 14, starterCount: 1 },
];

const hotel: RoleTemplate[] = [
  { role: "Front desk agent", department: "Front office", metric: "covers", coversPerStaffHour: 30, hourlyCost: 16, starterCount: 2 },
  { role: "Concierge", department: "Front office", metric: "covers", coversPerStaffHour: 40, hourlyCost: 17, starterCount: 1 },
  { role: "Housekeeping attendant", department: "Housekeeping", metric: "covers", coversPerStaffHour: 12, hourlyCost: 14, starterCount: 4 },
  { role: "Housekeeping supervisor", department: "Housekeeping", metric: "covers", coversPerStaffHour: 40, hourlyCost: 18, starterCount: 1 },
  { role: "Breakfast chef", department: "Kitchen", metric: "orders", coversPerStaffHour: 25, hourlyCost: 18, starterCount: 1 },
  { role: "Waiter", department: "Food and beverage", metric: "covers", coversPerStaffHour: 18, hourlyCost: 15, starterCount: 3 },
  { role: "Night auditor", department: "Front office", metric: "covers", coversPerStaffHour: 50, hourlyCost: 16, starterCount: 1 },
  { role: "Maintenance", department: "Engineering", metric: "covers", coversPerStaffHour: 80, hourlyCost: 17, starterCount: 1 },
];

export function roleCatalog(type: VenueType): RoleTemplate[] {
  if (type === "cafe") return cafe;
  if (type === "hotel") return hotel;
  return restaurant;
}

export function serviceHours(type: VenueType) {
  if (type === "cafe") return { openingHour: 8, closingHour: 18, capacity: 40 };
  if (type === "hotel") return { openingHour: 7, closingHour: 23, capacity: 120 };
  return { openingHour: 12, closingHour: 23, capacity: 80 };
}

const FIRST_NAMES = [
  "Alex",
  "Jordan",
  "Riley",
  "Casey",
  "Morgan",
  "Taylor",
  "Quinn",
  "Avery",
  "Parker",
  "Drew",
  "Reese",
  "Sam",
  "Cameron",
  "Hayden",
  "Rowan",
  "Elliot",
  "Noah",
  "Mia",
  "Leo",
  "Nora",
];

export function starterName(index: number) {
  return FIRST_NAMES[index % FIRST_NAMES.length];
}
