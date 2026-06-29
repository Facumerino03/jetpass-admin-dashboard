import { apiRequest } from "./client";
import type {
  ValidationField,
  ValidationCriterion,
  ValidationBlock,
  ValidationRunRequest,
  ValidationRunResult,
} from "@/types/api";

export async function listValidationFields(): Promise<ValidationField[]> {
  return apiRequest<ValidationField[]>("/validation/fields");
}

export async function listCriteria(): Promise<ValidationCriterion[]> {
  return apiRequest<ValidationCriterion[]>("/validation/criteria");
}

export interface CreateCriterionInput {
  name: string;
  field_path: string;
  operator: ValidationCriterion["operator"];
  expected_value: string | null;
  result_on_pass: ValidationCriterion["result_on_pass"];
  result_on_fail: ValidationCriterion["result_on_fail"];
  pass_message?: string | null;
  fail_message?: string | null;
}

export async function createCriterion(
  data: CreateCriterionInput
): Promise<ValidationCriterion> {
  return apiRequest<ValidationCriterion>("/validation/criteria", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCriterion(
  id: string,
  data: Partial<CreateCriterionInput>
): Promise<ValidationCriterion> {
  return apiRequest<ValidationCriterion>(`/validation/criteria/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteCriterion(id: string): Promise<void> {
  return apiRequest<void>(`/validation/criteria/${id}`, { method: "DELETE" });
}

export interface CreateBlockInput {
  name: string;
  criterion_ids: string[];
}

export async function createBlock(
  data: CreateBlockInput
): Promise<ValidationBlock> {
  return apiRequest<ValidationBlock>("/validation/blocks", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function listBlocks(): Promise<ValidationBlock[]> {
  return apiRequest<ValidationBlock[]>("/validation/blocks");
}

export async function updateBlock(
  id: string,
  data: Partial<CreateBlockInput & { is_active: boolean }>
): Promise<ValidationBlock> {
  return apiRequest<ValidationBlock>(`/validation/blocks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteBlock(id: string): Promise<void> {
  return apiRequest<void>(`/validation/blocks/${id}`, { method: "DELETE" });
}

export async function runValidation(
  data: ValidationRunRequest
): Promise<ValidationRunResult> {
  return apiRequest<ValidationRunResult>("/validation/run", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
