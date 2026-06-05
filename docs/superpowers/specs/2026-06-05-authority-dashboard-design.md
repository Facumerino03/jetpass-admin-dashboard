# Spec: Dashboard de Autoridad Aeronáutica

## Qué es

El panel donde una autoridad aeronáutica (ANAC, EANA, torre de control, etc.) ve los planes de vuelo que esperan su aprobación y puede aprobarlos o rechazarlos.

## Stack

- **Framework**: Next.js 15 App Router + TypeScript
- **UI**: shadcn/ui + Tailwind CSS (tema claro minimalista)
- **Server state**: TanStack Query v5
- **HTTP**: fetch nativo con wrapper
- **Auth**: React Context (access_token en memoria, refresh_token en sessionStorage)
- **Form**: react-hook-form + zod (solo login)
- **Notificaciones**: sonner (toast)

## Estructura de archivos

```
src/
  app/
    layout.tsx              # Root: Providers (Auth, Query, Toaster)
    page.tsx                # Redirige a /login o /dashboard
    login/
      page.tsx              # Login form
    dashboard/
      layout.tsx            # Shell: Sidebar + contenido protegido
      page.tsx              # Lista de planes pendientes
      [id]/
        page.tsx            # Detalle del plan
  components/
    ui/                     # shadcn components (auto-generated)
    dashboard/
      flight-plan-table.tsx         # Tabla con columnas y acciones
      flight-plan-detail-view.tsx   # Vista completa del plan
      approve-button.tsx            # Botón aprobar con confirmación
      reject-dialog.tsx             # Dialog rechazar con textarea
      status-badge.tsx              # Badge coloreado según status
      approval-timeline.tsx         # Timeline vertical de aprobaciones
      empty-state.tsx               # Ilustración "sin pendientes"
    layout/
      sidebar.tsx             # Navegación lateral
      app-shell.tsx            # Sidebar + área contenido
  lib/
    api/
      client.ts               # fetch wrapper con auth y refresh interceptor
      auth.ts                 # login(), refresh(), logout()
      flight-plans.ts         # list(), getById(), approve(), reject()
    auth/
      auth-context.tsx        # AuthProvider con user + tokens
    utils/
      labels.ts               # Mapeo de enums a texto legible
      format.ts               # Formateo de fechas, EOBT, HHMM a horas
  types/
    api.ts                    # Tipos del openapi
```

## Componentes y responsabilidades

### AuthProvider (React Context)
- Guarda `user`, `accessToken`, `refreshToken` en state React (memoria)
- `access_token` en memoria (se pierde al recargar, intencional por seguridad)
- `refresh_token` en `sessionStorage` para re-autenticar al recargar
- Expone `login(email, password)`, `logout()`, `isAuthenticated`, `isLoading`
- Al montar: si hay refresh_token en sessionStorage → intenta POST /auth/refresh
- Interceptor 401: intenta refresh, si falla → logout y redirect a /login

### API Client (lib/api/client.ts)
- `createAuthenticatedClient()`: fetch wrapper que agrega `Authorization: Bearer <token>`
- Interceptor de refresh: si recibe 401, intenta `POST /auth/refresh`, si falla → onUnauthorized callback
- Base URL de env variable `NEXT_PUBLIC_API_URL`

### Login Page (/login)
- react-hook-form + zod para validación (email válido, password requerido)
- Loading state en el botón submit
- Error state: mensaje de error del backend o "Credenciales inválidas"
- Si ya está autenticado → redirige a `/dashboard`

### Dashboard Layout (/dashboard/layout.tsx)
- Sidebar fijo a la izquierda (w-64)
- Área de contenido con padding (ml-64)
- Ruta protegida: si no autenticado → redirect a `/login`

### Sidebar
- Logo "JetPass" arriba
- Nav items: Dashboard (activo), items futuros deshabilitados con tooltip "Próximamente"
- Botón de logout abajo con dropdown de usuario
- Colapsable en mobile (usar Sheet de shadcn para mobile)

### Lista de Planes (/dashboard/page.tsx)
- Query: `useQuery({ queryKey: ['flight-plans'], queryFn: listFlightPlans })`
- Tabla shadcn con columnas:
  - Ruta: `departure → destination`
  - EOBT: formateado `DD/MM/YYYY HH:MM UTC`
  - Matrícula: `aircraft_identification_snapshot`
  - Piloto: `pilot.first_name + pilot.last_name`
  - Estado: StatusBadge
  - Acciones: Ver detalle, Aprobar, Rechazar
- Mutaciones: `useMutation` para approve/reject con `onSuccess: queryClient.invalidateQueries(['flight-plans'])`
- Empty state cuando array vacío
- Loading: skeleton de tabla
- Error: mensaje + botón reintentar
- Filtra `pending_approval` en el frontend como segunda línea de defensa (el backend ya filtra por rol)

### Detalle del Plan (/dashboard/[id]/page.tsx)
- Query: `useQuery({ queryKey: ['flight-plan', id], queryFn: () => getFlightPlan(id) })`
- Layout en dos columnas (desktop): principal (2/3) + timeline (1/3)
- Secciones:
  1. **Generales**: flight_rules (V→VFR), flight_type (G→General), salida, destino, EOBT, EET
  2. **Aeronave**: matrícula, tipo, wake turbulence, equipamiento
  3. **Ruta**: velocidad, nivel, ruta textual, alternativos
  4. **Adicional**: autonomía, personas a bordo, casilla 18, botes, color
  5. **Timeline**: approval_timeline con historial
- Acciones abajo: Aprobar / Rechazar (si el plan está pending_approval)
- Volver: breadcrumb o botón "Volver al dashboard"

### Approve Button
- Click → muestra "Confirmar" (estilo "confirmación inline")
- Segundo click → mutación `POST /flight-plans/{id}/approve`
- Toast éxito "Plan aprobado" o error
- Invalidación de queries tras éxito

### Reject Dialog
- Dialog con textarea para motivo (obligatorio, min 10 chars, max 500)
- Validación frontend: no vacío, min 10 chars
- Submit → mutación `POST /flight-plans/{id}/reject` con body `{ reason }`
- Toast éxito/error
- Cierra dialog e invalida queries

### Status Badge
- pending_approval → badge ámbar "Pendiente"
- accepted → badge verde "Aceptado"
- rejected → badge rojo "Rechazado"
- Otros → badge gris según estado

### Approval Timeline
- Vertical timeline con ítems por cada approval
- Cada ítem: actor, status, fecha, motivo si hay
- Historial de status_history también mostrado

## Flujo de datos

1. App monta → AuthProvider verifica refresh_token en sessionStorage → si hay, intenta refresh
2. Usuario en `/login` → login() → POST /auth/login → guarda tokens → redirige a `/dashboard`
3. `/dashboard` → useQuery(['flight-plans']) → GET /flight-plans → render tabla
4. Usuario click "Aprobar" → useMutation → POST → invalidateQueries → tabla se actualiza
5. Usuario click "Rechazar" → dialog → submit → useMutation → POST → invalidateQueries
6. Navega a `/dashboard/[id]` → useQuery(['flight-plan', id]) → GET → render detalle
7. Token expira → 401 → interceptor llama refresh → si falla → logout → redirect a /login

## Labels (enum → texto)

- FlightRules: V→VFR, I→IFR, Y→IFR con cambio a VFR, Z→VFR con cambio a IFR
- FlightType: G→Aviación General, S→Transporte Aéreo Regular, N→Transporte Aéreo No Regular, M→Militar, X→Otro
- WakeTurbulence: L→Ligero, M→Medio, H→Pesado, J→Superpesado

## Lo que NO se implementa

- Datos de aeródromos, AIP, clima, NOTAMs
- Registro de autoridad
- Filtros en la lista (lo maneja el backend)
- Paginación (asumo lista completa por ahora)
- Múltiples roles en el frontend (solo autoridad logueada)

## Manejo de errores

- **Red**: toast "Error de conexión"
- **401**: refresh automático, si falla → redirect a /login
- **403**: toast "No tenés permisos para esta acción"
- **404**: página "Plan no encontrado"
- **422**: mostrar errores de validación del backend
- **500**: toast "Error del servidor, intentá de nuevo"

## API Endpoints

| Acción | Endpoint | Auth |
|---|---|---|
| Ver planes pendientes | `GET /flight-plans` | Bearer token |
| Ver detalle de un plan | `GET /flight-plans/{id}` | Bearer token |
| Aprobar un plan | `POST /flight-plans/{id}/approve` | Bearer token |
| Rechazar un plan | `POST /flight-plans/{id}/reject` | Bearer token + body `{reason}` |

## Modelo de datos

### FlightPlanPublic (lista)

Campos: id, pilot_user_id, pilot (PilotSummary), aircraft_id, status, flight_rules, flight_type, departure_aerodrome_icao, departure_eobt_utc, destination_aerodrome_icao, alternate1_aerodrome_icao, alternate2_aerodrome_icao, cruising_speed, cruising_level, route, rule_change_point, total_eet, other_information, endurance, persons_on_board, aircraft_identification_snapshot, aircraft_type_designator_snapshot, wake_turbulence_category_snapshot, equipment_com_nav_snapshot, equipment_surveillance_snapshot, emergency_radio_snapshot, survival_equipment_snapshot, life_jackets_snapshot, dinghies_number_snapshot, dinghies_capacity_snapshot, dinghies_cover_snapshot, dinghies_color_snapshot, color_and_markings_snapshot, aircraft_snapshot_confirmed_at, created_at, updated_at.

### FlightPlanDetail (detalle)

Mismos campos que FlightPlanPublic + approvals[] + status_history[].

### PilotSummary

{ id, first_name, last_name }

## Enums

- FlightPlanStatus: draft, filed, pending_approval, accepted, rejected, active, closed, cancelled
- FlightRules: V, I, Y, Z
- FlightType: G, S, N, M, X
- WakeTurbulenceCat: L, M, H, J
- FlightPlanApprovalActor: pilot, authority, destination_aerodrome_operator
- FlightPlanApprovalStatus: pending, approved, rejected
