"use client";

import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
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

  const fieldPath = useWatch({ control: form.control, name: "field_path" });
  const operator = useWatch({ control: form.control, name: "operator" });
  const resultOnPass = useWatch({
    control: form.control,
    name: "result_on_pass",
  });
  const resultOnFail = useWatch({
    control: form.control,
    name: "result_on_fail",
  });
  const valueDisabled = operator === "is_present" || operator === "is_absent";

  const fieldByPath = useMemo(
    () => new Map(fields.map((f) => [f.field_path, f])),
    [fields]
  );

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
                value={fieldPath}
                onValueChange={(value) =>
                  form.setValue("field_path", value ?? "")
                }
              >
                <SelectTrigger id="field_path" className="w-full">
                  <span className="flex-1 truncate text-left">
                    {fieldPath
                      ? fieldByPath.get(fieldPath)?.label ?? fieldPath
                      : "Seleccionar campo"}
                  </span>
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
                value={operator}
                onValueChange={(value) => {
                  if (!value) return;
                  form.setValue(
                    "operator",
                    value as ValidationCriterion["operator"]
                  );
                }}
              >
                <SelectTrigger id="operator" className="w-full">
                  <span className="flex-1 truncate text-left">
                    {operator
                      ? OPERATOR_LABELS[operator]
                      : "Seleccionar operador"}
                  </span>
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
                value={resultOnPass}
                onValueChange={(value) => {
                  if (!value) return;
                  form.setValue(
                    "result_on_pass",
                    value as ValidationCriterion["result_on_pass"]
                  );
                }}
              >
                <SelectTrigger id="result_on_pass" className="w-full">
                  <span className="flex-1 truncate text-left">
                    {resultOnPass ? RESULT_LABELS[resultOnPass] : "Si pasa"}
                  </span>
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
                value={resultOnFail}
                onValueChange={(value) => {
                  if (!value) return;
                  form.setValue(
                    "result_on_fail",
                    value as ValidationCriterion["result_on_fail"]
                  );
                }}
              >
                <SelectTrigger id="result_on_fail" className="w-full">
                  <span className="flex-1 truncate text-left">
                    {resultOnFail ? RESULT_LABELS[resultOnFail] : "Si falla"}
                  </span>
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
            <Label htmlFor="pass_message">
              Mensaje si pasa (opcional)
            </Label>
            <Textarea id="pass_message" {...form.register("pass_message")} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="fail_message">
              Mensaje si falla (opcional)
            </Label>
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
