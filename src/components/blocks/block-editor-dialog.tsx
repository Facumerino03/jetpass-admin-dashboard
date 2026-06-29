"use client";

import { useMemo, useState } from "react";
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
  const [name, setName] = useState(block?.name ?? "Nuevo bloque");
  const [selectedIds, setSelectedIds] = useState<string[]>(
    block?.criteria.map((c) => c.id) ?? []
  );

  const { data: criteria = [] } = useQuery({
    queryKey: ["validation-criteria"],
    queryFn: listCriteria,
  });

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
              <h3 className="text-sm font-medium mb-2">
                Criterios disponibles
              </h3>
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
