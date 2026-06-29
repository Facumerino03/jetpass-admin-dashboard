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
