import type { FlightRules, FlightType, FlightPlanStatus, FlightPlanApprovalStatus, FlightPlanApprovalActor } from "@/types/api";

export const FLIGHT_RULES_LABELS: Record<FlightRules, string> = {
  V: "VFR",
  I: "IFR",
  Y: "IFR con cambio a VFR",
  Z: "VFR con cambio a IFR",
};

export const FLIGHT_TYPE_LABELS: Record<FlightType, string> = {
  G: "Aviación General",
  S: "Transporte Aéreo Regular",
  N: "Transporte Aéreo No Regular",
  M: "Militar",
  X: "Otro",
};

export const FLIGHT_PLAN_STATUS_LABELS: Record<FlightPlanStatus, string> = {
  draft: "Borrador",
  filed: "Archivado",
  pending_approval: "Pendiente",
  accepted: "Aceptado",
  rejected: "Rechazado",
  active: "Activo",
  closed: "Cerrado",
  cancelled: "Cancelado",
};

export const APPROVAL_STATUS_LABELS: Record<FlightPlanApprovalStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
};

export const APPROVAL_ACTOR_LABELS: Record<FlightPlanApprovalActor, string> = {
  pilot: "Piloto",
  authority: "Autoridad ATC",
  destination_aerodrome_operator: "Operador de Aeródromo Destino",
};

export function getFlightRulesLabel(rules: FlightRules | null | undefined): string {
  if (!rules) return "—";
  return FLIGHT_RULES_LABELS[rules] ?? rules;
}

export function getFlightTypeLabel(type: FlightType | null | undefined): string {
  if (!type) return "—";
  return FLIGHT_TYPE_LABELS[type] ?? type;
}

export function getFlightPlanStatusLabel(status: FlightPlanStatus): string {
  return FLIGHT_PLAN_STATUS_LABELS[status] ?? status;
}

export function getApprovalStatusLabel(status: FlightPlanApprovalStatus): string {
  return APPROVAL_STATUS_LABELS[status] ?? status;
}

export function getApprovalActorLabel(actor: FlightPlanApprovalActor): string {
  return APPROVAL_ACTOR_LABELS[actor] ?? actor;
}
