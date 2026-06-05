# Authority Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js App Router dashboard where aeronautical authorities can view, approve, and reject pending flight plans.

**Architecture:** Next.js 15 App Router with a sidebar shell layout. TanStack Query v5 manages server state and cache. A React Context-based Auth system stores JWT tokens in memory and handles automatic token refresh. shadcn/ui provides the component library on top of Tailwind CSS. The app uses a thin fetch wrapper as HTTP client with a 401 interceptor.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query v5, React Hook Form + Zod, sonner (toasts), date-fns

---

## Task 1: Scaffold Next.js project with shadcn/ui

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `components.json`, `src/app/globals.css`, `src/app/layout.tsx`

- [ ] **Step 1: Create Next.js project**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-turbopack
```
Expected: Project scaffolded with `package.json`, `src/app/`, etc.

- [ ] **Step 2: Initialize shadcn/ui**

```bash
npx shadcn@latest init
```
Select: TypeScript, Default style, Neutral base color, CSS variables (yes)

- [ ] **Step 3: Install shadcn components**

```bash
npx shadcn@latest add button table dialog badge textarea skeleton card separator breadcrumb input label dropdown-menu avatar sonner
```

- [ ] **Step 4: Install application dependencies**

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools react-hook-form @hookform/resolvers zod date-fns
```

- [ ] **Step 5: Install dev dependencies**

```bash
npm install -D prettier
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "chore: scaffold Next.js project with shadcn/ui and dependencies"
```

---

## Task 2: Create TypeScript types from OpenAPI

**Files:**
- Create: `src/types/api.ts`

- [ ] **Step 1: Write the types file**

```typescript
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
}

export interface PilotSummary {
  id: string;
  first_name: string;
  last_name: string;
}

// ── Flight Plan Detail ──
export interface FlightPlanDetail extends FlightPlanPublic {
  approvals: FlightPlanApproval[];
  status_history: FlightPlanStatusHistory[];
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
```

- [ ] **Step 2: Commit**

```bash
git add src/types/api.ts && git commit -m "feat: add TypeScript types from OpenAPI spec"
```

---

## Task 3: Environment variables

**Files:**
- Create: `.env.local`, `.env.example`

- [ ] **Step 1: Create `.env.local`**

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

- [ ] **Step 2: Create `.env.example`**

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

- [ ] **Step 3: Ensure `.env.local` is gitignored**

- [ ] **Step 4: Commit**

```bash
git add .env.example && git commit -m "chore: add environment variable configuration"
```

---

## Task 4: Utility functions — labels and formatters

**Files:**
- Create: `src/lib/utils/labels.ts`
- Create: `src/lib/utils/format.ts`

- [ ] **Step 1: Write `src/lib/utils/labels.ts`**

```typescript
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
```

- [ ] **Step 2: Write `src/lib/utils/format.ts`**

```typescript
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return "—";
  try {
    return format(parseISO(isoString), "dd/MM/yyyy HH:mm 'UTC'", { locale: es });
  } catch {
    return isoString;
  }
}

export function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return "—";
  try {
    return format(parseISO(isoString), "dd/MM/yyyy", { locale: es });
  } catch {
    return isoString;
  }
}

export function formatDuration(hhmm: string | null | undefined): string {
  if (!hhmm || hhmm.length < 4) return "—";
  const hours = parseInt(hhmm.substring(0, 2), 10);
  const minutes = parseInt(hhmm.substring(2, 4), 10);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function formatRoute(departure: string, destination: string): string {
  return `${departure} → ${destination}`;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/utils/labels.ts src/lib/utils/format.ts && git commit -m "feat: add utility functions for labels and formatting"
```

---

## Task 5: API client and auth/flight-plans API

**Files:**
- Create: `src/lib/api/client.ts`
- Create: `src/lib/api/auth.ts`
- Create: `src/lib/api/flight-plans.ts`

- [ ] **Step 1: Write `src/lib/api/client.ts`**

```typescript
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
```

- [ ] **Step 2: Write `src/lib/api/auth.ts`**

```typescript
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
```

- [ ] **Step 3: Write `src/lib/api/flight-plans.ts`**

```typescript
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
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/api/client.ts src/lib/api/auth.ts src/lib/api/flight-plans.ts && git commit -m "feat: add API client and endpoint functions"
```

---

## Task 6: Auth context and provider

**Files:**
- Create: `src/lib/auth/auth-context.tsx`

- [ ] **Step 1: Write `src/lib/auth/auth-context.tsx`**

```typescript
"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { UserPublic } from "@/types/api";
import { login as apiLogin, logout as apiLogout, refreshToken as apiRefreshToken } from "@/lib/api/auth";
import { setAuthToken, setOnUnauthorized } from "@/lib/api/client";

interface AuthState {
  user: UserPublic | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const REFRESH_TOKEN_KEY = "jp_refresh_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  const doLogout = useCallback(async () => {
    const stored = sessionStorage.getItem(REFRESH_TOKEN_KEY);
    try {
      if (stored) await apiLogout(stored);
    } catch {
      // ignore logout errors
    }
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    setRefreshToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setAuthToken(null);
  }, []);

  const doLogin = useCallback(async (email: string, password: string) => {
    const response = await apiLogin({ email, password });
    setAuthToken(response.access_token);
    setRefreshToken(response.refresh_token);
    setUser(response.user);
    setIsAuthenticated(true);
    sessionStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);
  }, []);

  const doRefresh = useCallback(async (storedRefresh: string) => {
    try {
      const response = await apiRefreshToken(storedRefresh);
      setAuthToken(response.access_token);
      setRefreshToken(response.refresh_token);
      setUser(response.user);
      setIsAuthenticated(true);
      sessionStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);
    } catch {
      sessionStorage.removeItem(REFRESH_TOKEN_KEY);
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem(REFRESH_TOKEN_KEY);
    if (stored) {
      doRefresh(stored).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [doRefresh]);

  useEffect(() => {
    setOnUnauthorized(() => {
      doLogout();
    });
  }, [doLogout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login: doLogin,
        logout: doLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/auth/auth-context.tsx && git commit -m "feat: add auth context and provider"
```

---

## Task 7: Root layout with providers

**Files:**
- Create: `src/components/providers.tsx`
- Create: `src/app/page.tsx`

- [ ] **Step 1: Write `src/components/providers.tsx`**

```typescript
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { AuthProvider } from "@/lib/auth/auth-context";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 2: Write `src/app/page.tsx`**

```typescript
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    router.replace(isAuthenticated ? "/dashboard" : "/login");
  }, [isAuthenticated, isLoading, router]);

  return null;
}
```

- [ ] **Step 3: Write `src/app/layout.tsx`**

```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "JetPass — Dashboard de Autoridad",
  description: "Panel de gestión de planes de vuelo para autoridades aeronáuticas",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx src/components/providers.tsx src/app/page.tsx && git commit -m "feat: add root layout with providers and redirect"
```

---

## Task 8: Sidebar and app shell layout

**Files:**
- Create: `src/components/layout/sidebar.tsx`
- Create: `src/components/layout/app-shell.tsx`
- Create: `src/app/dashboard/layout.tsx`

- [ ] **Step 1: Write `src/components/layout/sidebar.tsx`**

```typescript
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Plane, LogOut, ChevronDown } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const initials = user
    ? `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase()
    : "??";

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Plane className="h-6 w-6 text-blue-600" />
        <span className="text-xl font-bold tracking-tight">JetPass</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname.startsWith("/dashboard")
              ? "bg-blue-50 text-blue-700"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>
      </nav>

      {/* User */}
      <div className="border-t p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 items-center justify-between">
                <div className="text-left text-sm">
                  <p className="font-medium leading-none">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {user?.email}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onClick={logout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Write `src/components/layout/app-shell.tsx`**

```typescript
import { type ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="ml-64 p-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Write `src/app/dashboard/layout.tsx`**

```typescript
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { Sidebar } from "@/components/layout/sidebar";
import { AppShell } from "@/components/layout/app-shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <>
      <Sidebar />
      <AppShell>{children}</AppShell>
    </>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/sidebar.tsx src/components/layout/app-shell.tsx src/app/dashboard/layout.tsx && git commit -m "feat: add sidebar, app shell, and dashboard layout"
```

---

## Task 9: Login page

**Files:**
- Create: `src/app/login/page.tsx`

- [ ] **Step 1: Write `src/app/login/page.tsx`**

```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane } from "lucide-react";
import { ApiError } from "@/lib/api/client";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    setSubmitting(true);
    try {
      await login(data.email, data.password);
      router.replace("/dashboard");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Credenciales inválidas");
      } else {
        setError("Error de conexión. Intentá de nuevo.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <Plane className="h-10 w-10 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">JetPass</CardTitle>
          <CardDescription>
            Ingresá con tu cuenta de autoridad
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="autoridad@ejemplo.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>
            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Ingresando..." : "Ingresar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/login/page.tsx && git commit -m "feat: add login page with form validation"
```

---

## Task 10: Status badge component

**Files:**
- Create: `src/components/dashboard/status-badge.tsx`

- [ ] **Step 1: Write `src/components/dashboard/status-badge.tsx`**

```typescript
import { Badge } from "@/components/ui/badge";
import type { FlightPlanStatus } from "@/types/api";
import { getFlightPlanStatusLabel } from "@/lib/utils/labels";
import { cn } from "@/lib/utils";

const STATUS_CLASSES: Record<FlightPlanStatus, string> = {
  draft: "bg-gray-100 text-gray-700 hover:bg-gray-100",
  filed: "bg-gray-100 text-gray-700 hover:bg-gray-100",
  pending_approval: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  accepted: "bg-green-100 text-green-700 hover:bg-green-100",
  rejected: "bg-red-100 text-red-700 hover:bg-red-100",
  active: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  closed: "bg-gray-100 text-gray-700 hover:bg-gray-100",
  cancelled: "border border-gray-300 text-gray-500 bg-transparent hover:bg-transparent",
};

interface StatusBadgeProps {
  status: FlightPlanStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge className={cn(STATUS_CLASSES[status], "font-medium")} variant="outline">
      {getFlightPlanStatusLabel(status)}
    </Badge>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/status-badge.tsx && git commit -m "feat: add status badge component"
```

---

## Task 11: Dashboard list page

**Files:**
- Create: `src/components/dashboard/empty-state.tsx`
- Create: `src/components/dashboard/flight-plan-table.tsx`
- Create: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Write `src/components/dashboard/empty-state.tsx`**

```typescript
import { ClipboardCheck } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <ClipboardCheck className="h-16 w-16 text-gray-300" />
      <h3 className="mt-4 text-lg font-semibold text-gray-900">
        No hay planes pendientes
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        Todos los planes de vuelo han sido procesados.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Write `src/components/dashboard/flight-plan-table.tsx`**

```typescript
"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "./status-badge";
import { EmptyState } from "./empty-state";
import { ApproveButton } from "./approve-button";
import { RejectDialog } from "./reject-dialog";
import type { FlightPlanPublic } from "@/types/api";
import { formatDateTime, formatRoute } from "@/lib/utils/format";

interface FlightPlanTableProps {
  plans: FlightPlanPublic[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function FlightPlanTable({
  plans,
  isLoading,
  isError,
  onRetry,
}: FlightPlanTableProps) {
  const pendingPlans = useMemo(
    () => plans?.filter((p) => p.status === "pending_approval") ?? [],
    [plans]
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-red-500 font-medium">Error al cargar los planes</p>
        <Button variant="outline" onClick={onRetry} className="mt-4">
          Reintentar
        </Button>
      </div>
    );
  }

  if (!pendingPlans || pendingPlans.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ruta</TableHead>
            <TableHead>EOBT</TableHead>
            <TableHead>Matrícula</TableHead>
            <TableHead>Piloto</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pendingPlans.map((plan) => (
            <TableRow key={plan.id}>
              <TableCell className="font-medium">
                {formatRoute(
                  plan.departure_aerodrome_icao,
                  plan.destination_aerodrome_icao
                )}
              </TableCell>
              <TableCell>{formatDateTime(plan.departure_eobt_utc)}</TableCell>
              <TableCell>
                {plan.aircraft_identification_snapshot || "—"}
              </TableCell>
              <TableCell>
                {plan.pilot
                  ? `${plan.pilot.last_name}, ${plan.pilot.first_name}`
                  : "—"}
              </TableCell>
              <TableCell>
                <StatusBadge status={plan.status} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/${plan.id}`}>Ver detalle</Link>
                  </Button>
                  <ApproveButton planId={plan.id} />
                  <RejectDialog planId={plan.id} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

- [ ] **Step 3: Write `src/app/dashboard/page.tsx`**

```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import { listFlightPlans } from "@/lib/api/flight-plans";
import { FlightPlanTable } from "@/components/dashboard/flight-plan-table";

export default function DashboardPage() {
  const {
    data: plans,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["flight-plans"],
    queryFn: listFlightPlans,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Planes de Vuelo Pendientes
        </h1>
        <p className="text-muted-foreground mt-1">
          Revisá y aprobá los planes que esperan tu autorización.
        </p>
      </div>
      <FlightPlanTable
        plans={plans}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
      />
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/empty-state.tsx src/components/dashboard/flight-plan-table.tsx src/app/dashboard/page.tsx && git commit -m "feat: add dashboard list page with table"
```

---

## Task 12: Approve and reject components

**Files:**
- Create: `src/components/dashboard/approve-button.tsx`
- Create: `src/components/dashboard/reject-dialog.tsx`

- [ ] **Step 1: Write `src/components/dashboard/approve-button.tsx`**

```typescript
"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { approveFlightPlan } from "@/lib/api/flight-plans";
import { ApiError } from "@/lib/api/client";
import { Check } from "lucide-react";

interface ApproveButtonProps {
  planId: string;
}

export function ApproveButton({ planId }: ApproveButtonProps) {
  const [confirmed, setConfirmed] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => approveFlightPlan(planId),
    onSuccess: () => {
      toast.success("Plan aprobado correctamente");
      queryClient.invalidateQueries({ queryKey: ["flight-plans"] });
      queryClient.invalidateQueries({ queryKey: ["flight-plan", planId] });
      setConfirmed(false);
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(`Error: ${error.message}`);
      } else {
        toast.error("Error al aprobar el plan");
      }
      setConfirmed(false);
    },
  });

  if (!confirmed) {
    return (
      <Button size="sm" variant="outline" onClick={() => setConfirmed(true)}>
        Aprobar
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className="bg-green-600 hover:bg-green-700"
    >
      <Check className="mr-1 h-4 w-4" />
      {mutation.isPending ? "Aprobando..." : "Confirmar"}
    </Button>
  );
}
```

- [ ] **Step 2: Write `src/components/dashboard/reject-dialog.tsx`**

```typescript
"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { rejectFlightPlan } from "@/lib/api/flight-plans";
import { ApiError } from "@/lib/api/client";

interface RejectDialogProps {
  planId: string;
}

export function RejectDialog({ planId }: RejectDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => rejectFlightPlan(planId, reason),
    onSuccess: () => {
      toast.success("Plan rechazado");
      queryClient.invalidateQueries({ queryKey: ["flight-plans"] });
      queryClient.invalidateQueries({ queryKey: ["flight-plan", planId] });
      setOpen(false);
      setReason("");
      setError(null);
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(`Error: ${error.message}`);
      } else {
        toast.error("Error al rechazar el plan");
      }
    },
  });

  const handleSubmit = () => {
    if (reason.trim().length < 10) {
      setError("El motivo debe tener al menos 10 caracteres");
      return;
    }
    setError(null);
    mutation.mutate();
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setReason("");
      setError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
          Rechazar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rechazar plan de vuelo</DialogTitle>
          <DialogDescription>
            Escribí el motivo del rechazo. Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reason">Motivo</Label>
          <Textarea
            id="reason"
            placeholder="Ej: Ruta no autorizada, condiciones meteorológicas adversas..."
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
            className="min-h-[100px]"
            maxLength={500}
          />
          <div className="flex justify-between">
            {error && <p className="text-sm text-red-500">{error}</p>}
            <p className="text-xs text-muted-foreground ml-auto">
              {reason.length}/500
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Rechazando..." : "Confirmar rechazo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/approve-button.tsx src/components/dashboard/reject-dialog.tsx && git commit -m "feat: add approve and reject components with mutations"
```

---

## Task 13: Flight plan detail page

**Files:**
- Create: `src/components/dashboard/approval-timeline.tsx`
- Create: `src/components/dashboard/flight-plan-detail-view.tsx`
- Create: `src/app/dashboard/[id]/page.tsx`

- [ ] **Step 1: Write `src/components/dashboard/approval-timeline.tsx`**

```typescript
import { Clock, Check, X, Circle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import type {
  FlightPlanApproval,
  FlightPlanStatusHistory,
} from "@/types/api";
import {
  getApprovalStatusLabel,
  getApprovalActorLabel,
  getFlightPlanStatusLabel,
} from "@/lib/utils/labels";
import { formatDateTime } from "@/lib/utils/format";

interface ApprovalTimelineProps {
  approvals: FlightPlanApproval[];
  statusHistory: FlightPlanStatusHistory[];
}

export function ApprovalTimeline({
  approvals,
  statusHistory,
}: ApprovalTimelineProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Ciclo de Aprobaciones
        </h3>
        <div className="space-y-3">
          {approvals.map((approval) => {
            const Icon =
              approval.status === "approved"
                ? Check
                : approval.status === "rejected"
                  ? X
                  : Circle;

            const iconColor =
              approval.status === "approved"
                ? "text-green-500"
                : approval.status === "rejected"
                  ? "text-red-500"
                  : "text-amber-500";

            return (
              <div key={approval.id} className="flex gap-3">
                <Icon className={`h-5 w-5 mt-0.5 ${iconColor}`} />
                <div>
                  <p className="text-sm font-medium">
                    {getApprovalActorLabel(approval.actor)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getApprovalStatusLabel(approval.status)}
                    {approval.decided_at &&
                      ` — ${formatDateTime(approval.decided_at)}`}
                  </p>
                  {approval.reason && (
                    <p className="text-xs text-gray-500 mt-1">
                      {approval.reason}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Historial de Estados
        </h3>
        <div className="space-y-3">
          {statusHistory.map((entry) => (
            <div key={entry.id} className="flex gap-3">
              <Clock className="h-4 w-4 mt-0.5 text-gray-400" />
              <div>
                <p className="text-sm">
                  {entry.from_status
                    ? `${getFlightPlanStatusLabel(entry.from_status)} → ${getFlightPlanStatusLabel(entry.to_status)}`
                    : getFlightPlanStatusLabel(entry.to_status)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(entry.created_at)}
                </p>
                {entry.reason && (
                  <p className="text-xs text-gray-500 mt-1">{entry.reason}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write `src/components/dashboard/flight-plan-detail-view.tsx`**

```typescript
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";
import { ApproveButton } from "./approve-button";
import { RejectDialog } from "./reject-dialog";
import { ApprovalTimeline } from "./approval-timeline";
import type { FlightPlanDetail } from "@/types/api";
import {
  getFlightRulesLabel,
  getFlightTypeLabel,
} from "@/lib/utils/labels";
import {
  formatDateTime,
  formatDuration,
  formatRoute,
} from "@/lib/utils/format";
import { ArrowLeft } from "lucide-react";

interface FlightPlanDetailViewProps {
  plan: FlightPlanDetail;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

export function FlightPlanDetailView({ plan }: FlightPlanDetailViewProps) {
  const canApprove = plan.status === "pending_approval";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href="/dashboard">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Volver
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            Plan de Vuelo {plan.aircraft_identification_snapshot || plan.id.slice(0, 8)}
          </h1>
          <p className="text-muted-foreground">
            {formatRoute(plan.departure_aerodrome_icao, plan.destination_aerodrome_icao)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={plan.status} />
          {canApprove && (
            <>
              <ApproveButton planId={plan.id} />
              <RejectDialog planId={plan.id} />
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* General */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Datos Generales</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Field label="Reglas de vuelo" value={getFlightRulesLabel(plan.flight_rules)} />
              <Field label="Tipo de vuelo" value={getFlightTypeLabel(plan.flight_type)} />
              <Field label="EOBT" value={formatDateTime(plan.departure_eobt_utc)} />
              <Field label="EET" value={formatDuration(plan.total_eet)} />
              <Field label="Salida" value={plan.departure_aerodrome_icao} />
              <Field label="Destino" value={plan.destination_aerodrome_icao} />
              <Field label="Alternativo 1" value={plan.alternate1_aerodrome_icao} />
              <Field label="Alternativo 2" value={plan.alternate2_aerodrome_icao} />
            </CardContent>
          </Card>

          {/* Aircraft */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aeronave</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Field label="Matrícula" value={plan.aircraft_identification_snapshot || "—"} />
              <Field label="Tipo" value={plan.aircraft_type_designator_snapshot || "—"} />
              <Field label="Estela turbulenta" value={plan.wake_turbulence_category_snapshot || "—"} />
              <Field label="Equipo COM/NAV" value={plan.equipment_com_nav_snapshot || "—"} />
              <Field label="Vigilancia" value={plan.equipment_surveillance_snapshot || "—"} />
              <Field label="Radio emergencia" value={plan.emergency_radio_snapshot || "—"} />
            </CardContent>
          </Card>

          {/* Route */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ruta</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Field label="Velocidad crucero" value={plan.cruising_speed || "—"} />
              <Field label="Nivel crucero" value={plan.cruising_level || "—"} />
              <Field label="Punto cambio reglas" value={plan.rule_change_point || "—"} />
            </CardContent>
            {plan.route && (
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">Ruta</p>
                <p className="text-sm font-mono">{plan.route}</p>
              </CardContent>
            )}
          </Card>

          {/* Additional info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información Adicional</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Field label="Autonomía" value={formatDuration(plan.endurance)} />
              <Field label="Personas a bordo" value={plan.persons_on_board?.toString() || "—"} />
              <Field label="Equipo supervivencia" value={plan.survival_equipment_snapshot || "—"} />
              <Field label="Chalecos" value={plan.life_jackets_snapshot || "—"} />
              <Field label="Botes (cantidad)" value={plan.dinghies_number_snapshot?.toString() || "—"} />
              <Field label="Botes (capacidad)" value={plan.dinghies_capacity_snapshot?.toString() || "—"} />
              <Field label="Botes (cubierta)" value={plan.dinghies_cover_snapshot === true ? "Sí" : plan.dinghies_cover_snapshot === false ? "No" : "—"} />
              <Field label="Botes (color)" value={plan.dinghies_color_snapshot || "—"} />
              <Field label="Color y marcas" value={plan.color_and_markings_snapshot || "—"} />
            </CardContent>
            {plan.other_information && (
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">Casilla 18</p>
                <p className="text-sm">{plan.other_information}</p>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Timeline sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle className="text-base">Línea de Tiempo</CardTitle>
            </CardHeader>
            <CardContent>
              <ApprovalTimeline
                approvals={plan.approvals}
                statusHistory={plan.status_history}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write `src/app/dashboard/[id]/page.tsx`**

```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { getFlightPlan } from "@/lib/api/flight-plans";
import { FlightPlanDetailView } from "@/components/dashboard/flight-plan-detail-view";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function FlightPlanDetailPage() {
  const { id } = useParams<{ id: string }>();

  const {
    data: plan,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["flight-plan", id],
    queryFn: () => getFlightPlan(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !plan) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-red-500 font-medium">Plan no encontrado</p>
        <Button variant="outline" onClick={() => refetch()} className="mt-4">
          Reintentar
        </Button>
        <Button variant="ghost" asChild className="mt-2">
          <Link href="/dashboard">Volver al dashboard</Link>
        </Button>
      </div>
    );
  }

  return <FlightPlanDetailView plan={plan} />;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/approval-timeline.tsx src/components/dashboard/flight-plan-detail-view.tsx src/app/dashboard/[id]/page.tsx && git commit -m "feat: add flight plan detail page with timeline"
```

---

## Task 14: Polish, lint, and build

**Files:**
- Modify: various files for lint fixes

- [ ] **Step 1: Run lint**

```bash
npm run lint
```
Expected: no errors.

- [ ] **Step 2: Run build**

```bash
npm run build
```
Expected: successful build.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "chore: lint and build fixes"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Login page → Task 9
- ✅ Lista de planes pendientes → Task 11
- ✅ Tabla con ruta, EOBT, matrícula, piloto, estado, acciones → Task 11
- ✅ Detalle completo del plan → Task 13
- ✅ Timeline de aprobaciones → Task 13
- ✅ Aprobar (botón directo) → Task 12
- ✅ Rechazar (dialog con motivo obligatorio) → Task 12
- ✅ Sidebar layout → Task 8
- ✅ Auth con JWT y refresh → Task 6
- ✅ Labels (V→VFR, etc.) → Task 4
- ✅ Empty state → Task 11
- ✅ Loading skeleton → Task 11, Task 13
- ✅ Error state → Task 11, Task 13
- ✅ No mostrar aeródromos/AIP/clima/NOTAMs → N/A (no incluido)
- ✅ No registro de autoridad → N/A (no incluido)

**Placeholder scan:** No TBDs, no TODOs. All code is concrete.

**Type consistency:**
- `FlightPlanPublic` and `FlightPlanDetail` types used consistently across API layer, table, and detail view
- `pilot` field embedded in `FlightPlanPublic` — consistent
- Labels use same enum types from `@/types/api`
