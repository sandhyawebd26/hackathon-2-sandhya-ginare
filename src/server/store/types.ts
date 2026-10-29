import type {
  Alert,
  Database,
  RoleConfig,
  StaffMember,
  ExternalSignal,
  Forecast,
  ImportJob,
  Recommendation,
  RecommendationAction,
  RecommendationOverride,
  Reservation,
  SalesFact,
  Shift,
  SignalKind,
  Venue,
} from "@/lib/domain";

export type ActionInput = {
  id: string;
  action: RecommendationAction["action"];
  editedRequired?: number;
  notes?: string;
};

export type DataStore = {
  kind: "demo" | "supabase";
  listVenues(): Promise<Venue[]>;
  getVenue(id: string): Promise<Venue | null>;
  listRoleConfigs(venueId: string): Promise<Database["roleConfigs"]>;
  listStaff(venueId: string): Promise<StaffMember[]>;
  listShifts(venueId: string, from: string, to: string): Promise<Shift[]>;
  listSales(venueId: string, from?: string, to?: string): Promise<SalesFact[]>;
  insertSales(rows: SalesFact[]): Promise<number>;
  listReservations(venueId: string, from: string, to: string): Promise<Reservation[]>;
  insertReservations(rows: Reservation[]): Promise<number>;
  listSignals(venueId: string, from: string, to: string): Promise<ExternalSignal[]>;
  replaceSignals(
    venueId: string,
    kind: SignalKind,
    from: string,
    to: string,
    rows: ExternalSignal[],
  ): Promise<void>;
  addSignal(signal: ExternalSignal): Promise<ExternalSignal>;
  listForecasts(venueId: string, from: string, to: string): Promise<Forecast[]>;
  replaceForecasts(venueId: string, from: string, to: string, rows: Forecast[]): Promise<void>;
  listRecommendations(venueId: string, from: string, to: string): Promise<Recommendation[]>;
  replaceRecommendations(
    venueId: string,
    from: string,
    to: string,
    rows: Recommendation[],
  ): Promise<void>;
  getRecommendation(id: string): Promise<Recommendation | null>;
  listRecommendationOverrides(venueId: string): Promise<RecommendationOverride[]>;
  saveRecommendationOverride(row: RecommendationOverride): Promise<void>;
  actOnRecommendation(input: ActionInput): Promise<Recommendation>;
  listAlerts(venueId: string): Promise<Alert[]>;
  replaceUnreadAlerts(venueId: string, rows: Alert[]): Promise<void>;
  markAlertRead(id: string): Promise<void>;
  saveRole(config: RoleConfig): Promise<RoleConfig>;
  saveStaff(member: StaffMember): Promise<StaffMember>;
  replaceDraftShifts(venueId: string, from: string, to: string, rows: Shift[]): Promise<void>;
  listImportJobs(venueId: string): Promise<ImportJob[]>;
  createImportJob(job: ImportJob): Promise<ImportJob>;
  saveImportFile?(venueId: string, filename: string, csv: string): Promise<string>;
};
