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
  const [editingBlock, setEditingBlock] = useState<ValidationBlock | null>(
    null
  );
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
        key={editingBlock?.id ?? "new"}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        block={editingBlock}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
