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
              <TableCell
                colSpan={7}
                className="text-center text-muted-foreground"
              >
                No hay criterios creados.
              </TableCell>
            </TableRow>
          )}
          {criteria.map((criterion) => (
            <TableRow key={criterion.id}>
              <TableCell className="font-medium">{criterion.name}</TableCell>
              <TableCell>
                {fieldByPath.get(criterion.field_path)?.label ??
                  criterion.field_path}
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
