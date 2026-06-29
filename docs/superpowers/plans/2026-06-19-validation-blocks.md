# Bloques de Validación — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar al dashboard una sección de bloques de validación para el rol `authority`, permitiendo crear criterios, armar bloques visuales lineales y ejecutarlos sobre planes de vuelo.

**Architecture:** Extender tipos y API del backend, crear componentes modulares para criterios/bloques con React Flow para el canvas, e integrar un panel de ejecución en el detalle del plan.

**Tech Stack:** Next.js 16, React 19, TypeScript, TanStack Query, shadcn/ui, React Hook Form + Zod, React Flow, Tailwind CSS v4, Lucide.

---

## File Structure

```
src/
├── types/api.ts                                   # modify
├── lib/api/validation.ts                          # create
├── lib/utils/validation-labels.ts                 # create
├── app/dashboard/blocks/page.tsx                  # create
├── components/layout/sidebar.tsx                  # modify
├── components/dashboard/flight-plan-detail-view.tsx # modify
├── components/blocks/
│   ├── criteria-tab.tsx                           # create
│   ├── criteria-table.tsx                         # create
│   ├── criterion-form-dialog.tsx                  # create
│   ├── blocks-tab.tsx                             # create
│   ├── block-card.tsx                             # create
│   ├── block-editor-dialog.tsx                    # create
│   ├── validation-canvas.tsx                      # create
│   ├── criterion-node.tsx                         # create
│   └── validation-panel.tsx                       # create
```

---

## Task 1: Instalar dependencias y componentes shadcn

**Files:**
- Modify: `package.json`
- Create: `src/components/ui/select.tsx`, `src/components/ui/tabs.tsx`, `src/components/ui/switch.tsx`, `src/components/ui/scroll-area.tsx`

- [ ] **Step 1: Instalar React Flow**

```bash
npm install @xyflow/react
```

- [ ] **Step 2: Instalar componentes shadcn necesarios**

```bash
npx shadcn add select tabs switch scroll-area
```

- [ ] **Step 3: Verificar que los componentes se crearon**

```bash
ls src/components/ui/select.tsx src/components/ui/tabs.tsx src/components/ui/switch.tsx src/components/ui/scroll-area.tsx
```

Expected: los cuatro archivos existen.

- [ ] **Step 4: Verificar build sin errores de dependencias**

```bash
npm run build
```

Expected: build exitoso (puede tener warnings de código futuro, pero no errores de dependencias).

---

## Task 2: Extender tipos de API

**Files:**
- Modify: `src/types/api.ts`

- [ ] **Step 1: Agregar tipos de validación al final de `src/types/api.ts`**

```ts
// ── Validation Engine ──

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

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

## Task 3: Crear servicio de API de validación

**Files:**
- Create: `src/lib/api/validation.ts`

- [ ] **Step 1: Crear `src/lib/api/validation.ts` con todos los endpoints**

```ts
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
```

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

## Task 4: Crear utilidad de labels de operadores

**Files:**
- Create: `src/lib/utils/validation-labels.ts`

- [ ] **Step 1: Crear `src/lib/utils/validation-labels.ts`**

```ts
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
```

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

## Task 5: Actualizar sidebar y crear ruta de bloques

**Files:**
- Modify: `src/components/layout/sidebar.tsx`
- Create: `src/app/dashboard/blocks/page.tsx`

- [ ] **Step 1: Modificar `src/components/layout/sidebar.tsx` para agregar el ítem de bloques**

Reemplazar el import de Lucide:

```ts
import { LayoutDashboard, Plane, LogOut, ChevronDown, Workflow } from "lucide-react";
```

Y agregar el link dentro del `<nav>`:

```tsx
{user?.role === "authority" && (
  <Link
    href="/dashboard/blocks"
    className={cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      pathname === "/dashboard/blocks"
        ? "bg-blue-50 text-blue-700"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    )}
  >
    <Workflow className="h-4 w-4" />
    Bloques de validación
  </Link>
)}
```

- [ ] **Step 2: Crear `src/app/dashboard/blocks/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CriteriaTab } from "@/components/blocks/criteria-tab";
import { BlocksTab } from "@/components/blocks/blocks-tab";

export default function BlocksPage() {
  const [activeTab, setActiveTab] = useState<"criteria" | "blocks">("criteria");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Bloques de validación
        </h1>
        <p className="text-muted-foreground mt-1">
          Creá criterios y armá bloques para evaluar planes de vuelo.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "criteria" | "blocks")}
      >
        <TabsList>
          <TabsTrigger value="criteria">Mis criterios</TabsTrigger>
          <TabsTrigger value="blocks">Mis bloques</TabsTrigger>
        </TabsList>
        <TabsContent value="criteria" className="mt-6">
          <CriteriaTab />
        </TabsContent>
        <TabsContent value="blocks" className="mt-6">
          <BlocksTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 3: Verificar tipos**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

## Task 6: Crear formulario y tabla de criterios

**Files:**
- Create: `src/components/blocks/criteria-table.tsx`
- Create: `src/components/blocks/criterion-form-dialog.tsx`
- Create: `src/components/blocks/criteria-tab.tsx`

- [ ] **Step 1: Crear `src/components/blocks/criteria-table.tsx`**

```tsx
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { OPERATOR_LABELS, RESULT_LABELS } from "@/lib/utils/validation-labels";
import type { ValidationCriterion, ValidationField } from "@/types/api";
import { Pencil, Trash2 } from "lucide-react";

interface CriteriaTableProps {
  criteria: ValidationCriterion[];
  fields: ValidationField[];
  onEdit: (criterion: ValidationCriterion) => void;
  onDelete: (id: string) => void;
  isDeleting?: string | null;
}

export function CriteriaTable({
  criteria,
  fields,
  onEdit,
  onDelete,
  isDeleting,
}: CriteriaTableProps) {
  const fieldByPath = new Map(fields.map((f) => [f.field_path, f]));

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Campo</TableHead>
            <TableHead>Operador</TableHead>
            <TableHead>Valor esperado</TableHead>
            <TableHead>Si pasa</TableHead>
            <TableHead>Si falla</TableHead>
            <TableHead className="w-24">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {criteria.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                No hay criterios creados.
              </TableCell>
            </TableRow>
          )}
          {criteria.map((criterion) => (
            <TableRow key={criterion.id}>
              <TableCell className="font-medium">{criterion.name}</TableCell>
              <TableCell>
                {fieldByPath.get(criterion.field_path)?.label ?? criterion.field_path}
              </TableCell>
              <TableCell>{OPERATOR_LABELS[criterion.operator]}</TableCell>
              <TableCell>{criterion.expected_value ?? "—"}</TableCell>
              <TableCell>{RESULT_LABELS[criterion.result_on_pass]}</TableCell>
              <TableCell>{RESULT_LABELS[criterion.result_on_fail]}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(criterion)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(criterion.id)}
                    disabled={isDeleting === criterion.id}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
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

- [ ] **Step 2: Crear `src/components/blocks/criterion-form-dialog.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ValidationCriterion, ValidationField } from "@/types/api";
import { OPERATOR_LABELS, RESULT_LABELS } from "@/lib/utils/validation-labels";

const operators = Object.keys(OPERATOR_LABELS) as Array<
  ValidationCriterion["operator"]
>;
const results = Object.keys(RESULT_LABELS) as Array<
  ValidationCriterion["result_on_pass"]
>;

const schema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  field_path: z.string().min(1, "El campo es requerido"),
  operator: z.enum([
    "eq",
    "neq",
    "gt",
    "gte",
    "lt",
    "lte",
    "contains",
    "not_contains",
    "is_present",
    "is_absent",
  ]),
  expected_value: z.string().nullable(),
  result_on_pass: z.enum(["approve", "warn", "reject"]),
  result_on_fail: z.enum(["approve", "warn", "reject"]),
  pass_message: z.string().nullable(),
  fail_message: z.string().nullable(),
});

type FormData = z.infer<typeof schema>;

interface CriterionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fields: ValidationField[];
  criterion?: ValidationCriterion | null;
  onSubmit: (data: FormData) => void;
  isLoading?: boolean;
}

export function CriterionFormDialog({
  open,
  onOpenChange,
  fields,
  criterion,
  onSubmit,
  isLoading,
}: CriterionFormDialogProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      field_path: "",
      operator: "eq",
      expected_value: "",
      result_on_pass: "approve",
      result_on_fail: "reject",
      pass_message: "",
      fail_message: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: criterion?.name ?? "",
        field_path: criterion?.field_path ?? "",
        operator: criterion?.operator ?? "eq",
        expected_value: criterion?.expected_value ?? "",
        result_on_pass: criterion?.result_on_pass ?? "approve",
        result_on_fail: criterion?.result_on_fail ?? "reject",
        pass_message: criterion?.pass_message ?? "",
        fail_message: criterion?.fail_message ?? "",
      });
    }
  }, [open, criterion, form]);

  const operator = form.watch("operator");
  const valueDisabled = operator === "is_present" || operator === "is_absent";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {criterion ? "Editar criterio" : "Nuevo criterio"}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-4 py-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-xs text-red-600">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="field_path">Campo a evaluar</Label>
              <Select
                value={form.watch("field_path")}
                onValueChange={(value) => form.setValue("field_path", value)}
              >
                <SelectTrigger id="field_path">
                  <SelectValue placeholder="Seleccionar campo" />
                </SelectTrigger>
                <SelectContent>
                  {fields.map((field) => (
                    <SelectItem key={field.field_path} value={field.field_path}>
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.field_path && (
                <p className="text-xs text-red-600">
                  {form.formState.errors.field_path.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="operator">Operador</Label>
              <Select
                value={form.watch("operator")}
                onValueChange={(value) =>
                  form.setValue("operator", value as ValidationCriterion["operator"])
                }
              >
                <SelectTrigger id="operator">
                  <SelectValue placeholder="Seleccionar operador" />
                </SelectTrigger>
                <SelectContent>
                  {operators.map((op) => (
                    <SelectItem key={op} value={op}>
                      {OPERATOR_LABELS[op]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="expected_value">Valor esperado</Label>
            <Input
              id="expected_value"
              {...form.register("expected_value")}
              disabled={valueDisabled}
              placeholder={valueDisabled ? "No aplica" : "Valor a comparar"}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="result_on_pass">Si pasa</Label>
              <Select
                value={form.watch("result_on_pass")}
                onValueChange={(value) =>
                  form.setValue(
                    "result_on_pass",
                    value as ValidationCriterion["result_on_pass"]
                  )
                }
              >
                <SelectTrigger id="result_on_pass">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {results.map((r) => (
                    <SelectItem key={r} value={r}>
                      {RESULT_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="result_on_fail">Si falla</Label>
              <Select
                value={form.watch("result_on_fail")}
                onValueChange={(value) =>
                  form.setValue(
                    "result_on_fail",
                    value as ValidationCriterion["result_on_fail"]
                  )
                }
              >
                <SelectTrigger id="result_on_fail">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {results.map((r) => (
                    <SelectItem key={r} value={r}>
                      {RESULT_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pass_message">Mensaje si pasa (opcional)</Label>
            <Textarea id="pass_message" {...form.register("pass_message")} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="fail_message">Mensaje si falla (opcional)</Label>
            <Textarea id="fail_message" {...form.register("fail_message")} />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: Crear `src/components/blocks/criteria-tab.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  listCriteria,
  listValidationFields,
  createCriterion,
  updateCriterion,
  deleteCriterion,
} from "@/lib/api/validation";
import { CriteriaTable } from "./criteria-table";
import { CriterionFormDialog } from "./criterion-form-dialog";
import type { ValidationCriterion } from "@/types/api";

export function CriteriaTab() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCriterion, setEditingCriterion] =
    useState<ValidationCriterion | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: criteria = [], isLoading: isLoadingCriteria } = useQuery({
    queryKey: ["validation-criteria"],
    queryFn: listCriteria,
  });

  const { data: fields = [], isLoading: isLoadingFields } = useQuery({
    queryKey: ["validation-fields"],
    queryFn: listValidationFields,
  });

  const createMutation = useMutation({
    mutationFn: createCriterion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["validation-criteria"] });
      toast.success("Criterio creado");
      setDialogOpen(false);
    },
    onError: () => toast.error("No se pudo crear el criterio"),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof updateCriterion>[1];
    }) => updateCriterion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["validation-criteria"] });
      toast.success("Criterio actualizado");
      setDialogOpen(false);
      setEditingCriterion(null);
    },
    onError: () => toast.error("No se pudo actualizar el criterio"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCriterion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["validation-criteria"] });
      toast.success("Criterio eliminado");
    },
    onError: () => toast.error("No se pudo eliminar el criterio"),
    onSettled: () => setDeletingId(null),
  });

  const handleSubmit = (data: {
    name: string;
    field_path: string;
    operator: ValidationCriterion["operator"];
    expected_value: string | null;
    result_on_pass: ValidationCriterion["result_on_pass"];
    result_on_fail: ValidationCriterion["result_on_fail"];
    pass_message: string | null;
    fail_message: string | null;
  }) => {
    const payload = {
      ...data,
      expected_value:
        data.operator === "is_present" || data.operator === "is_absent"
          ? null
          : data.expected_value,
    };

    if (editingCriterion) {
      updateMutation.mutate({ id: editingCriterion.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (criterion: ValidationCriterion) => {
    setEditingCriterion(criterion);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    deleteMutation.mutate(id);
  };

  const isLoading = isLoadingCriteria || isLoadingFields;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Mis criterios</h2>
        <Button
          onClick={() => {
            setEditingCriterion(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo criterio
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : (
        <CriteriaTable
          criteria={criteria}
          fields={fields}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isDeleting={deletingId}
        />
      )}

      <CriterionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        fields={fields}
        criterion={editingCriterion}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
```

- [ ] **Step 4: Verificar tipos**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

## Task 7: Crear lista y tarjetas de bloques

**Files:**
- Create: `src/components/blocks/block-card.tsx`
- Create: `src/components/blocks/blocks-tab.tsx`

- [ ] **Step 1: Crear `src/components/blocks/block-card.tsx`**

```tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash2 } from "lucide-react";
import type { ValidationBlock } from "@/types/api";

interface BlockCardProps {
  block: ValidationBlock;
  onEdit: (block: ValidationBlock) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  isDeleting?: boolean;
  isToggling?: boolean;
}

export function BlockCard({
  block,
  onEdit,
  onDelete,
  onToggleActive,
  isDeleting,
  isToggling,
}: BlockCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{block.name}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {block.criteria_count} criterio
              {block.criteria_count === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(block)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(block.id)}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Switch
            checked={block.is_active}
            onCheckedChange={(checked) => onToggleActive(block.id, checked)}
            disabled={isToggling}
          />
          <span className="text-sm text-muted-foreground">
            {block.is_active ? "Activo" : "Inactivo"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Crear `src/components/blocks/blocks-tab.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  listBlocks,
  createBlock,
  updateBlock,
  deleteBlock,
} from "@/lib/api/validation";
import { BlockCard } from "./block-card";
import { BlockEditorDialog } from "./block-editor-dialog";
import type { ValidationBlock } from "@/types/api";

export function BlocksTab() {
  const queryClient = useQueryClient();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ValidationBlock | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data: blocks = [], isLoading } = useQuery({
    queryKey: ["validation-blocks"],
    queryFn: listBlocks,
  });

  const createMutation = useMutation({
    mutationFn: createBlock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["validation-blocks"] });
      toast.success("Bloque creado");
      setEditorOpen(false);
      setEditingBlock(null);
    },
    onError: () => toast.error("No se pudo crear el bloque"),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof updateBlock>[1];
    }) => updateBlock(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["validation-blocks"] });
      toast.success("Bloque actualizado");
      setEditorOpen(false);
      setEditingBlock(null);
    },
    onError: () => toast.error("No se pudo actualizar el bloque"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBlock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["validation-blocks"] });
      toast.success("Bloque eliminado");
    },
    onError: () => toast.error("No se pudo eliminar el bloque"),
    onSettled: () => setDeletingId(null),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateBlock(id, { is_active: isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["validation-blocks"] });
    },
    onError: () => toast.error("No se pudo cambiar el estado"),
    onSettled: () => setTogglingId(null),
  });

  const handleSave = (name: string, criterionIds: string[]) => {
    if (editingBlock) {
      updateMutation.mutate({
        id: editingBlock.id,
        data: { name, criterion_ids: criterionIds },
      });
    } else {
      createMutation.mutate({ name, criterion_ids: criterionIds });
    }
  };

  const handleEdit = (block: ValidationBlock) => {
    setEditingBlock(block);
    setEditorOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    deleteMutation.mutate(id);
  };

  const handleToggleActive = (id: string, isActive: boolean) => {
    setTogglingId(id);
    toggleMutation.mutate({ id, isActive });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Mis bloques</h2>
        <Button
          onClick={() => {
            setEditingBlock(null);
            setEditorOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo bloque
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : blocks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay bloques creados.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {blocks.map((block) => (
            <BlockCard
              key={block.id}
              block={block}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
              isDeleting={deletingId === block.id}
              isToggling={togglingId === block.id}
            />
          ))}
        </div>
      )}

      <BlockEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        block={editingBlock}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
```

- [ ] **Step 3: Verificar tipos**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

## Task 8: Crear editor de bloque con React Flow

**Files:**
- Create: `src/components/blocks/criterion-node.tsx`
- Create: `src/components/blocks/validation-canvas.tsx`
- Create: `src/components/blocks/block-editor-dialog.tsx`

- [ ] **Step 1: Crear `src/components/blocks/criterion-node.tsx`**

```tsx
"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OPERATOR_LABELS } from "@/lib/utils/validation-labels";
import type { ValidationCriterion } from "@/types/api";

export interface CriterionNodeData {
  criterion: ValidationCriterion;
  onRemove: (id: string) => void;
}

function CriterionNodeComponent({ data }: NodeProps<CriterionNodeData>) {
  const { criterion, onRemove } = data;

  return (
    <div className="w-64 rounded-lg border bg-white p-3 shadow-sm">
      <Handle type="target" position={Position.Top} className="!bg-blue-500" />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{criterion.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {criterion.field_path}
          </p>
          <p className="text-xs text-muted-foreground">
            {OPERATOR_LABELS[criterion.operator]}{" "}
            {criterion.expected_value ? criterion.expected_value : ""}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={() => onRemove(criterion.id)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-blue-500"
      />
    </div>
  );
}

export const CriterionNode = memo(CriterionNodeComponent);
```

- [ ] **Step 2: Crear `src/components/blocks/validation-canvas.tsx`**

```tsx
"use client";

import { useCallback, useEffect, useMemo } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Edge,
  type Node,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { CriterionNode, type CriterionNodeData } from "./criterion-node";
import type { ValidationCriterion } from "@/types/api";

const nodeTypes = {
  criterion: CriterionNode,
};

interface ValidationCanvasProps {
  criteria: ValidationCriterion[];
  selectedCriterionIds: string[];
  onSelectedChange: (ids: string[]) => void;
}

function buildNodes(
  criteria: ValidationCriterion[],
  selectedIds: string[],
  onRemove: (id: string) => void
): Node<CriterionNodeData>[] {
  return selectedIds
    .map((id) => criteria.find((c) => c.id === id))
    .filter((c): c is ValidationCriterion => Boolean(c))
    .map((criterion, index) => ({
      id: criterion.id,
      type: "criterion",
      position: { x: 0, y: index * 120 },
      data: { criterion, onRemove },
      draggable: true,
    }));
}

function buildEdges(selectedIds: string[]): Edge[] {
  const edges: Edge[] = [];
  for (let i = 0; i < selectedIds.length - 1; i++) {
    edges.push({
      id: `e-${selectedIds[i]}-${selectedIds[i + 1]}`,
      source: selectedIds[i],
      target: selectedIds[i + 1],
      markerEnd: { type: MarkerType.ArrowClosed },
      animated: true,
    });
  }
  return edges;
}

export function ValidationCanvas({
  criteria,
  selectedCriterionIds,
  onSelectedChange,
}: ValidationCanvasProps) {
  const handleRemove = useCallback(
    (id: string) => {
      onSelectedChange(selectedCriterionIds.filter((cid) => cid !== id));
    },
    [selectedCriterionIds, onSelectedChange]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<CriterionNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    setNodes(buildNodes(criteria, selectedCriterionIds, handleRemove));
    setEdges(buildEdges(selectedCriterionIds));
  }, [criteria, selectedCriterionIds, handleRemove, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Parameters<typeof addEdge>[0]) =>
      setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="h-[500px] w-full rounded-md border">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable
        nodesConnectable={false}
        edgesFocusable={false}
      >
        <Controls />
        <Background gap={16} size={1} />
      </ReactFlow>
    </div>
  );
}
```

- [ ] **Step 3: Crear `src/components/blocks/block-editor-dialog.tsx`**

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { listCriteria } from "@/lib/api/validation";
import { ValidationCanvas } from "./validation-canvas";
import type { ValidationBlock } from "@/types/api";

interface BlockEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  block: ValidationBlock | null;
  onSave: (name: string, criterionIds: string[]) => void;
  isLoading?: boolean;
}

export function BlockEditorDialog({
  open,
  onOpenChange,
  block,
  onSave,
  isLoading,
}: BlockEditorDialogProps) {
  const [name, setName] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: criteria = [] } = useQuery({
    queryKey: ["validation-criteria"],
    queryFn: listCriteria,
  });

  useEffect(() => {
    if (open) {
      setName(block?.name ?? "Nuevo bloque");
      setSelectedIds(block?.criteria.map((c) => c.id) ?? []);
    }
  }, [open, block]);

  const availableCriteria = useMemo(
    () => criteria.filter((c) => !selectedIds.includes(c.id)),
    [criteria, selectedIds]
  );

  const handleAddCriterion = (id: string) => {
    setSelectedIds((prev) => [...prev, id]);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim(), selectedIds);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {block ? "Editar bloque" : "Nuevo bloque"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4 flex-1 min-h-0">
          <div className="grid gap-2">
            <Label htmlFor="block-name">Nombre del bloque</Label>
            <Input
              id="block-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Validación corredor SABE-SAEZ"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0">
            <div className="md:col-span-1 border rounded-md p-3 flex flex-col">
              <h3 className="text-sm font-medium mb-2">Criterios disponibles</h3>
              <ScrollArea className="flex-1">
                <div className="space-y-2 pr-3">
                  {availableCriteria.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No hay criterios disponibles.
                    </p>
                  )}
                  {availableCriteria.map((criterion) => (
                    <button
                      key={criterion.id}
                      type="button"
                      onClick={() => handleAddCriterion(criterion.id)}
                      className="w-full text-left rounded-md border p-2 text-xs hover:bg-gray-50 transition-colors"
                    >
                      <p className="font-medium truncate">{criterion.name}</p>
                      <p className="text-muted-foreground truncate">
                        {criterion.field_path}
                      </p>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="md:col-span-2 flex flex-col min-h-0">
              <h3 className="text-sm font-medium mb-2">Canvas del bloque</h3>
              <div className="flex-1 min-h-0">
                <ValidationCanvas
                  criteria={criteria}
                  selectedCriterionIds={selectedIds}
                  onSelectedChange={setSelectedIds}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isLoading || !name.trim() || selectedIds.length === 0}
          >
            {isLoading ? "Guardando..." : "Guardar bloque"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Verificar tipos**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

## Task 9: Integrar panel de validación en el detalle del plan

**Files:**
- Create: `src/components/blocks/validation-panel.tsx`
- Modify: `src/components/dashboard/flight-plan-detail-view.tsx`

- [ ] **Step 1: Crear `src/components/blocks/validation-panel.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listBlocks, runValidation } from "@/lib/api/validation";
import {
  OPERATOR_LABELS,
  OVERALL_LABELS,
  RESULT_LABELS,
} from "@/lib/utils/validation-labels";
import { CheckCircle2, XCircle, AlertTriangle, Play } from "lucide-react";
import { toast } from "sonner";
import type { ValidationRunResult } from "@/types/api";

interface ValidationPanelProps {
  flightPlanId: string;
}

const OVERALL_VARIANTS: Record<
  "approved" | "warned" | "rejected",
  "default" | "secondary" | "destructive" | "outline"
> = {
  approved: "default",
  warned: "secondary",
  rejected: "destructive",
};

export function ValidationPanel({ flightPlanId }: ValidationPanelProps) {
  const [selectedBlockId, setSelectedBlockId] = useState<string>("");
  const [result, setResult] = useState<ValidationRunResult | null>(null);

  const { data: blocks = [], isLoading } = useQuery({
    queryKey: ["validation-blocks"],
    queryFn: listBlocks,
  });

  const activeBlocks = blocks.filter((b) => b.is_active);

  const runMutation = useMutation({
    mutationFn: runValidation,
    onSuccess: (data) => {
      setResult(data);
      toast.success(`Resultado: ${OVERALL_LABELS[data.overall]}`);
    },
    onError: () => toast.error("No se pudo ejecutar el bloque"),
  });

  const handleRun = () => {
    if (!selectedBlockId) return;
    runMutation.mutate({ flight_plan_id: flightPlanId, block_id: selectedBlockId });
  };

  return (
    <Card className="sticky top-8">
      <CardHeader>
        <CardTitle className="text-base">Validación</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Bloque a ejecutar</label>
          <Select
            value={selectedBlockId}
            onValueChange={setSelectedBlockId}
            disabled={isLoading || activeBlocks.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar bloque" />
            </SelectTrigger>
            <SelectContent>
              {activeBlocks.map((block) => (
                <SelectItem key={block.id} value={block.id}>
                  {block.name} ({block.criteria_count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          className="w-full"
          onClick={handleRun}
          disabled={!selectedBlockId || runMutation.isPending}
        >
          <Play className="mr-2 h-4 w-4" />
          Ejecutar bloque
        </Button>

        {result && (
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Resultado general</span>
              <Badge variant={OVERALL_VARIANTS[result.overall]}>
                {OVERALL_LABELS[result.overall]}
              </Badge>
            </div>

            <div className="space-y-2">
              {result.results.map((item) => (
                <div
                  key={item.criterion_id}
                  className="rounded-md border p-2 text-xs space-y-1"
                >
                  <div className="flex items-center gap-2">
                    {item.passed ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : item.result_applied === "reject" ? (
                      <XCircle className="h-4 w-4 text-red-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    )}
                    <span className="font-medium">{item.criterion_name}</span>
                  </div>
                  <p className="text-muted-foreground">
                    {item.field_path} {OPERATOR_LABELS[item.operator]}{" "}
                    {item.expected_value}
                    {" → "}valor actual: {item.actual_value ?? "—"}
                  </p>
                  {item.message && (
                    <p className="text-muted-foreground">{item.message}</p>
                  )}
                  <p className="text-muted-foreground">
                    Aplicado: {RESULT_LABELS[item.result_applied]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Modificar `src/components/dashboard/flight-plan-detail-view.tsx` para integrar el panel**

Agregar al inicio del archivo la directiva de cliente:

```ts
"use client";
```

Agregar imports:

```ts
import { useAuth } from "@/lib/auth/auth-context";
import { ValidationPanel } from "@/components/blocks/validation-panel";
```

En el componente `FlightPlanDetailView`, agregar:

```ts
const { user } = useAuth();
const isAuthority = user?.role === "authority";
```

Y en la columna lateral (dentro del grid, junto a la card de Línea de Tiempo), agregar:

```tsx
{isAuthority && (
  <ValidationPanel flightPlanId={plan.id} />
)}
```

El layout final de la columna lateral quedaría:

```tsx
{/* Sidebar derecha */}
<div className="lg:col-span-1 space-y-6">
  {isAuthority && (
    <ValidationPanel flightPlanId={plan.id} />
  )}
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
```

- [ ] **Step 3: Verificar tipos**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

## Task 10: Build, lint y verificación final

**Files:**
- All modified/created files

- [ ] **Step 1: Ejecutar linter**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 2: Ejecutar build de producción**

```bash
npm run build
```

Expected: build exitoso.

- [ ] **Step 3: Verificar flujo manualmente en dev**

```bash
npm run dev
```

Luego abrir el navegador en `http://localhost:3000` y verificar:

1. Login con un usuario `authority`.
2. El sidebar muestra "Bloques de validación".
3. En `/dashboard/blocks`:
   - Tab "Mis criterios": crear un criterio.
   - Tab "Mis bloques": crear un bloque con varios criterios.
   - El canvas muestra los criterios conectados.
4. En el detalle de un plan de vuelo:
   - Aparece la card "Validación".
   - Seleccionar un bloque y ejecutar.
   - Se muestra el resultado general y el detalle por criterio.

- [ ] **Step 4: Commit final**

```bash
git add .
git commit -m "feat: add validation blocks section for authority"
```

---

## Spec Coverage Checklist

| Requerimiento del spec | Task que lo implementa |
|---|---|
| Extender tipos de validación | Task 2 |
| Crear servicio API de validación | Task 3 |
| Labels de operadores | Task 4 |
| Ruta `/dashboard/blocks` y sidebar | Task 5 |
| Tab "Mis criterios" con tabla y formulario | Task 6 |
| Tab "Mis bloques" con lista de tarjetas | Task 7 |
| Editor de bloque con canvas lineal (React Flow) | Task 8 |
| Panel de validación en detalle del plan | Task 9 |
| Verificación final | Task 10 |
