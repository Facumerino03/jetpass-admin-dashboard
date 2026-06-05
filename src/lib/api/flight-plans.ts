import type {
  FlightPlanPublic,
  FlightPlanDetail,
  FlightPlanSubmitResponse,
} from "@/types/api";
import { apiRequest } from "./client";

export async function listFlightPlans(): Promise<FlightPlanPublic[]> {
  return apiRequest<FlightPlanPublic[]>("/flight-plans");
}

export async function getFlightPlan(id: string): Promise<FlightPlanDetail> {
  return apiRequest<FlightPlanDetail>(`/flight-plans/${id}`);
}

export async function approveFlightPlan(
  id: string
): Promise<FlightPlanSubmitResponse> {
  return apiRequest<FlightPlanSubmitResponse>(`/flight-plans/${id}/approve`, {
    method: "POST",
  });
}

export async function rejectFlightPlan(
  id: string,
  reason: string
): Promise<FlightPlanSubmitResponse> {
  return apiRequest<FlightPlanSubmitResponse>(`/flight-plans/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}
