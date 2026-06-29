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
            <Button variant="ghost" size="icon" onClick={() => onEdit(block)}>
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
