export type VenueType = "restaurant" | "cafe" | "hotel";
export type Metric = "covers" | "orders";
export type SignalKind = "weather" | "holiday" | "event";
export type RecommendationStatus = "pending" | "accepted" | "edited" | "ignored";
export type ShiftStatus = "draft" | "published" | "swapped";

export type Venue = {
  id: string;
  organizationId: string;
  name: string;
  venueType: VenueType;
  timezone: string;
  countryCode: string;
  city: string;
  latitude: number;
  longitude: number;
  capacity: number;
  currency: string;
  openingHour: number;
  closingHour: number;
};

export type RoleConfig = {
  id: string;
  venueId: string;
  role: string;
  department: string;
  metric: Metric;
  coversPerStaffHour: number;
  hourlyCost: number;
  enabled: boolean;
  isCustom: boolean;
};

export type Account = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  passwordSalt: string;
  venueIds: string[];
};

export type StaffMember = {
  id: string;
  venueId: string;
  name: string;
  role: string;
  hourlyCost: number;
  maxWeeklyHours: number;
  skills: string[];
};

export type Shift = {
  id: string;
  venueId: string;
  staffId: string | null;
  staffName: string;
  role: string;
  startsAt: string;
  endsAt: string;
  status: ShiftStatus;
};

export type SalesFact = {
  id: string;
  venueId: string;
  ts: string;
  channel: string;
  covers: number;
  orderCount: number;
  orderValue: number;
};

export type Reservation = {
  id: string;
  venueId: string;
  slotStart: string;
  partySize: number;
  status: string;
  source: string;
  createdAt: string;
};

export type ExternalSignal = {
  id: string;
  venueId: string;
  kind: SignalKind;
  startsAt: string;
  endsAt: string;
  label: string;
  impactMultiplier: number;
  payload: Record<string, string | number>;
};

export type Reason = {
  code: string;
  label: string;
  detail: string;
};

export type Forecast = {
  id: string;
  venueId: string;
  hourStart: string;
  metric: Metric;
  predicted: number;
  lower: number;
  upper: number;
  modelVersion: string;
  drivers: Record<string, string | number>;
};

export type Recommendation = {
  id: string;
  venueId: string;
  hourStart: string;
  role: string;
  required: number;
  scheduled: number;
  delta: number;
  costImpact: number;
  hourlyCost: number;
  predictedCovers: number;
  reasons: Reason[];
  status: RecommendationStatus;
};

export type RecommendationAction = {
  id: string;
  recommendationId: string;
  action: Exclude<RecommendationStatus, "pending">;
  editedRequired: number | null;
  notes: string | null;
  createdAt: string;
};

export type Alert = {
  id: string;
  venueId: string;
  severity: "high" | "medium" | "low";
  message: string;
  readAt: string | null;
  createdAt: string;
};

export type ImportJob = {
  id: string;
  venueId: string;
  filename: string;
  kind: "sales" | "reservations";
  mapping: Record<string, string>;
  status: string;
  rowCount: number;
  errors: string[];
  storagePath?: string;
  createdAt: string;
};

export type Database = {
  version: number;
  users: Account[];
  venues: Venue[];
  roleConfigs: RoleConfig[];
  staff: StaffMember[];
  shifts: Shift[];
  sales: SalesFact[];
  reservations: Reservation[];
  signals: ExternalSignal[];
  forecasts: Forecast[];
  recommendations: Recommendation[];
  actions: RecommendationAction[];
  alerts: Alert[];
  imports: ImportJob[];
};

export const CASA_VERDE_ID = "11111111-1111-4111-8111-111111111101";
export const TABERNA_SOL_ID = "22222222-2222-4222-8222-222222222201";

export function gapTone(delta: number): "optimal" | "under" | "over" {
  if (delta > 0) return "under";
  if (delta < 0) return "over";
  return "optimal";
}
