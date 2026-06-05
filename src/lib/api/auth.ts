import type { AuthTokenResponse, LoginRequest } from "@/types/api";
import { apiRequest } from "./client";

export async function login(data: LoginRequest): Promise<AuthTokenResponse> {
  return apiRequest<AuthTokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function refreshToken(refreshToken: string): Promise<AuthTokenResponse> {
  return apiRequest<AuthTokenResponse>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

export async function logout(refreshToken: string): Promise<void> {
  await apiRequest<{ message: string }>("/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}
