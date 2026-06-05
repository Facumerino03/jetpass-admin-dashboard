const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

export function setOnUnauthorized(callback: () => void) {
  onUnauthorized = callback;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public validationErrors?: { loc: (string | number)[]; msg: string }[]
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401 && onUnauthorized) {
    onUnauthorized();
    throw new ApiError(401, "No autorizado");
  }

  if (!response.ok) {
    let validationErrors;
    try {
      const body = await response.json();
      validationErrors = body.detail;
    } catch {
      // no JSON body
    }
    throw new ApiError(response.status, `Error ${response.status}`, validationErrors);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
