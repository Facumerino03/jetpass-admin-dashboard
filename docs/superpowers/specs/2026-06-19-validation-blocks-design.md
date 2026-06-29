# Diseño — Bloques de Validación para Autoridad del Espacio Aéreo

## Contexto

El dashboard JetPass Admin ya permite a la autoridad del espacio aéreo revisar y aprobar/rechazar planes de vuelo. El backend JetPass Core ahora expone un motor de validaciones personalizadas:

- Campos disponibles: `GET /validation/fields`
- Criterios individuales: `GET|POST|PATCH|DELETE /validation/criteria`
- Bloques de criterios: `GET|POST|PATCH|DELETE /validation/blocks`
- Ejecución: `POST /validation/run` con `flight_plan_id` + `block_id`

El resultado de la ejecución es **informativo**: no cambia el estado del plan automáticamente. La autoridad decide manualmente si aprueba o rechaza el plan, usando el veredicto como soporte.

## Objetivo

Agregar al dashboard una sección exclusiva para la autoridad del espacio aéreo donde pueda:

1. Crear, editar y eliminar **criterios de validación** individuales.
2. Crear, editar y eliminar **bloques de validación** (workflows visuales lineales) que agrupan criterios.
3. Ejecutar un bloque sobre un plan de vuelo desde el detalle del plan y ver el resultado.

## Alcance

- Solo rol `authority` accede a la nueva funcionalidad.
- El workflow es **secuencial y visual**, inspirado en builders de nodos, pero **sin ramas reales**: el backend ejecuta todos los criterios del bloque y devuelve un `overall` único (`approved` / `warned` / `rejected`).
- Los bloques se persisten en el backend (`/validation/blocks`).
- No se persiste el resultado de la ejecución: es solo informativo en el momento.

## Nomenclatura

En la UI usamos consistentemente **"Bloques de validación"**. Internamente el backend usa `blocks`; el concepto de "workflow" queda como sinónimo informal.

## Rutas y Navegación

### Nuevas rutas

```
app/dashboard/
├── blocks/
│   └── page.tsx          # Página de Bloques de validación
├── [id]/
│   └── page.tsx          # Detalle del plan (ya existe, se extiende)
```

### Sidebar

Se agrega un nuevo ítem en el sidebar lateral:

- Label: **Bloques de validación**
- Icono: `Workflow` (Lucide)
- Ruta: `/dashboard/blocks`
- Visible solo para `user.role === "authority"`.

## Tipos de Datos

Se extiende `src/types/api.ts`:

```ts
export type ValidationOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "contains"
  | "not_contains"
  | "is_present"
  | "is_absent";

export type ValidationResult = "approve" | "warn" | "reject";

export interface ValidationField {
  field_path: string;
  item: number;
  label: string;
}

export interface ValidationCriterion {
  id: string;
  name: string;
  field_path: string;
  operator: ValidationOperator;
  expected_value: string | null;
  result_on_pass: ValidationResult;
  result_on_fail: ValidationResult;
  pass_message: string | null;
  fail_message: string | null;
  is_active: boolean;
}

export interface ValidationBlock {
  id: string;
  created_by_user_id: string;
  name: string;
  is_active: boolean;
  criteria: ValidationCriterion[];
  criteria_count: number;
}

export interface ValidationRunRequest {
  flight_plan_id: string;
  block_id: string;
}

export interface ValidationRunResult {
  overall: "approved" | "warned" | "rejected";
  results: Array<{
    criterion_id: string;
    criterion_name: string;
    field_path: string;
    operator: ValidationOperator;
    expected_value: string | null;
    actual_value: string | null;
    passed: boolean;
    result_applied: ValidationResult;
    message: string | null;
  }>;
}
```

## Capa de API

Se crea `src/lib/api/validation.ts` con el patrón existente de `flight-plans.ts`:

```ts
import { apiRequest } from "./client";
import type {
  ValidationField,
  ValidationCriterion,
  ValidationBlock,
  ValidationRunRequest,
  ValidationRunResult,
} from "@/types/api";

export async function listValidationFields(): Promise<ValidationField[]>;
export async function listCriteria(): Promise<ValidationCriterion[]>;
export async function createCriterion(
  data: Omit<ValidationCriterion, "id" | "is_active">
): Promise<ValidationCriterion>;
export async function updateCriterion(
  id: string,
  data: Partial<Omit<ValidationCriterion, "id" | "is_active">>
): Promise<ValidationCriterion>;
export async function deleteCriterion(id: string): Promise<void>;

export async function listBlocks(): Promise<ValidationBlock[]>;
export async function createBlock(
  data: { name: string; criterion_ids: string[] }
): Promise<ValidationBlock>;
export async function updateBlock(
  id: string,
  data: Partial<{ name: string; criterion_ids: string[]; is_active: boolean }>
): Promise<ValidationBlock>;
export async function deleteBlock(id: string): Promise<void>;

export async function runValidation(
  data: ValidationRunRequest
): Promise<ValidationRunResult>;
```

### TanStack Query keys

- `["validation-fields"]`
- `["validation-criteria"]`
- `["validation-blocks"]`
- `["validation-run", flightPlanId, blockId]`

## Página `/dashboard/blocks`

Cliente puro (`"use client"`) con dos tabs de shadcn/ui.

### Tab "Mis criterios"

- Tabla con columnas:
  - Nombre
  - Campo (label legible, no `field_path`)
  - Operador (traducido a texto legible)
  - Valor esperado
  - Resultado si pasa / si falla
  - Acciones: editar, eliminar
- Botón **"Nuevo criterio"** que abre un modal con formulario.
- Formulario con React Hook Form + Zod:
  - Nombre (`string`, requerido)
  - Campo a evaluar (`select` poblado por `GET /validation/fields`)
  - Operador (`select` con los 10 operadores)
  - Valor esperado (`string`, opcional; deshabilitado/oculto para `is_present` / `is_absent`)
  - Resultado si pasa (`approve` / `warn` / `reject`)
  - Resultado si falla (`approve` / `warn` / `reject`)
  - Mensaje si pasa (opcional)
  - Mensaje si falla (opcional)

### Tab "Mis bloques"

- Lista de tarjetas. Cada tarjeta muestra:
  - Nombre del bloque
  - Cantidad de criterios (`criteria_count`)
  - Estado activo/inactivo
  - Acciones: editar, activar/desactivar, eliminar
- Botón **"Nuevo bloque"** que abre el editor de bloque.

## Editor de Bloque (Canvas Lineal)

Al crear o editar un bloque se abre un `Dialog` grande de shadcn/ui con dos zonas:

### Zona izquierda — Criterios disponibles

- Lista de todos los criterios creados por la autoridad.
- Cada criterio es una tarjeta draggable.
- Filtro por nombre/campo.

### Zona derecha — Canvas del bloque

- Representación visual de los criterios agregados al bloque.
- Los nodos se conectan mediante una línea vertical, imitando la estética de builders de workflows.
- Cada nodo muestra:
  - Nombre del criterio
  - Campo y operador
  - Valor esperado
- Acciones sobre el canvas:
  - Arrastrar un criterio desde la izquierda para agregarlo.
  - Reordenar nodos con drag-and-drop.
  - Eliminar un nodo del canvas.

### Header del modal

- Campo editable para el nombre del bloque.
- Botón **"Guardar"** que persiste el orden de `criterion_ids` en el backend.

### Librería de canvas

Se utiliza **@xyflow/react** (React Flow v12) para:

- Renderizar nodos en columna con posiciones controladas.
- Dibujar edges automáticos entre nodos consecutivos.
- Soportar drag-and-drop para reordenar.
- Mantener una UX familiar y escalable.

## Detalle del Plan — Ejecución de Bloques

En `app/dashboard/[id]/page.tsx` se agrega una nueva card en la columna lateral derecha (junto a la línea de tiempo).

### Card "Validación"

Visible solo para `user.role === "authority"`.

- `Select` con los bloques activos de la autoridad (`GET /validation/blocks`).
- Botón **"Ejecutar bloque"**.
- Al ejecutar, se llama `POST /validation/run` con `flight_plan_id` y `block_id`.
- El resultado se muestra inline en la misma card:
  - Badge del `overall`:
    - `approved` → verde
    - `warned` → amarillo
    - `rejected` → rojo
  - Lista expandible/colapsable de cada criterio evaluado, con:
    - Ícono de check o cross
    - Nombre del criterio
    - Valor esperado vs. actual
    - Mensaje personalizado (si existe)

## Permisos

- El ítem del sidebar, la ruta `/dashboard/blocks` y la card de validación en el detalle del plan se condicionan a `user.role === "authority"`.
- El backend es la última línea de defensa: cualquier petición de otro rol devuelve 403.

## Estados de Carga y Error

- Se reutilizan los patrones existentes:
  - `Skeleton` para estados de carga.
  - Mensajes de error con botón "Reintentar".
  - Toasts de Sonner para confirmar creación, edición, eliminación y errores de ejecución.

## Dependencias Nuevas

```json
"@xyflow/react": "^12.0.0"
```

## Testing

- Verificar que la lista de criterios se carga correctamente desde `/validation/criteria`.
- Verificar que el formulario de criterios valida con Zod y deshabilita el valor esperado para `is_present` / `is_absent`.
- Verificar que el canvas de bloques persiste el orden de `criterion_ids`.
- Verificar que `POST /validation/run` se ejecuta con `block_id` y el resultado se renderiza en la card lateral.
- Verificar que la funcionalidad no es visible para roles distintos de `authority`.

## Decisiones Tomadas

| Decisión | Justificación |
|---|---|
| Canvas lineal sin ramas reales | El backend `POST /validation/run` ejecuta todos los criterios y devuelve un `overall` único. No hay lógica de ramificación en la API. |
| Bloques persistidos en backend | El usuario confirmó que el backend ahora tiene `/validation/blocks`. Evita perder configuración entre navegadores. |
| Tabs "Mis criterios" / "Mis bloques" | Mantiene la navegación limpia y deja clara la relación de dependencia: primero criterios, después bloques. |
| React Flow para el canvas | Estándar de la industria para builders visuales de nodos; permite la estética solicitada sin implementar drag-and-drop y SVG desde cero. |
| Resultado inline en el detalle del plan | El usuario pidió mostrarlo al costado, junto a la línea de tiempo. |
