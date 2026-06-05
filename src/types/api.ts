// src/types/api.ts

// ── Enums ──
export type FlightPlanStatus =
  | "draft"
  | "filed"
  | "pending_approval"
  | "accepted"
  | "rejected"
  | "active"
  | "closed"
  | "cancelled";

export type FlightRules = "V" | "I" | "Y" | "Z";

export type FlightType = "G" | "S" | "N" | "M" | "X";

export type WakeTurbulenceCat = "L" | "M" | "H" | "J";

export type FlightPlanApprovalActor =
  | "pilot"
  | "authority"
  | "destination_aerodrome_operator";

export type FlightPlanApprovalStatus = "pending" | "approved" | "rejected";

// ── User ──
export interface UserPublic {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Auth ──
export interface LoginRequest {
  email: string;
  password: string;
  device_name?: string | null;
}

export interface AuthTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: UserPublic;
}

export interface RefreshRequest {
  refresh_token: string;
}

// ── Flight Plan List ──
export interface FlightPlanPublic {
  id: string;
  pilot_user_id: string;
  pilot: PilotSummary;
  aircraft_id: string | null;
  status: FlightPlanStatus;
  flight_rules: FlightRules | null;
  flight_type: FlightType | null;
  departure_aerodrome_icao: string;
  departure_eobt_utc: string;
  destination_aerodrome_icao: string;
  alternate1_aerodrome_icao: string;
  alternate2_aerodrome_icao: string;
  cruising_speed: string | null;
  cruising_level: string | null;
  route: string | null;
  rule_change_point: string | null;
  total_eet: string | null;
  other_information: string | null;
  endurance: string | null;
  persons_on_board: number | null;
  aircraft_identification_snapshot: string | null;
  aircraft_type_designator_snapshot: string | null;
  wake_turbulence_category_snapshot: WakeTurbulenceCat | null;
  equipment_com_nav_snapshot: string | null;
  equipment_surveillance_snapshot: string | null;
  emergency_radio_snapshot: string | null;
  survival_equipment_snapshot: string | null;
  life_jackets_snapshot: string | null;
  dinghies_number_snapshot: number | null;
  dinghies_capacity_snapshot: number | null;
  dinghies_cover_snapshot: boolean | null;
  dinghies_color_snapshot: string | null;
  color_and_markings_snapshot: string | null;
  aircraft_snapshot_confirmed_at: string | null;
  created_at: string;
  updated_at: string;
  approvals: FlightPlanApproval[];
}

export interface PilotSummary {
  id: string;
  first_name: string;
  last_name: string;
}

export interface FlightPlanApproval {
  id: string;
  actor: FlightPlanApprovalActor;
  criterion: string;
  status: FlightPlanApprovalStatus;
  approved_by_user_id: string | null;
  rejected_by_user_id: string | null;
  reason: string | null;
  decided_at: string | null;
}

export interface FlightPlanStatusHistory {
  id: string;
  from_status: FlightPlanStatus | null;
  to_status: FlightPlanStatus;
  updated_by_user_id: string | null;
  reason: string | null;
  created_at: string;
}

// ── Flight Plan Detail ──
export interface FlightPlanDetail extends FlightPlanPublic {
  approvals: FlightPlanApproval[];
  status_history: FlightPlanStatusHistory[];
}

// ── Responses ──
export interface FlightPlanDecisionRequest {
  reason: string | null;
}

export interface FlightPlanSubmitResponse {
  id: string;
  status: FlightPlanStatus;
}

// ── Errors ──
export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface HTTPValidationError {
  detail: ValidationError[];
}
