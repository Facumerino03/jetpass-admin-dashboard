import type { ValidationOperator, ValidationResult } from "@/types/api";

export const OPERATOR_LABELS: Record<ValidationOperator, string> = {
  eq: "igual a",
  neq: "distinto de",
  gt: "mayor que",
  gte: "mayor o igual a",
  lt: "menor que",
  lte: "menor o igual a",
  contains: "contiene",
  not_contains: "no contiene",
  is_present: "está presente",
  is_absent: "está ausente",
};

export const RESULT_LABELS: Record<ValidationResult, string> = {
  approve: "Aprobar",
  warn: "Advertir",
  reject: "Rechazar",
};

export const OVERALL_LABELS: Record<
  "approved" | "warned" | "rejected",
  string
> = {
  approved: "Aprobado",
  warned: "Advertencia",
  rejected: "Rechazado",
};
